import { useOfficeStore } from '../store/officeStore';
import { useOrchestrationStore } from '../store/orchestrationStore';
import type { TelegramMessageType } from '../types';
import {
  analyzeIntent,
  extractInfo,
  checkCompleteness,
  generateNewsletter,
  generateClarifyingQuestion,
} from './aiService';
import { sendToTelegram } from './telegramService';

const PROXY_BASE = 'http://localhost:3001';
const PROXY_URL = `${PROXY_BASE}/events`;
const HISTORY_URL = `${PROXY_BASE}/history`;

class OpenClawService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;

  connect() {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('Already connected to proxy');
      return;
    }

    console.log('Connecting to MoneyChat proxy...');

    try {
      this.eventSource = new EventSource(PROXY_URL);

      this.eventSource.onopen = async () => {
        console.log('Connected to MoneyChat proxy!');
        this.reconnectAttempts = 0;
        useOfficeStore.getState().setConnected(true);

        // Load message history on connect
        await this.loadHistory();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        useOfficeStore.getState().setConnected(false);
        this.eventSource?.close();
        this.eventSource = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private async handleMessage(data: any) {
    console.log('Received from proxy:', data);

    // Handle connection confirmation
    if (data.type === 'connected') {
      console.log('Proxy connection confirmed');
      return;
    }

    // Handle Telegram messages
    if (data.type === 'telegram:message') {
      const messageType = (data.messageType || 'text') as TelegramMessageType;
      const chatId = data.chatId || 'telegram';
      const content = data.content || '[Message]';

      useOfficeStore.getState().addTelegramMessage({
        chatId,
        from: data.from || 'User',
        type: messageType,
        content,
      });

      // Update orchestrator status
      useOfficeStore.getState().updateFreelancer('orchestrator', {
        status: 'working',
        currentTask: `Processing: ${content.slice(0, 30)}...`,
      });

      // Process through orchestration flow
      await this.processOrchestration(chatId, content);
    }

    // Handle outgoing message confirmations
    if (data.type === 'telegram:outgoing') {
      console.log('Outgoing message sent:', data.message?.slice(0, 50));
    }

    // Handle newsletter status updates
    if (data.type === 'newsletter:approved' || data.type === 'newsletter:rejected') {
      console.log(`Newsletter ${data.newsletterId} ${data.type.split(':')[1]}`);
      // The stores are updated via the review page, but we could sync here too
    }
  }

  private async processOrchestration(chatId: string, content: string) {
    const orchestrationStore = useOrchestrationStore.getState();
    const officeStore = useOfficeStore.getState();

    // Check for existing active conversation
    let conversation = orchestrationStore.getActiveConversation(chatId);

    if (!conversation) {
      // Start new conversation
      console.log('[ORCH] Starting new conversation');
      const conversationId = orchestrationStore.startConversation(chatId, content);
      conversation = orchestrationStore.conversations.get(conversationId)!;

      // Analyze intent
      const intentAnalysis = await analyzeIntent(content);
      console.log('[ORCH] Intent analysis:', intentAnalysis);

      orchestrationStore.updateConversation(conversationId, {
        intent: intentAnalysis.intent,
        phase: 'gathering',
      });

      if (intentAnalysis.intent === 'newsletter') {
        // Set required fields for newsletter
        orchestrationStore.updateConversation(conversationId, {
          requiredFields: ['topic', 'audience', 'tone'],
        });
      }

      conversation = orchestrationStore.conversations.get(conversationId)!;
    } else {
      // Add message to existing conversation
      orchestrationStore.addMessageToConversation(conversation.id, 'user', content);
    }

    // Extract information from the message
    const extractedInfo = await extractInfo(content, conversation.collectedFields);
    console.log('[ORCH] Extracted info:', extractedInfo);

    // Merge extracted info
    const updatedFields = { ...conversation.collectedFields };
    for (const [key, value] of Object.entries(extractedInfo)) {
      if (value) {
        updatedFields[key] = value;
      }
    }
    orchestrationStore.updateConversation(conversation.id, {
      collectedFields: updatedFields,
    });

    // Refresh conversation state
    conversation = orchestrationStore.conversations.get(conversation.id)!;

    // Check if we have enough info
    orchestrationStore.setConversationPhase(conversation.id, 'processing');
    const completeness = await checkCompleteness(conversation);
    console.log('[ORCH] Completeness check:', completeness);

    if (!completeness.complete) {
      // Need more info - ask clarifying question
      const question = await generateClarifyingQuestion(conversation);
      console.log('[ORCH] Asking:', question);

      orchestrationStore.addMessageToConversation(conversation.id, 'assistant', question);
      orchestrationStore.setConversationPhase(conversation.id, 'gathering');

      // Send to Telegram
      await sendToTelegram(chatId, question);

      // Update orchestrator status
      officeStore.updateFreelancer('orchestrator', {
        status: 'idle',
        currentTask: null,
      });
    } else {
      // We have enough info - route to copywriter
      console.log('[ORCH] Routing to copywriter Max');

      orchestrationStore.assignConversation(conversation.id, 'copywriter-1');
      orchestrationStore.setConversationPhase(conversation.id, 'generating');

      // Update freelancer statuses
      officeStore.updateFreelancer('orchestrator', {
        status: 'idle',
        currentTask: null,
      });
      officeStore.updateFreelancer('copywriter-1', {
        status: 'working',
        currentTask: 'Generating newsletter...',
      });

      // Generate the newsletter
      const topic = conversation.collectedFields.topic || content;
      const newsletter = await generateNewsletter(topic, conversation.collectedFields);
      console.log('[ORCH] Generated newsletter:', newsletter.subject);

      // Store newsletter
      const newsletterId = orchestrationStore.createNewsletter(
        conversation.id,
        newsletter.subject,
        newsletter.body,
        'Max'
      );

      // Store in proxy for review page access
      await this.storeNewsletterInProxy(newsletterId, {
        ...newsletter,
        chatId,
        createdBy: 'Max',
      });

      // Send preview link to Telegram
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      const reviewUrl = `${baseUrl}/review/${newsletterId}`;
      const previewMessage = `Your newsletter is ready! Review it here:\n${reviewUrl}`;

      await sendToTelegram(chatId, previewMessage);
      orchestrationStore.addMessageToConversation(conversation.id, 'assistant', previewMessage);

      // Update copywriter status
      officeStore.updateFreelancer('copywriter-1', {
        status: 'idle',
        currentTask: null,
        completedTasks: officeStore.freelancers.find((f) => f.id === 'copywriter-1')!.completedTasks + 1,
      });
    }
  }

  private async storeNewsletterInProxy(
    id: string,
    newsletter: { subject: string; body: string; chatId: string; createdBy: string }
  ) {
    try {
      await fetch(`${PROXY_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          subject: newsletter.subject,
          body: newsletter.body,
          chatId: newsletter.chatId,
          createdBy: newsletter.createdBy,
          createdAt: new Date().toISOString(),
          status: 'pending-review',
        }),
      });
    } catch (err) {
      console.error('Failed to store newsletter in proxy:', err);
    }
  }

  private async loadHistory() {
    try {
      console.log('Loading message history...');
      const response = await fetch(HISTORY_URL);
      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        console.log(`Loaded ${data.messages.length} messages from history`);
        for (const msg of data.messages) {
          const messageType = (msg.messageType || 'text') as TelegramMessageType;
          useOfficeStore.getState().addTelegramMessage({
            chatId: msg.chatId || 'telegram',
            from: msg.from || 'User',
            type: messageType,
            content: msg.content || '[Message]',
            timestamp: msg.timestamp,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    useOfficeStore.getState().setConnected(false);
  }
}

export const openclawService = new OpenClawService();
