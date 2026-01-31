export type FreelancerStatus = 'idle' | 'working' | 'waiting-approval' | 'offline';

export type FreelancerRole =
  | 'orchestrator'
  | 'developer'
  | 'copywriter'
  | 'accountant'
  | 'researcher'
  | 'sales-agent'
  | 'content-creator'
  | 'general';

export type TrustLevel = 'apprentice' | 'junior' | 'senior' | 'expert';

export interface Freelancer {
  id: string;
  name: string;
  role: FreelancerRole;
  status: FreelancerStatus;
  trustLevel: TrustLevel;
  avatar: string;
  deskPosition: [number, number, number] | null;
  currentTask: string | null;
  completedTasks: number;
  approvalRate: number;
  isSpecial?: boolean; // For Orchestrator - always at reception desk
}

export type TelegramMessageType = 'text' | 'voice' | 'photo' | 'video' | 'document';

export interface TelegramMessage {
  id: string;
  chatId: string;
  from: string;
  type: TelegramMessageType;
  content: string;
  timestamp: Date;
  processed: boolean;
  routedTo?: string; // Freelancer ID
}

export interface Desk {
  id: string;
  position: [number, number, number];
  occupied: boolean;
  freelancerId: string | null;
}

export interface Task {
  id: string;
  title?: string;
  description: string;
  status: 'pending' | 'in-progress' | 'awaiting-approval' | 'completed' | 'rejected';
  assignedTo: string | null;
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  output?: string;
  sourceMessageId?: string; // Link back to original Telegram message
}

export interface Message {
  id: string;
  from: 'user' | 'freelancer';
  freelancerId?: string;
  content: string;
  timestamp: Date;
}
