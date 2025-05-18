import { DebateSession } from '../types';
import { realtimeService } from './realtimeService';

// In-memory storage for debate sessions
let debateSessions: DebateSession[] = [];

/**
 * Create and save a new debate session with real-time updates
 */
export const createAndSaveDebateSession = (
  userId: string,
  topic: string,
  transcript: string,
  coherence: number,
  persuasiveness: number,
  knowledgeDepth: number,
  articulation: number
): DebateSession => {
  // Calculate overall score with weighted metrics
  const weights = {
    coherence: 0.3,       // Most important - logical flow and structure
    persuasiveness: 0.3,  // Equally important - argument effectiveness
    knowledgeDepth: 0.25, // Important but slightly less - factual support
    articulation: 0.15    // Least important - presentation style
  };
  
  const overallScore = Math.round(
    (coherence * weights.coherence) +
    (persuasiveness * weights.persuasiveness) +
    (knowledgeDepth * weights.knowledgeDepth) +
    (articulation * weights.articulation)
  );
  
  const feedback = generateFeedback(coherence, persuasiveness, knowledgeDepth, articulation);
  
  const session: DebateSession = {
    id: Date.now().toString(),
    userId,
    timestamp: new Date(),
    topic,
    transcript,
    performanceMetrics: {
      coherence,
      persuasiveness,
      knowledgeDepth,
      articulation,
      overallScore
    },
    feedback
  };
  
  debateSessions.push(session);
  
  // Emit real-time update
  realtimeService.simulateUpdate('debate', session);
  
  return session;
};

/**
 * Generate feedback based on performance metrics
 */
const generateFeedback = (
  coherence: number,
  persuasiveness: number,
  knowledgeDepth: number,
  articulation: number
): string => {
  // Find the weakest and strongest metrics
  const metrics = [
    { name: 'coherence', value: coherence },
    { name: 'persuasiveness', value: persuasiveness },
    { name: 'knowledge depth', value: knowledgeDepth },
    { name: 'articulation', value: articulation }
  ];
  
  const weakest = metrics.reduce((prev, current) => 
    (prev.value < current.value) ? prev : current
  );
  
  const strongest = metrics.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  );
  
  // Generate tailored feedback
  let feedback = `Your debate performance was strongest in ${strongest.name} (${strongest.value}/100). `;
  
  if (weakest.value < 60) {
    feedback += `Consider improving your ${weakest.name} (${weakest.value}/100) by `;
    
    switch (weakest.name) {
      case 'coherence':
        feedback += 'organizing your arguments more clearly and maintaining a logical flow.';
        break;
      case 'persuasiveness':
        feedback += 'using more compelling evidence and addressing counterarguments directly.';
        break;
      case 'knowledge depth':
        feedback += 'researching the topic more thoroughly before debates.';
        break;
      case 'articulation':
        feedback += 'practicing clearer expression and using more precise terminology.';
        break;
      default:
        feedback += 'focusing on this area in your next debate.';
    }
  } else {
    feedback += 'You demonstrated good balance across all debate skills.';
  }
  
  return feedback;
};

/**
 * Get all debate sessions for a user
 */
export const getUserDebateSessions = (userId: string): DebateSession[] => {
  return debateSessions.filter(session => session.userId === userId);
};

/**
 * Get sessions from the past X days for a specific user
 */
export const getRecentUserDebateSessions = (
  userId: string, 
  days: number = 30
): DebateSession[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return debateSessions.filter(session => 
    session.userId === userId && session.timestamp >= cutoffDate
  );
};

/**
 * Calculate debate performance averages
 */
export const calculateDebateAverages = (
  sessions: DebateSession[]
): { 
  avgCoherence: number; 
  avgPersuasiveness: number; 
  avgKnowledgeDepth: number;
  avgArticulation: number;
  avgOverallScore: number;
} => {
  if (sessions.length === 0) {
    return {
      avgCoherence: 50,
      avgPersuasiveness: 50,
      avgKnowledgeDepth: 50,
      avgArticulation: 50,
      avgOverallScore: 50
    };
  }
  
  const totalCoherence = sessions.reduce((sum, session) => sum + session.performanceMetrics.coherence, 0);
  const totalPersuasiveness = sessions.reduce((sum, session) => sum + session.performanceMetrics.persuasiveness, 0);
  const totalKnowledgeDepth = sessions.reduce((sum, session) => sum + session.performanceMetrics.knowledgeDepth, 0);
  const totalArticulation = sessions.reduce((sum, session) => sum + session.performanceMetrics.articulation, 0);
  const totalOverallScore = sessions.reduce((sum, session) => sum + session.performanceMetrics.overallScore, 0);
  
  return {
    avgCoherence: Math.round(totalCoherence / sessions.length),
    avgPersuasiveness: Math.round(totalPersuasiveness / sessions.length),
    avgKnowledgeDepth: Math.round(totalKnowledgeDepth / sessions.length),
    avgArticulation: Math.round(totalArticulation / sessions.length),
    avgOverallScore: Math.round(totalOverallScore / sessions.length)
  };
};

/**
 * Get debate performance averages for a specific user
 */
export const getUserDebateAverages = (
  userId: string,
  days: number = 30
): { 
  avgCoherence: number; 
  avgPersuasiveness: number; 
  avgKnowledgeDepth: number;
  avgArticulation: number;
  avgOverallScore: number;
} => {
  const sessions = getRecentUserDebateSessions(userId, days);
  return calculateDebateAverages(sessions);
};

/**
 * Analyze debate performance trends
 */
export const analyzeDebatePerformanceTrends = (
  userId: string,
  days: number = 30
): {
  trendDirection: 'improving' | 'declining' | 'stable';
  strongestArea: string;
  weakestArea: string;
  mostDiscussedTopics: string[];
  improvementRate: number;
} => {
  const recentSessions = getRecentUserDebateSessions(userId, days);
  
  if (recentSessions.length < 3) {
    return {
      trendDirection: 'stable',
      strongestArea: 'knowledge depth', // Default value
      weakestArea: 'articulation', // Default value
      mostDiscussedTopics: ['Technology', 'Ethics'],
      improvementRate: 0
    };
  }
  
  // Sort sessions by timestamp
  const sortedSessions = [...recentSessions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate trend direction based on overall scores
  const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
  const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));
  
  const firstHalfAvg = calculateDebateAverages(firstHalf);
  const secondHalfAvg = calculateDebateAverages(secondHalf);
  
  // Determine trend direction
  let trendDirection: 'improving' | 'declining' | 'stable';
  
  if (secondHalfAvg.avgOverallScore > firstHalfAvg.avgOverallScore + 5) {
    trendDirection = 'improving';
  } else if (secondHalfAvg.avgOverallScore < firstHalfAvg.avgOverallScore - 5) {
    trendDirection = 'declining';
  } else {
    trendDirection = 'stable';
  }
  
  // Calculate improvement rate
  const firstSession = sortedSessions[0];
  const lastSession = sortedSessions[sortedSessions.length - 1];
  const improvementRate = Math.round(
    ((lastSession.performanceMetrics.overallScore - firstSession.performanceMetrics.overallScore) / 
    firstSession.performanceMetrics.overallScore) * 100
  );
  
  // Find strongest and weakest areas
  const latestAvg = calculateDebateAverages(sortedSessions.slice(-3)); // Last 3 sessions
  
  const metrics = [
    { name: 'coherence', value: latestAvg.avgCoherence },
    { name: 'persuasiveness', value: latestAvg.avgPersuasiveness },
    { name: 'knowledge depth', value: latestAvg.avgKnowledgeDepth },
    { name: 'articulation', value: latestAvg.avgArticulation }
  ];
  
  const strongestArea = metrics.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  ).name;
  
  const weakestArea = metrics.reduce((prev, current) => 
    (prev.value < current.value) ? prev : current
  ).name;
  
  // Find most discussed topics
  const topicFrequency: Record<string, number> = {};
  sortedSessions.forEach(session => {
    topicFrequency[session.topic] = (topicFrequency[session.topic] || 0) + 1;
  });
  
  const mostDiscussedTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
  
  return {
    trendDirection,
    strongestArea,
    weakestArea,
    mostDiscussedTopics,
    improvementRate
  };
};

// Demo and testing methods
export const getSampleDebateSessions = (): DebateSession[] => {
  if (debateSessions.length === 0) {
    const sampleTopics = [
      'AI Ethics in Engineering',
      'Renewable Energy Future',
      'Quantum Computing Applications',
      'Cybersecurity Best Practices',
      'Future of Engineering Education'
    ];
    
    // Generate sample data
    for (let i = 0; i < 10; i++) {
      const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
      
      // Generate reasonable performance metrics
      const coherence = Math.round(60 + Math.random() * 30);
      const persuasiveness = Math.round(55 + Math.random() * 35);
      const knowledgeDepth = Math.round(65 + Math.random() * 25);
      const articulation = Math.round(50 + Math.random() * 40);
      
      createAndSaveDebateSession(
        'sample-user',
        randomTopic,
        `Sample debate transcript on ${randomTopic}`,
        coherence,
        persuasiveness,
        knowledgeDepth,
        articulation
      );
    }
  }
  
  return debateSessions;
};
