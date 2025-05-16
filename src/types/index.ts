export interface User {
  id: string;
  name: string;
  email: string;
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  relationship: 'counselor' | 'parent' | 'friend';
}

export interface EQSession {
  id: string;
  userId: string;
  timestamp: Date;
  moodScore: number;
  distressLevel: number;
  stabilityScore: number;
  transcript: string;
  summary: string;
  alertSent: boolean;
}

export interface DebateSession {
  id: string;
  userId: string;
  timestamp: Date;
  topic: string;
  transcript: string;
  performanceMetrics: {
    coherence: number;
    persuasiveness: number;
    knowledgeDepth: number;
    articulation: number;
    overallScore: number;
  };
  feedback: string;
}

export type EmotionalState = 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'calm' | 'distressed';

export type MessageRole = 'user' | 'bot' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  emotionalState: EmotionalState;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}