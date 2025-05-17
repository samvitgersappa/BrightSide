import { EQSession, EmotionalState, User } from '../types';
import { getEmotionalScores } from '../utils/emotionUtils';

// In-memory storage for EQ sessions
let eqSessions: EQSession[] = [];

/**
 * Create and save a new EQ session
 */
export const createAndSaveEQSession = (
  user: User,
  message: string,
  emotion: EmotionalState
): EQSession => {
  const scores = getEmotionalScores(emotion, message);
  
  const session: EQSession = {
    id: Date.now().toString(),
    userId: user.id,
    timestamp: new Date(),
    moodScore: scores.moodScore,
    distressLevel: scores.distressLevel,
    stabilityScore: scores.stabilityScore,
    transcript: message,
    summary: `User expressed ${emotion} sentiment.`,
    alertSent: scores.distressLevel > 70,
  };
  
  eqSessions.push(session);
  return session;
};

/**
 * Get all EQ sessions for a user
 */
export const getUserEQSessions = (userId: string): EQSession[] => {
  return eqSessions.filter(session => session.userId === userId);
};

/**
 * Get sessions from the past X days for a specific user
 */
export const getRecentUserSessions = (
  userId: string, 
  days: number = 30
): EQSession[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return eqSessions.filter(session => 
    session.userId === userId && session.timestamp >= cutoffDate
  );
};

/**
 * Calculate emotional averages for a set of sessions
 */
export const calculateEmotionalAverages = (
  sessions: EQSession[]
): { avgMood: number; avgDistress: number; avgStability: number } => {
  if (sessions.length === 0) {
    return { avgMood: 50, avgDistress: 50, avgStability: 50 };
  }
  
  const totalMood = sessions.reduce((sum, session) => sum + session.moodScore, 0);
  const totalDistress = sessions.reduce((sum, session) => sum + session.distressLevel, 0);
  const totalStability = sessions.reduce((sum, session) => sum + session.stabilityScore, 0);
  
  return {
    avgMood: Math.round(totalMood / sessions.length),
    avgDistress: Math.round(totalDistress / sessions.length),
    avgStability: Math.round(totalStability / sessions.length)
  };
};

/**
 * Get emotional averages for a specific user
 * Combines getRecentUserSessions and calculateEmotionalAverages
 */
export const getUserEmotionalAverages = (
  userId: string,
  days: number = 30
): { avgMood: number; avgDistress: number; avgStability: number } => {
  const sessions = getRecentUserSessions(userId, days);
  return calculateEmotionalAverages(sessions);
};

/**
 * Analyze emotional trends over time
 * Returns a trend analysis of the user's emotional state
 */
export const analyzeEmotionalTrends = (
  userId: string,
  days: number = 30
): {
  trendDirection: 'improving' | 'worsening' | 'stable';
  volatility: 'high' | 'medium' | 'low';
  distressFrequency: number;
  mostCommonEmotion: EmotionalState;
  emotionalStability: number;
} => {
  const recentSessions = getRecentUserSessions(userId, days);
  
  if (recentSessions.length < 3) {
    return {
      trendDirection: 'stable',
      volatility: 'low',
      distressFrequency: 0,
      mostCommonEmotion: 'neutral',
      emotionalStability: 50
    };
  }
  
  // Sort sessions by timestamp
  const sortedSessions = [...recentSessions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate trend direction based on mood score
  const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
  const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
  
  const firstHalfAvg = calculateEmotionalAverages(firstHalf);
  const secondHalfAvg = calculateEmotionalAverages(secondHalf);
  
  // Determine trend direction
  let trendDirection: 'improving' | 'worsening' | 'stable';
  
  if (secondHalfAvg.avgMood > firstHalfAvg.avgMood + 5) {
    trendDirection = 'improving';
  } else if (secondHalfAvg.avgMood < firstHalfAvg.avgMood - 5) {
    trendDirection = 'worsening';
  } else {
    trendDirection = 'stable';
  }
  
  // Calculate volatility
  const moodChanges = [];
  for (let i = 1; i < sortedSessions.length; i++) {
    moodChanges.push(Math.abs(
      sortedSessions[i].moodScore - sortedSessions[i-1].moodScore
    ));
  }
  
  const avgChange = moodChanges.reduce((sum, change) => sum + change, 0) / moodChanges.length;
  
  let volatility: 'high' | 'medium' | 'low';
  if (avgChange > 25) {
    volatility = 'high';
  } else if (avgChange > 15) {
    volatility = 'medium';
  } else {
    volatility = 'low';
  }
  
  // Count distress frequency
  const distressThreshold = 70;
  const distressCount = sortedSessions.filter(
    session => session.distressLevel >= distressThreshold
  ).length;
  const distressFrequency = distressCount / sortedSessions.length;
  
  // Calculate emotional stability
  const emotionalStability = 100 - (
    (avgChange / 50) * 100 + (distressFrequency * 100)
  ) / 2;
  
  // Find most common emotion (would require having the emotion stored in sessions)
  // For now, infer from average mood
  let mostCommonEmotion: EmotionalState;
  
  const avgMood = (firstHalfAvg.avgMood + secondHalfAvg.avgMood) / 2;
  if (avgMood > 75) {
    mostCommonEmotion = 'happy';
  } else if (avgMood > 65) {
    mostCommonEmotion = 'calm';
  } else if (avgMood > 45) {
    mostCommonEmotion = 'neutral';
  } else if (avgMood > 25) {
    mostCommonEmotion = 'sad';
  } else if (distressFrequency > 0.3) {
    mostCommonEmotion = 'distressed';
  } else {
    mostCommonEmotion = 'anxious';
  }
  
  return {
    trendDirection,
    volatility,
    distressFrequency,
    mostCommonEmotion,
    emotionalStability: Math.round(Math.max(0, Math.min(100, emotionalStability)))
  };
};

// Demo and testing methods
export const getSampleSessions = (): EQSession[] => {
  if (eqSessions.length === 0) {
    const sampleEmotions: EmotionalState[] = ['happy', 'sad', 'neutral', 'anxious', 'calm'];
    
    // Generate some sample data
    for (let i = 0; i < 10; i++) {
      const randEmotion = sampleEmotions[Math.floor(Math.random() * sampleEmotions.length)];
      const scores = getEmotionalScores(randEmotion);
      
      eqSessions.push({
        id: `sample-${i}`,
        userId: 'sample-user',
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Past days
        moodScore: scores.moodScore,
        distressLevel: scores.distressLevel,
        stabilityScore: scores.stabilityScore,
        transcript: `Sample ${randEmotion} message ${i}`,
        summary: `User expressed ${randEmotion} sentiment.`,
        alertSent: scores.distressLevel > 70
      });
    }
  }
  
  return eqSessions;
};
