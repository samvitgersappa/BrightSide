import { QuizSession, EmotionalState } from '../types';

// For demo purposes, we'll store quiz sessions in memory
let quizSessions: QuizSession[] = [];

// Create and save a new quiz session
export const createAndSaveQuizSession = (
  userId: string,
  subject: QuizSession['subject'],
  questionsTotal: number,
  questionsCorrect: number,
  eqQuestionsTotal: number,
  eqQuestionsCorrect: number,
  emotionalMetrics: {
    moodScore: number;
    distressLevel: number;
    stabilityScore: number;
    emotionalState: EmotionalState;
  }
): QuizSession => {
  const session: QuizSession = {
    id: `quiz_${Date.now()}`,
    userId,
    timestamp: new Date(),
    subject,
    questionsTotal,
    questionsCorrect,
    eqQuestionsTotal,
    eqQuestionsCorrect,
    emotionalMetrics,
    summary: generateQuizSummary(questionsCorrect, questionsTotal, eqQuestionsCorrect, eqQuestionsTotal)
  };

  quizSessions.push(session);
  return session;
};

// Get recent quiz sessions for a user
export const getRecentQuizSessions = (userId: string, days: number = 30): QuizSession[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return quizSessions
    .filter(session => session.userId === userId && new Date(session.timestamp) >= cutoff)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate performance summary for a quiz session
const generateQuizSummary = (
  questionsCorrect: number,
  questionsTotal: number,
  eqCorrect: number,
  eqTotal: number
): string => {
  const technicalScore = (questionsCorrect / questionsTotal) * 100;
  const eqScore = eqTotal > 0 ? (eqCorrect / eqTotal) * 100 : 0;

  let summary = `Technical Score: ${Math.round(technicalScore)}% (${questionsCorrect}/${questionsTotal})`;
  if (eqTotal > 0) {
    summary += ` | EQ Score: ${Math.round(eqScore)}% (${eqCorrect}/${eqTotal})`;
  }
  return summary;
};

// Calculate quiz analytics
export const calculateQuizAnalytics = (sessions: QuizSession[]) => {
  if (!sessions.length) {
    return {
      totalSessions: 0,
      averageScore: 0,
      averageEQScore: 0,
      subjectBreakdown: {},
      emotionalStateBreakdown: {},
      avgMoodScore: 0,
      avgStabilityScore: 0,
      avgDistressLevel: 0
    };
  }

  const analytics = {
    totalSessions: sessions.length,
    averageScore: 0,
    averageEQScore: 0,
    subjectBreakdown: {} as Record<string, { total: number, avgScore: number }>,
    emotionalStateBreakdown: {} as Record<string, number>,
    avgMoodScore: 0,
    avgStabilityScore: 0,
    avgDistressLevel: 0
  };

  let totalScore = 0;
  let totalEQScore = 0;
  let totalMoodScore = 0;
  let totalStabilityScore = 0;
  let totalDistressLevel = 0;

  sessions.forEach(session => {
    // Calculate technical scores
    const score = (session.questionsCorrect / session.questionsTotal) * 100;
    totalScore += score;

    // Calculate EQ scores
    if (session.eqQuestionsTotal > 0) {
      const eqScore = (session.eqQuestionsCorrect / session.eqQuestionsTotal) * 100;
      totalEQScore += eqScore;
    }

    // Track subject performance
    const subject = session.subject;
    if (!analytics.subjectBreakdown[subject]) {
      analytics.subjectBreakdown[subject] = { total: 0, avgScore: 0 };
    }
    analytics.subjectBreakdown[subject].total++;
    analytics.subjectBreakdown[subject].avgScore += score;

    // Track emotional states
    const state = session.emotionalMetrics.emotionalState;
    analytics.emotionalStateBreakdown[state] = (analytics.emotionalStateBreakdown[state] || 0) + 1;

    // Track emotional metrics
    totalMoodScore += session.emotionalMetrics.moodScore;
    totalStabilityScore += session.emotionalMetrics.stabilityScore;
    totalDistressLevel += session.emotionalMetrics.distressLevel;
  });

  // Calculate averages
  analytics.averageScore = totalScore / sessions.length;
  analytics.averageEQScore = totalEQScore / sessions.length;
  analytics.avgMoodScore = totalMoodScore / sessions.length;
  analytics.avgStabilityScore = totalStabilityScore / sessions.length;
  analytics.avgDistressLevel = totalDistressLevel / sessions.length;

  // Calculate subject averages
  Object.keys(analytics.subjectBreakdown).forEach(subject => {
    analytics.subjectBreakdown[subject].avgScore /= analytics.subjectBreakdown[subject].total;
  });

  return analytics;
};

// Generate sample quiz sessions for demo purposes
export const generateSampleQuizSessions = (userId: string): void => {
  const subjects: QuizSession['subject'][] = ['algorithms', 'data-structures', 'databases', 'web-dev', 'cybersecurity', 'mobile'];
  const emotionalStates: EmotionalState[] = ['happy', 'sad', 'anxious', 'calm', 'neutral'];

  // Generate 10 sample sessions
  for (let i = 0; i < 10; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const emotionalState = emotionalStates[Math.floor(Math.random() * emotionalStates.length)];
    
    const questionsTotal = Math.floor(Math.random() * 10) + 10; // 10-20 questions
    const questionsCorrect = Math.floor(Math.random() * (questionsTotal - 5)) + 5; // At least 5 correct
    
    const eqQuestionsTotal = Math.floor(questionsTotal * 0.4); // 40% are EQ questions
    const eqQuestionsCorrect = Math.floor(Math.random() * (eqQuestionsTotal - 2)) + 2; // At least 2 correct
    
    const moodScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const distressLevel = Math.floor(Math.random() * 30) + 20; // 20-50
    const stabilityScore = Math.floor(Math.random() * 30) + 70; // 70-100

    createAndSaveQuizSession(
      userId,
      subject,
      questionsTotal,
      questionsCorrect,
      eqQuestionsTotal,
      eqQuestionsCorrect,
      {
        moodScore,
        distressLevel,
        stabilityScore,
        emotionalState
      }
    );
  }
};
