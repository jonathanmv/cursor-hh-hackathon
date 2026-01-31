import { create } from 'zustand';
import type { Freelancer, Desk, Task, Message, TelegramMessage } from '../types';

interface OfficeState {
  freelancers: Freelancer[];
  desks: Desk[];
  tasks: Task[];
  messages: Message[];
  telegramMessages: TelegramMessage[];
  selectedFreelancer: string | null;
  showCollaborationSpace: boolean;
  isConnected: boolean;

  // Actions
  addFreelancer: (freelancer: Omit<Freelancer, 'id'>) => void;
  removeFreelancer: (id: string) => void;
  updateFreelancer: (id: string, updates: Partial<Freelancer>) => void;
  assignToDesk: (freelancerId: string, deskId: string) => void;
  removeFromDesk: (freelancerId: string) => void;
  selectFreelancer: (id: string | null) => void;
  setCollaborationSpace: (show: boolean) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  addTelegramMessage: (message: Omit<TelegramMessage, 'id' | 'processed' | 'timestamp'> & { id?: string; timestamp?: Date | string }) => void;
  routeTelegramMessage: (messageId: string, freelancerId: string) => void;
  completeTask: (freelancerId: string, messageId: string) => void;
  setConnected: (connected: boolean) => void;
}

const initialDesks: Desk[] = [
  // Reception desk for Orchestrator (front center)
  { id: 'desk-reception', position: [0, 0, 5], occupied: true, freelancerId: 'orchestrator' },
  // Developer desk (separate area)
  { id: 'desk-dev', position: [6, 0, 0], occupied: true, freelancerId: 'developer-mark' },
  // Regular desks
  { id: 'desk-1', position: [-3, 0, -2], occupied: false, freelancerId: null },
  { id: 'desk-2', position: [0, 0, -2], occupied: false, freelancerId: null },
  { id: 'desk-3', position: [3, 0, -2], occupied: false, freelancerId: null },
  { id: 'desk-4', position: [-3, 0, 2], occupied: false, freelancerId: null },
  { id: 'desk-5', position: [0, 0, 2], occupied: false, freelancerId: null },
  { id: 'desk-6', position: [3, 0, 2], occupied: false, freelancerId: null },
];

const initialFreelancers: Freelancer[] = [
  // Orchestrator - The "Telefonist" who receives all inputs
  {
    id: 'orchestrator',
    name: 'Alex',
    role: 'orchestrator',
    status: 'idle',
    trustLevel: 'expert',
    avatar: '#9C27B0', // Purple - special
    deskPosition: [0, 0, 5],
    currentTask: null,
    completedTasks: 0,
    approvalRate: 1.0,
    isSpecial: true,
  },
  // Mark - The Developer who handles infrastructure changes
  {
    id: 'developer-mark',
    name: 'Mark',
    role: 'developer',
    status: 'idle',
    trustLevel: 'expert',
    avatar: '#E91E63', // Pink - developer
    deskPosition: [6, 0, 0],
    currentTask: null,
    completedTasks: 127,
    approvalRate: 0.98,
    isSpecial: true,
  },
  // Regular freelancers
  {
    id: 'copywriter-1',
    name: 'Max',
    role: 'copywriter',
    status: 'idle',
    trustLevel: 'junior',
    avatar: '#4CAF50',
    deskPosition: null,
    currentTask: null,
    completedTasks: 12,
    approvalRate: 0.85,
  },
  {
    id: 'accountant-1',
    name: 'Lisa',
    role: 'accountant',
    status: 'idle',
    trustLevel: 'senior',
    avatar: '#2196F3',
    deskPosition: null,
    currentTask: null,
    completedTasks: 45,
    approvalRate: 0.95,
  },
  {
    id: 'researcher-1',
    name: 'Sam',
    role: 'researcher',
    status: 'idle',
    trustLevel: 'apprentice',
    avatar: '#FF9800',
    deskPosition: null,
    currentTask: null,
    completedTasks: 3,
    approvalRate: 0.67,
  },
];

export const useOfficeStore = create<OfficeState>((set, _get) => ({
  freelancers: initialFreelancers,
  desks: initialDesks,
  tasks: [],
  messages: [],
  telegramMessages: [],
  selectedFreelancer: null,
  showCollaborationSpace: false,
  isConnected: false,

  addFreelancer: (freelancer) =>
    set((state) => ({
      freelancers: [
        ...state.freelancers,
        { ...freelancer, id: `freelancer-${Date.now()}` },
      ],
    })),

  removeFreelancer: (id) =>
    set((state) => ({
      freelancers: state.freelancers.filter((f) => f.id !== id),
      desks: state.desks.map((d) =>
        d.freelancerId === id ? { ...d, occupied: false, freelancerId: null } : d
      ),
    })),

  updateFreelancer: (id, updates) =>
    set((state) => ({
      freelancers: state.freelancers.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  assignToDesk: (freelancerId, deskId) =>
    set((state) => {
      const desk = state.desks.find((d) => d.id === deskId);
      if (!desk || desk.occupied) return state;

      return {
        desks: state.desks.map((d) => {
          if (d.freelancerId === freelancerId) {
            return { ...d, occupied: false, freelancerId: null };
          }
          if (d.id === deskId) {
            return { ...d, occupied: true, freelancerId };
          }
          return d;
        }),
        freelancers: state.freelancers.map((f) =>
          f.id === freelancerId ? { ...f, deskPosition: desk.position } : f
        ),
      };
    }),

  removeFromDesk: (freelancerId) =>
    set((state) => ({
      desks: state.desks.map((d) =>
        d.freelancerId === freelancerId
          ? { ...d, occupied: false, freelancerId: null }
          : d
      ),
      freelancers: state.freelancers.map((f) =>
        f.id === freelancerId ? { ...f, deskPosition: null } : f
      ),
    })),

  selectFreelancer: (id) => set({ selectedFreelancer: id }),

  setCollaborationSpace: (show) => set({ showCollaborationSpace: show }),

  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        { ...task, id: `task-${Date.now()}`, createdAt: new Date() },
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: `msg-${Date.now()}`, timestamp: new Date() },
      ],
    })),

  addTelegramMessage: (message) =>
    set((state) => {
      const newMessage = {
        ...message,
        id: message.id || `tg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
        processed: false,
      };

      // Update orchestrator status when new message arrives
      const updatedFreelancers = state.freelancers.map((f) =>
        f.id === 'orchestrator'
          ? { ...f, status: 'working' as const, currentTask: `Processing: ${message.content.slice(0, 30)}...` }
          : f
      );

      return {
        telegramMessages: [...state.telegramMessages, newMessage],
        freelancers: updatedFreelancers,
      };
    }),

  routeTelegramMessage: (messageId, freelancerId) =>
    set((state) => {
      // Mark message as routed
      const updatedMessages = state.telegramMessages.map((m) =>
        m.id === messageId ? { ...m, processed: true, routedTo: freelancerId } : m
      );

      const message = state.telegramMessages.find((m) => m.id === messageId);
      const freelancer = state.freelancers.find((f) => f.id === freelancerId);

      // Find an available desk for the freelancer if they don't have one
      let updatedDesks = state.desks;
      let freelancerDeskPosition = freelancer?.deskPosition;

      if (freelancer && !freelancer.deskPosition) {
        const availableDesk = state.desks.find(
          (d) => !d.occupied && d.id !== 'desk-reception' && d.id !== 'desk-dev'
        );
        if (availableDesk) {
          updatedDesks = state.desks.map((d) =>
            d.id === availableDesk.id
              ? { ...d, occupied: true, freelancerId }
              : d
          );
          freelancerDeskPosition = availableDesk.position;
        }
      }

      // Update orchestrator back to idle
      // Update target freelancer to working
      const updatedFreelancers = state.freelancers.map((f) => {
        if (f.id === 'orchestrator') {
          return { ...f, status: 'idle' as const, currentTask: null };
        }
        if (f.id === freelancerId && message) {
          return {
            ...f,
            status: 'working' as const,
            currentTask: message.content.slice(0, 50),
            deskPosition: freelancerDeskPosition || f.deskPosition,
          };
        }
        return f;
      });

      // Create a task for audit trail
      const newTask = message
        ? {
            id: `task-${Date.now()}`,
            title: `Process: ${message.content.slice(0, 30)}...`,
            description: message.content,
            assignedTo: freelancerId,
            status: 'in-progress' as const,
            priority: 'medium' as const,
            createdAt: new Date(),
            sourceMessageId: messageId,
          }
        : null;

      // Simulate task completion after 5-15 seconds
      if (message) {
        const completionTime = 5000 + Math.random() * 10000;
        setTimeout(() => {
          useOfficeStore.getState().completeTask(freelancerId, messageId);
        }, completionTime);
      }

      return {
        telegramMessages: updatedMessages,
        freelancers: updatedFreelancers,
        desks: updatedDesks,
        tasks: newTask ? [...state.tasks, newTask] : state.tasks,
      };
    }),

  completeTask: (freelancerId: string, messageId: string) =>
    set((state) => {
      // Update freelancer back to idle and increment completed tasks
      const updatedFreelancers = state.freelancers.map((f) => {
        if (f.id === freelancerId) {
          return {
            ...f,
            status: 'idle' as const,
            currentTask: null,
            completedTasks: f.completedTasks + 1,
          };
        }
        return f;
      });

      // Update task status to completed
      const updatedTasks = state.tasks.map((t) =>
        t.sourceMessageId === messageId
          ? { ...t, status: 'completed' as const, completedAt: new Date() }
          : t
      );

      return {
        freelancers: updatedFreelancers,
        tasks: updatedTasks,
      };
    }),

  setConnected: (connected) => set({ isConnected: connected }),
}));
