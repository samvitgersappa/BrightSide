import { PersonalizedMetrics, EQSession, DebateSession } from '../types';
import { getRecentUserSessions } from './sessionService';
import { getRecentUserDebateSessions } from './debateService';

const calculateStreakDays = (sessions: (EQSession | DebateSession)[]): number => {
  if (sessions.length === 0) return 0;
  
  let streakDays = 1;
  let currentDate = new Date(sessions[0].timestamp);
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].timestamp);
    sessionDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streakDays++;
      currentDate = sessionDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  
  return streakDays;
};

const generateAchievements = (
  eqSessions: EQSession[],
  debateSessions: DebateSession[]
): PersonalizedMetrics['achievements'] => {
  const achievements: PersonalizedMetrics['achievements'] = [];
  
  // Streak achievements
  const streakDays = calculateStreakDays([...eqSessions, ...debateSessions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  ));
  
  if (streakDays >= 3) {
    achievements.push({
      id: 'streak-3',
      title: '3-Day Streak!',
      description: 'Completed sessions for 3 consecutive days',
      earnedDate: new Date(),
      type: 'streak',
      icon: '🔥'
    });
  }
  if (streakDays >= 7) {
    achievements.push({
      id: 'streak-7',
      title: 'Weekly Warrior',
      description: 'Maintained a 7-day engagement streak',
      earnedDate: new Date(),
      type: 'streak',
      icon: '🏆'
    });
  }
  
  // Emotional milestones
  const highMoodCount = eqSessions.filter(s => s.moodScore >= 80).length;
  if (highMoodCount >= 5) {
    achievements.push({
      id: 'mood-mastery',
      title: 'Mood Master',
      description: 'Achieved excellent mood scores 5+ times',
      earnedDate: new Date(),
      type: 'milestone',
      icon: '😊'
    });
  }
  
  // Debate skills
  const expertDebates = debateSessions.filter(
    s => s.performanceMetrics.overallScore >= 85
  ).length;
  if (expertDebates >= 3) {
    achievements.push({
      id: 'debate-expert',
      title: 'Debate Expert',
      description: 'Achieved expert-level performance in 3+ debates',
      earnedDate: new Date(),
      type: 'skill',
      icon: '🎯'
    });
  }
  
  return achievements;
};

const generatePersonalizedTips = (
  eqSessions: EQSession[],
  debateSessions: DebateSession[]
): PersonalizedMetrics['personalizedTips'] => {
  const tips: PersonalizedMetrics['personalizedTips'] = [];
  
  // Analyze recent emotional patterns
  const recentEQ = eqSessions[0];
  if (recentEQ) {
    if (recentEQ.distressLevel > 70) {
      tips.push({
        category: 'emotional',
        tip: 'Consider trying deep breathing exercises when feeling stressed',
        priority: 1
      });
    }
    if (recentEQ.moodScore < 40) {
      tips.push({
        category: 'emotional',
        tip: 'Try engaging in a favorite activity to boost your mood',
        priority: 1
      });
    }
  }
  
  // Analyze debate performance
  const recentDebate = debateSessions[0];
  if (recentDebate) {
    const metrics = recentDebate.performanceMetrics;
    if (metrics.coherence < 60) {
      tips.push({
        category: 'debate',
        tip: 'Practice organizing your arguments with clear topic sentences',
        priority: 2
      });
    }
    if (metrics.persuasiveness < 60) {
      tips.push({
        category: 'debate',
        tip: 'Try incorporating more evidence and examples in your arguments',
        priority: 2
      });
    }
  }
  
  // General engagement tips
  if (eqSessions.length < 3) {
    tips.push({
      category: 'general',
      tip: 'Regular check-ins help build emotional awareness',
      priority: 3
    });
  }
  
  return tips.sort((a, b) => a.priority - b.priority);
};

export const getPersonalizedMetrics = async (userId: string): Promise<PersonalizedMetrics> => {
  // Get the session data (synchronously but wrapped in a Promise to maintain async interface)
  const eqSessions = getRecentUserSessions(userId);
  const debateSessions = getRecentUserDebateSessions(userId);
  
  // Calculate daily engagement
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSessions = [...eqSessions, ...debateSessions].filter(s => {
    const sessionDate = new Date(s.timestamp);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });
  
  const weeklyProgress = {
    emotionalGrowth: calculateWeeklyGrowth(eqSessions),
    debateSkillGrowth: calculateWeeklyGrowth(debateSessions),
    topicsExplored: getUniqueTopics(debateSessions)
  };
  
  return {
    dailyGoals: {
      sessionsCompleted: todaysSessions.length,
      sessionsTarget: 3,
      streakDays: calculateStreakDays([...eqSessions, ...debateSessions])
    },
    weeklyProgress,
    achievements: generateAchievements(eqSessions, debateSessions),
    personalizedTips: generatePersonalizedTips(eqSessions, debateSessions)
  };
};

const calculateWeeklyGrowth = (sessions: (EQSession | DebateSession)[]): number => {
  if (sessions.length < 2) return 0;
  
  const thisWeek = sessions.slice(0, Math.ceil(sessions.length / 2));
  const lastWeek = sessions.slice(Math.ceil(sessions.length / 2));
  
  const thisWeekAvg = thisWeek.reduce((sum, s) => {
    if ('moodScore' in s) return sum + s.moodScore;
    return sum + s.performanceMetrics.overallScore;
  }, 0) / thisWeek.length;
  
  const lastWeekAvg = lastWeek.reduce((sum, s) => {
    if ('moodScore' in s) return sum + s.moodScore;
    return sum + s.performanceMetrics.overallScore;
  }, 0) / lastWeek.length;
  
  return Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100);
};

const getUniqueTopics = (debateSessions: DebateSession[]): string[] => {
  return Array.from(new Set(debateSessions.map(s => s.topic))).slice(0, 5);
};
