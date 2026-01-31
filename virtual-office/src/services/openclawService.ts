import { useOfficeStore } from '../store/officeStore';
import type { TelegramMessageType } from '../types';

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

  private handleMessage(data: any) {
    console.log('Received from proxy:', data);

    // Handle connection confirmation
    if (data.type === 'connected') {
      console.log('Proxy connection confirmed');
      return;
    }

    // Handle Telegram messages
    if (data.type === 'telegram:message') {
      const messageType = (data.messageType || 'text') as TelegramMessageType;

      useOfficeStore.getState().addTelegramMessage({
        chatId: data.chatId || 'telegram',
        from: data.from || 'User',
        type: messageType,
        content: data.content || '[Message]',
      });

      // Update orchestrator status
      useOfficeStore.getState().updateFreelancer('orchestrator', {
        status: 'working',
        currentTask: `Processing: ${(data.content || '').slice(0, 30)}...`,
      });
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
