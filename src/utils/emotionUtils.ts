import { EmotionalState, EQSession } from '../types';

// Map emotional states to numeric scores (0-100)
// Higher scores are better for mood and stability
// Higher scores are worse for distress
export const emotionScores: Record<EmotionalState, { 
  moodScore: number;
  distressLevel: number;
  stabilityScore: number;
}> = {
  'happy': { 
    moodScore: 90, 
    distressLevel: 5, 
    stabilityScore: 85 
  },
  'calm': { 
    moodScore: 78, 
    distressLevel: 15, 
    stabilityScore: 92 
  },
  'neutral': { 
    moodScore: 55, 
    distressLevel: 30, 
    stabilityScore: 65 
  },
  'anxious': { 
    moodScore: 32, 
    distressLevel: 68, 
    stabilityScore: 35 
  },
  'sad': { 
    moodScore: 22, 
    distressLevel: 72, 
    stabilityScore: 30 
  },
  'angry': { 
    moodScore: 18, 
    distressLevel: 80, 
    stabilityScore: 20 
  },
  'distressed': { 
    moodScore: 8, 
    distressLevel: 95, 
    stabilityScore: 10 
  }
};

/**
 * Emotional intensity modifiers for common phrases
 * These help adjust the base scores based on intensity markers
 */
const intensityModifiers: Record<string, number> = {
  'very': 0.15,
  'extremely': 0.2,
  'somewhat': -0.1,
  'slightly': -0.15,
  'a bit': -0.1,
  'really': 0.1,
  'absolutely': 0.2,
  'totally': 0.15,
  'completely': 0.2,
  'so': 0.1,
  'incredibly': 0.2,
  'terribly': 0.15,
  'barely': -0.2,
  'hardly': -0.15,
  'kind of': -0.1,
  'sort of': -0.1,
  // Enhanced modifiers for more nuanced detection
  'deeply': 0.18,
  'profoundly': 0.2,
  'mildly': -0.12,
  'exceptionally': 0.2,
  'marginally': -0.18,
  'overwhelmingly': 0.22,
  'tremendously': 0.2,
  'just a little': -0.1,
  'not very': -0.15,
  'moderately': 0.05,
  'intensely': 0.18,
  'unbearably': 0.25,
  'unbelievably': 0.22
};

/**
 * Get emotional scores for a detected emotional state
 * Optionally applies intensity modifiers based on text content
 */
export const getEmotionalScores = (
  emotionalState: EmotionalState, 
  text?: string
) => {
  // Start with base scores
  const baseScores = emotionScores[emotionalState] || emotionScores.neutral;
  
  // If no text provided, return base scores
  if (!text) {
    return baseScores;
  }
  
  // Clone the scores to avoid modifying the original
  const adjustedScores = { ...baseScores };
  
  // Check for intensity modifiers
  const lowerText = text.toLowerCase();
  let intensityModification = 0;
  
  // Look for intensity modifiers and calculate total modification
  Object.entries(intensityModifiers).forEach(([modifier, value]) => {
    if (lowerText.includes(modifier)) {
      intensityModification += value;
    }
  });
  
  // Apply intensity modifications
  if (intensityModification !== 0) {
    // For positive emotions (happy, calm)
    if (emotionalState === 'happy' || emotionalState === 'calm') {
      // Increase mood and stability, decrease distress
      adjustedScores.moodScore = Math.min(100, adjustedScores.moodScore * (1 + intensityModification));
      adjustedScores.stabilityScore = Math.min(100, adjustedScores.stabilityScore * (1 + intensityModification));
      adjustedScores.distressLevel = Math.max(0, adjustedScores.distressLevel * (1 - intensityModification));
    }
    // For negative emotions (sad, anxious, angry, distressed)
    else if (emotionalState === 'sad' || emotionalState === 'anxious' || 
             emotionalState === 'angry' || emotionalState === 'distressed') {
      // Decrease mood and stability, increase distress
      adjustedScores.moodScore = Math.max(0, adjustedScores.moodScore * (1 - intensityModification));
      adjustedScores.stabilityScore = Math.max(0, adjustedScores.stabilityScore * (1 - intensityModification));
      adjustedScores.distressLevel = Math.min(100, adjustedScores.distressLevel * (1 + intensityModification));
    }
  }
  
  // Round all scores
  return {
    moodScore: Math.round(adjustedScores.moodScore),
    distressLevel: Math.round(adjustedScores.distressLevel),
    stabilityScore: Math.round(adjustedScores.stabilityScore)
  };
};

/**
 * Context-aware emotion scoring system
 * This helps adjust emotional scores based on recent conversation history
 */
export interface ConversationContext {
  previousEmotions: EmotionalState[];
  messageCount: number;
  consistentEmotionCount: number;
  emotionChanges: number;
}

/**
 * Initialize a new conversation context
 */
export const createConversationContext = (): ConversationContext => {
  return {
    previousEmotions: [],
    messageCount: 0,
    consistentEmotionCount: 0,
    emotionChanges: 0
  };
};

/**
 * Update conversation context with new emotion
 */
export const updateConversationContext = (
  context: ConversationContext,
  newEmotion: EmotionalState
): ConversationContext => {
  const updatedContext = { ...context };
  updatedContext.messageCount++;
  
  // Track emotion changes
  if (updatedContext.previousEmotions.length > 0) {
    const lastEmotion = updatedContext.previousEmotions[updatedContext.previousEmotions.length - 1];
    if (lastEmotion === newEmotion) {
      updatedContext.consistentEmotionCount++;
    } else {
      updatedContext.consistentEmotionCount = 1;
      updatedContext.emotionChanges++;
    }
  } else {
    updatedContext.consistentEmotionCount = 1;
  }
  
  // Keep track of previous emotions (limited to last 5)
  updatedContext.previousEmotions = [
    ...updatedContext.previousEmotions.slice(-4),
    newEmotion
  ];
  
  return updatedContext;
};

/**
 * Get emotional scores with context awareness
 */
export const getContextAwareEmotionalScores = (
  emotionalState: EmotionalState,
  text: string,
  context?: ConversationContext
) => {
  // Start with normal scores
  const scores = getEmotionalScores(emotionalState, text);
  
  // If no context, return standard scores
  if (!context || context.messageCount <= 1) {
    return scores;
  }
  
  const adjustedScores = { ...scores };
  
  // Amplify emotional intensity if consistently showing the same emotion
  if (context.consistentEmotionCount > 2) {
    const intensityFactor = Math.min(0.25, context.consistentEmotionCount * 0.05);
    
    if (emotionalState === 'happy' || emotionalState === 'calm') {
      adjustedScores.moodScore = Math.min(100, adjustedScores.moodScore * (1 + intensityFactor));
      adjustedScores.stabilityScore = Math.min(100, adjustedScores.stabilityScore * (1 + intensityFactor));
      adjustedScores.distressLevel = Math.max(0, adjustedScores.distressLevel * (1 - intensityFactor));
    } else if (emotionalState === 'sad' || emotionalState === 'anxious' || 
               emotionalState === 'angry' || emotionalState === 'distressed') {
      adjustedScores.moodScore = Math.max(0, adjustedScores.moodScore * (1 - intensityFactor));
      adjustedScores.stabilityScore = Math.max(0, adjustedScores.stabilityScore * (1 - intensityFactor));
      adjustedScores.distressLevel = Math.min(100, adjustedScores.distressLevel * (1 + intensityFactor));
    }
  }
  
  // Detect emotional volatility (many changes in emotion)
  if (context.emotionChanges > 3 && context.messageCount < 10) {
    // Reduce stability for volatile emotional patterns
    adjustedScores.stabilityScore = Math.max(0, adjustedScores.stabilityScore * 0.8);
  }
  
  // Round all scores
  return {
    moodScore: Math.round(adjustedScores.moodScore),
    distressLevel: Math.round(adjustedScores.distressLevel),
    stabilityScore: Math.round(adjustedScores.stabilityScore)
  };
};

/**
 * Check if distress level exceeds the threshold
 */
export const isEmergencyThresholdExceeded = (
  distressLevel: number, 
  threshold: number = 70
): boolean => {
  return distressLevel >= threshold;
};

/**
 * Format emotional state with score for display
 */
export const formatEmotionalState = (
  emotionalState: EmotionalState, 
  showScore: boolean = true
): string => {
  if (!showScore) {
    return emotionalState;
  }
  
  const scores = getEmotionalScores(emotionalState);
  
  // Choose the most relevant score to display based on the emotion
  let displayScore: number;
  if (emotionalState === 'distressed' || emotionalState === 'angry' || emotionalState === 'sad' || emotionalState === 'anxious') {
    displayScore = scores.distressLevel;
  } else if (emotionalState === 'happy' || emotionalState === 'calm') {
    displayScore = scores.moodScore;
  } else {
    // For neutral, show a balanced view
    displayScore = Math.round((scores.moodScore + (100 - scores.distressLevel)) / 2);
  }
  
  return `${emotionalState} (${displayScore}/100)`;
};

/**
 * Create an EQ session record from a message and detected emotion
 */
export const createEQSessionFromMessage = (
  userId: string,
  message: string,
  emotionalState: EmotionalState
): EQSession => {
  const scores = getEmotionalScores(emotionalState);
  
  return {
    id: Date.now().toString(),
    userId,
    timestamp: new Date(),
    moodScore: scores.moodScore,
    distressLevel: scores.distressLevel,
    stabilityScore: scores.stabilityScore,
    transcript: message,
    summary: `User expressed ${emotionalState} sentiment.`,
    alertSent: scores.distressLevel > 70, // Assuming default threshold is 70
  };
};

/**
 * Advanced text sentiment analysis utilities
 */

// Words with negating effect that flip emotion valence
const negationWords = [
  'not', 'no', 'never', "don't", "doesn't", "didn't", "won't", "wouldn't", 
  "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", 
  "can't", "cannot", "couldn't", "shouldn't", "none", "nobody"
];

/**
 * Check if a phrase contains negation that might flip emotional meaning
 */
export const containsNegation = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return negationWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
};

/**
 * Get total word count of a text for more accurate length assessment
 */
export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

/**
 * Check if text appears to be a question
 */
export const isQuestion = (text: string): boolean => {
  const trimmedText = text.trim();
  // Ends with question mark
  if (trimmedText.endsWith('?')) {
    return true;
  }
  
  // Starts with question words
  const questionStarters = /^(?:who|what|when|where|why|how|is|are|was|were|will|do|does|did|can|could|should|would|may|might|am|have|has|had)\b/i;
  return questionStarters.test(trimmedText);
};

/**
 * Enhanced emotion detection that accounts for negation
 */
export const getEmotionalStateConsideringNegation = (
  text: string,
  detectedState: EmotionalState
): EmotionalState => {
  if (!containsNegation(text)) {
    return detectedState;
  }
  
  // Handle negated emotions
  switch (detectedState) {
    case 'happy':
      return 'sad'; // "I'm not happy" → sad
    case 'sad':
      return 'neutral'; // "I'm not sad" → neutral (not necessarily happy)
    case 'calm':
      return 'anxious'; // "I'm not calm" → anxious
    case 'anxious':
      return 'neutral'; // "I'm not anxious" → neutral
    case 'angry':
      return 'neutral'; // "I'm not angry" → neutral
    // For distressed and neutral, negation doesn't clearly indicate the opposite
    default:
      return detectedState;
  }
};

/**
 * Detect mixed emotions in a single message
 * Returns the primary and secondary emotions detected
 */
export const detectMixedEmotions = (
  text: string,
  primaryEmotion: EmotionalState
): { primary: EmotionalState; secondary: EmotionalState | null; mixedScore: number } => {
  // Quick text check
  const lowerText = text.toLowerCase();
  
  // Default result with no secondary emotion
  const result = {
    primary: primaryEmotion,
    secondary: null as EmotionalState | null,
    mixedScore: 0
  };
  
  // Simple patterns to detect mixed emotions
  const happySadMix = /happy .+(?:sad|unhappy)|sad .+(?:happy|joy)/i;
  const anxiousCalm = /(?:anxious|worried) .+(?:calm|peace)|(?:calm|peaceful) .+(?:anxious|worry)/i;
  const angryHappy = /(?:angry|mad) .+(?:happy|glad)|(?:happy|glad) .+(?:angry|mad)/i;
  
  // Check for common mixed emotion patterns
  if (happySadMix.test(lowerText)) {
    result.secondary = primaryEmotion === 'happy' ? 'sad' : 'happy';
    result.mixedScore = 0.5;
  } else if (anxiousCalm.test(lowerText)) {
    result.secondary = primaryEmotion === 'anxious' ? 'calm' : 'anxious';
    result.mixedScore = 0.5;
  } else if (angryHappy.test(lowerText)) {
    result.secondary = primaryEmotion === 'angry' ? 'happy' : 'angry';
    result.mixedScore = 0.4;
  }
  
  // This could be expanded with more sophisticated sentiment analysis
  return result;
};
