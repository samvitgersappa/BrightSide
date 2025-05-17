import { EQSession, DebateSession } from '../types';
import { getRecentUserSessions } from './sessionService';
import { getRecentUserDebateSessions } from './debateService';

interface Streak {
  type: 'positive' | 'negative';
  count: number;
  metric: string;
  threshold: number;
}

interface Warning {
  level: 'low' | 'medium' | 'high';
  message: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export interface RealTimeMetrics {
  currentMood: number;
  moodTrend: 'up' | 'down' | 'stable';
  distressLevel: number;
  activeStreaks: Streak[];
  warnings: Warning[];
  debateProgress: {
    lastScore: number;
    improvement: number;
    consistentAreas: string[];
    challengingAreas: string[];
  };
  combinedInsights: {
    emotionalState: string;
    debatePerformance: string;
    recommendedAction: string;
  };
}

/**
 * Calculate streaks from session data
 */
const calculateStreaks = (
  eqSessions: EQSession[],
  debateSessions: DebateSession[]
): Streak[] => {
  const streaks: Streak[] = [];
  
  // Sort sessions by timestamp
  const sortedEQ = [...eqSessions].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  const sortedDebate = [...debateSessions].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  
  // Check for mood streaks
  let moodStreak = 1;
  let moodStreakType: 'positive' | 'negative' = 'positive';
  
  for (let i = 1; i < sortedEQ.length; i++) {
    if (
      (sortedEQ[i].moodScore >= 70 && sortedEQ[i-1].moodScore >= 70) ||
      (sortedEQ[i].moodScore <= 30 && sortedEQ[i-1].moodScore <= 30)
    ) {
      moodStreak++;
      moodStreakType = sortedEQ[i].moodScore >= 70 ? 'positive' : 'negative';
    } else {
      break;
    }
  }
  
  if (moodStreak >= 3) {
    streaks.push({
      type: moodStreakType,
      count: moodStreak,
      metric: 'mood',
      threshold: moodStreakType === 'positive' ? 70 : 30
    });
  }
  
  // Check for debate performance streaks
  let debateStreak = 1;
  let debateStreakType: 'positive' | 'negative' = 'positive';
  
  for (let i = 1; i < sortedDebate.length; i++) {
    if (
      (sortedDebate[i].performanceMetrics.overallScore >= 75 && 
       sortedDebate[i-1].performanceMetrics.overallScore >= 75) ||
      (sortedDebate[i].performanceMetrics.overallScore <= 40 && 
       sortedDebate[i-1].performanceMetrics.overallScore <= 40)
    ) {
      debateStreak++;
      debateStreakType = sortedDebate[i].performanceMetrics.overallScore >= 75 ? 'positive' : 'negative';
    } else {
      break;
    }
  }
  
  if (debateStreak >= 2) {
    streaks.push({
      type: debateStreakType,
      count: debateStreak,
      metric: 'debate',
      threshold: debateStreakType === 'positive' ? 75 : 40
    });
  }
  
  return streaks;
};

/**
 * Generate warnings based on session data
 */
const generateWarnings = (
  eqSessions: EQSession[],
  debateSessions: DebateSession[]
): Warning[] => {
  const warnings: Warning[] = [];
  const recentEQ = eqSessions[0]; // Most recent EQ session
  
  if (recentEQ) {
    // High distress warning
    if (recentEQ.distressLevel >= 75) {
      warnings.push({
        level: 'high',
        message: 'Unusually high distress level detected',
        metric: 'distress',
        value: recentEQ.distressLevel,
        timestamp: recentEQ.timestamp
      });
    }
    
    // Low mood warning
    if (recentEQ.moodScore <= 30) {
      warnings.push({
        level: 'medium',
        message: 'Significant drop in mood detected',
        metric: 'mood',
        value: recentEQ.moodScore,
        timestamp: recentEQ.timestamp
      });
    }
    
    // Mood volatility warning
    if (eqSessions.length >= 3) {
      const recentThree = eqSessions.slice(0, 3);
      const moodVariance = Math.max(...recentThree.map(s => s.moodScore)) -
                          Math.min(...recentThree.map(s => s.moodScore));
      
      if (moodVariance >= 40) {
        warnings.push({
          level: 'medium',
          message: 'High emotional volatility detected',
          metric: 'volatility',
          value: moodVariance,
          timestamp: new Date()
        });
      }
    }
  }
  
  // Debate performance warnings
  if (debateSessions.length >= 2) {
    const recent = debateSessions[0];
    const previous = debateSessions[1];
    
    if (
      recent.performanceMetrics.overallScore < 
      previous.performanceMetrics.overallScore - 20
    ) {
      warnings.push({
        level: 'low',
        message: 'Significant drop in debate performance',
        metric: 'debate',
        value: recent.performanceMetrics.overallScore,
        timestamp: recent.timestamp
      });
    }
  }
  
  return warnings;
};

/**
 * Get real-time analytics for a user
 */
export const getRealTimeAnalytics = (
  userId: string,
  days: number = 30
): RealTimeMetrics => {
  const eqSessions = getRecentUserSessions(userId, days);
  const debateSessions = getRecentUserDebateSessions(userId, days);
  
  const recentEQ = eqSessions[0];
  const recentDebate = debateSessions[0];
  
  // Calculate mood trend
  const moodTrend = eqSessions.length >= 2 
    ? (recentEQ.moodScore > eqSessions[1].moodScore + 5 
        ? 'up' 
        : recentEQ.moodScore < eqSessions[1].moodScore - 5 
          ? 'down' 
          : 'stable')
    : 'stable';
  
  // Calculate debate progress
  const debateProgress = {
    lastScore: recentDebate?.performanceMetrics.overallScore || 0,
    improvement: debateSessions.length >= 2 
      ? recentDebate.performanceMetrics.overallScore - debateSessions[1].performanceMetrics.overallScore
      : 0,
    consistentAreas: getConsistentAreas(debateSessions),
    challengingAreas: getChallengingAreas(debateSessions)
  };
  
  // Generate combined insights
  const combinedInsights = generateCombinedInsights(recentEQ, recentDebate);
  
  return {
    currentMood: recentEQ?.moodScore || 50,
    moodTrend,
    distressLevel: recentEQ?.distressLevel || 0,
    activeStreaks: calculateStreaks(eqSessions, debateSessions),
    warnings: generateWarnings(eqSessions, debateSessions),
    debateProgress,
    combinedInsights
  };
};

/**
 * Get consistently strong or weak areas in debate performance
 */
const getConsistentAreas = (sessions: DebateSession[]): string[] => {
  if (sessions.length < 3) return [];
  
  const recentThree = sessions.slice(0, 3);
  const metrics = ['coherence', 'persuasiveness', 'knowledgeDepth', 'articulation'];
  
  return metrics.filter(metric => {
    const scores = recentThree.map(s => s.performanceMetrics[metric as keyof typeof s.performanceMetrics]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = Math.max(...scores) - Math.min(...scores);
    
    return variance <= 10 && avg >= 70; // Consistent and high performing
  });
};

/**
 * Get consistently challenging areas in debate performance
 */
const getChallengingAreas = (sessions: DebateSession[]): string[] => {
  if (sessions.length < 3) return [];
  
  const recentThree = sessions.slice(0, 3);
  const metrics = ['coherence', 'persuasiveness', 'knowledgeDepth', 'articulation'];
  
  return metrics.filter(metric => {
    const scores = recentThree.map(s => s.performanceMetrics[metric as keyof typeof s.performanceMetrics]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return avg <= 50; // Consistently low performing
  });
};

/**
 * Generate combined insights from EQ and debate performance
 */
const generateCombinedInsights = (
  recentEQ?: EQSession,
  recentDebate?: DebateSession
) => {
  let emotionalState = 'neutral';
  let debatePerformance = 'steady';
  let recommendedAction = 'Continue practicing regularly';
  
  if (recentEQ) {
    if (recentEQ.moodScore >= 70) {
      emotionalState = 'positive';
    } else if (recentEQ.moodScore <= 30) {
      emotionalState = 'negative';
    }
    
    if (recentEQ.distressLevel >= 70) {
      emotionalState = 'distressed';
      recommendedAction = 'Consider taking a break and practicing stress management';
    }
  }
  
  if (recentDebate) {
    if (recentDebate.performanceMetrics.overallScore >= 75) {
      debatePerformance = 'strong';
      recommendedAction = 'Challenge yourself with more complex topics';
    } else if (recentDebate.performanceMetrics.overallScore <= 40) {
      debatePerformance = 'struggling';
      recommendedAction = 'Focus on fundamentals and structured arguments';
    }
  }
  
  return {
    emotionalState,
    debatePerformance,
    recommendedAction
  };
};