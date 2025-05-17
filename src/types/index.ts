export interface User {
  id: string;
  name: string;
  email: string;
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  relationship: 'counselor' | 'parent' | 'friend';
  phone?: string;
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
  currentArgument?: string;
  currentArgumentScore?: number;
  performanceMetrics: {
    coherence: number;
    persuasiveness: number;
    knowledgeDepth: number;
    articulation: number;
    overallScore: number;
  };
  feedback: string;
  lastArgumentTimestamp?: Date;
  inProgress?: boolean;
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

export interface PersonalizedMetrics {
  dailyGoals: {
    sessionsCompleted: number;
    sessionsTarget: number;
    streakDays: number;
  };
  weeklyProgress: {
    emotionalGrowth: number;
    debateSkillGrowth: number;
    topicsExplored: string[];
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    earnedDate: Date;
    type: 'streak' | 'milestone' | 'skill' | 'engagement';
    icon: string;
  }[];
  personalizedTips: {
    category: 'emotional' | 'debate' | 'general';
    tip: string;
    priority: number;
  }[];
}

export type EmotionalMilestone = {
  type: 'mood' | 'distress' | 'stability' | 'debate';
  value: number;
  date: Date;
  description: string;
  isPositive: boolean;
};