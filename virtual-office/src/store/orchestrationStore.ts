import { create } from 'zustand';

export type ConversationPhase = 'gathering' | 'processing' | 'generating' | 'review' | 'complete';
export type IntentType = 'newsletter' | 'research' | 'unknown';

export interface Newsletter {
  id: string;
  subject: string;
  body: string;
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'pending-review' | 'approved' | 'rejected';
  feedback?: string;
}

export interface Conversation {
  id: string;
  chatId: string;
  phase: ConversationPhase;
  intent: IntentType;
  requiredFields: string[];
  collectedFields: Record<string, string>;
  assignedTo: string | null;
  result: Newsletter | null;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface OrchestrationState {
  conversations: Map<string, Conversation>;
  newsletters: Map<string, Newsletter>;

  // Actions
  startConversation: (chatId: string, initialMessage: string) => string;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  addMessageToConversation: (conversationId: string, role: 'user' | 'assistant', content: string) => void;
  setConversationPhase: (conversationId: string, phase: ConversationPhase) => void;
  assignConversation: (conversationId: string, freelancerId: string) => void;
  getConversationByChatId: (chatId: string) => Conversation | undefined;
  getActiveConversation: (chatId: string) => Conversation | undefined;

  // Newsletter actions
  createNewsletter: (conversationId: string, subject: string, body: string, createdBy: string) => string;
  getNewsletter: (id: string) => Newsletter | undefined;
  approveNewsletter: (id: string) => void;
  rejectNewsletter: (id: string, feedback: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useOrchestrationStore = create<OrchestrationState>((set, get) => ({
  conversations: new Map(),
  newsletters: new Map(),

  startConversation: (chatId: string, initialMessage: string) => {
    const id = generateId();
    const conversation: Conversation = {
      id,
      chatId,
      phase: 'gathering',
      intent: 'unknown',
      requiredFields: [],
      collectedFields: {},
      assignedTo: null,
      result: null,
      messages: [
        {
          role: 'user',
          content: initialMessage,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => {
      const newConversations = new Map(state.conversations);
      newConversations.set(id, conversation);
      return { conversations: newConversations };
    });

    return id;
  },

  updateConversation: (conversationId: string, updates: Partial<Conversation>) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      const conversation = newConversations.get(conversationId);
      if (conversation) {
        newConversations.set(conversationId, {
          ...conversation,
          ...updates,
          updatedAt: new Date(),
        });
      }
      return { conversations: newConversations };
    });
  },

  addMessageToConversation: (conversationId: string, role: 'user' | 'assistant', content: string) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      const conversation = newConversations.get(conversationId);
      if (conversation) {
        newConversations.set(conversationId, {
          ...conversation,
          messages: [
            ...conversation.messages,
            { role, content, timestamp: new Date() },
          ],
          updatedAt: new Date(),
        });
      }
      return { conversations: newConversations };
    });
  },

  setConversationPhase: (conversationId: string, phase: ConversationPhase) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      const conversation = newConversations.get(conversationId);
      if (conversation) {
        newConversations.set(conversationId, {
          ...conversation,
          phase,
          updatedAt: new Date(),
        });
      }
      return { conversations: newConversations };
    });
  },

  assignConversation: (conversationId: string, freelancerId: string) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      const conversation = newConversations.get(conversationId);
      if (conversation) {
        newConversations.set(conversationId, {
          ...conversation,
          assignedTo: freelancerId,
          phase: 'generating',
          updatedAt: new Date(),
        });
      }
      return { conversations: newConversations };
    });
  },

  getConversationByChatId: (chatId: string) => {
    const conversations = get().conversations;
    for (const conversation of conversations.values()) {
      if (conversation.chatId === chatId) {
        return conversation;
      }
    }
    return undefined;
  },

  getActiveConversation: (chatId: string) => {
    const conversations = get().conversations;
    for (const conversation of conversations.values()) {
      if (conversation.chatId === chatId && conversation.phase !== 'complete') {
        return conversation;
      }
    }
    return undefined;
  },

  createNewsletter: (conversationId: string, subject: string, body: string, createdBy: string) => {
    const id = generateId();
    const newsletter: Newsletter = {
      id,
      subject,
      body,
      createdBy,
      createdAt: new Date(),
      status: 'pending-review',
    };

    set((state) => {
      const newNewsletters = new Map(state.newsletters);
      newNewsletters.set(id, newsletter);

      const newConversations = new Map(state.conversations);
      const conversation = newConversations.get(conversationId);
      if (conversation) {
        newConversations.set(conversationId, {
          ...conversation,
          result: newsletter,
          phase: 'review',
          updatedAt: new Date(),
        });
      }

      return { newsletters: newNewsletters, conversations: newConversations };
    });

    return id;
  },

  getNewsletter: (id: string) => {
    return get().newsletters.get(id);
  },

  approveNewsletter: (id: string) => {
    set((state) => {
      const newNewsletters = new Map(state.newsletters);
      const newsletter = newNewsletters.get(id);
      if (newsletter) {
        newNewsletters.set(id, { ...newsletter, status: 'approved' });
      }

      // Also update the conversation
      const newConversations = new Map(state.conversations);
      for (const [convId, conv] of newConversations) {
        if (conv.result?.id === id) {
          newConversations.set(convId, {
            ...conv,
            phase: 'complete',
            result: { ...conv.result, status: 'approved' },
            updatedAt: new Date(),
          });
        }
      }

      return { newsletters: newNewsletters, conversations: newConversations };
    });
  },

  rejectNewsletter: (id: string, feedback: string) => {
    set((state) => {
      const newNewsletters = new Map(state.newsletters);
      const newsletter = newNewsletters.get(id);
      if (newsletter) {
        newNewsletters.set(id, { ...newsletter, status: 'rejected', feedback });
      }

      // Also update the conversation phase back to gathering for revision
      const newConversations = new Map(state.conversations);
      for (const [convId, conv] of newConversations) {
        if (conv.result?.id === id) {
          newConversations.set(convId, {
            ...conv,
            phase: 'gathering',
            result: { ...conv.result, status: 'rejected', feedback },
            updatedAt: new Date(),
          });
        }
      }

      return { newsletters: newNewsletters, conversations: newConversations };
    });
  },
}));
