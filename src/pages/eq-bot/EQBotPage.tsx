import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle, TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { Message, EmotionalState, ChatMessage } from '../../types';
import { generateGrokCompletion } from '../../config/grok';
import { 
  formatEmotionalState, 
  getEmotionalScores, 
  isEmergencyThresholdExceeded,
  createConversationContext,
  updateConversationContext,
  getContextAwareEmotionalScores,
  ConversationContext,
  containsNegation,
  isQuestion,
  getEmotionalStateConsideringNegation
} from '../../utils/emotionUtils';
import { sendEmergencyAlert } from '../../services/emailService';
import { 
  createAndSaveEQSession, 
  getUserEQSessions, 
  calculateEmotionalAverages,
  analyzeEmotionalTrends 
} from '../../services/sessionService';
import { useAuth } from '../../contexts/AuthContext';

// Initial system prompt for the EQ bot
const EQ_BOT_PROMPT = `You are an empathetic and emotionally intelligent AI assistant. Your role is to:
1. Help users process and understand their emotions
2. Provide supportive and understanding responses
3. Offer constructive suggestions when appropriate
4. Maintain a compassionate and non-judgmental tone
5. Ask relevant follow-up questions to better understand the user's emotional state

Focus on emotional support while maintaining professional boundaries. 
If users express severe distress or mention self-harm, kindly direct them to professional help 
and mental health resources.

Please analyze the emotional context of each message and respond with appropriate empathy. 
Try to identify underlying emotions and validate the user's feelings while offering constructive support.`;

const initialHistory: Message[] = [
  {
    id: '1',
    role: 'bot',
    content: "Hello! I'm your Emotional Support Bot. How are you feeling today? Feel free to share whatever's on your mind.",
    timestamp: new Date(),
    emotionalState: 'neutral',
  },
];

const EQBotPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showScores, setShowScores] = useState(true);
  const [distressThreshold, setDistressThreshold] = useState(70); // Default threshold
  const [alertSent, setAlertSent] = useState(false);
  const [pitchScore, setPitchScore] = useState<number | null>(null);
  const [recentPitchScores, setRecentPitchScores] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pitchWorkerRef = useRef<Worker | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  // Speech recognition ref and intermediate transcript state
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Initialize SpeechRecognition with improved configuration
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setErrorMessage('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      setInterimTranscript('');
      switch (event.error) {
        case 'not-allowed':
          setErrorMessage('Microphone access was denied. Please allow microphone access to use speech recognition.');
          break;
        case 'network':
          setErrorMessage('Network error occurred. Please check your connection.');
          break;
        case 'no-speech':
          setErrorMessage('No speech was detected. Please try again.');
          break;
        default:
          setErrorMessage('Speech recognition error: ' + event.error);
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + finalTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(currentInterim);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Reset alert status for each new session
  useEffect(() => {
    // For demonstration purposes, we're resetting alert status after 5 minutes
    const resetAlertTimer = setTimeout(() => {
      if (alertSent) {
        setAlertSent(false);
      }
    }, 5 * 60 * 1000);
    
    return () => clearTimeout(resetAlertTimer);
  }, [alertSent]);
  
  // Load distress threshold from settings 
  useEffect(() => {
    // In a real app, this would come from user settings or database
    // For now, we're using a static threshold
    // This could be fetched from an API or context in a real application
    setDistressThreshold(70);
  }, []);

  // Display emotional trend information
  const [showTrends, setShowTrends] = useState(false);
  const [emotionalTrends, setEmotionalTrends] = useState<{
    trendDirection: 'improving' | 'worsening' | 'stable';
    volatility: 'high' | 'medium' | 'low';
    distressFrequency: number;
    mostCommonEmotion: EmotionalState;
    emotionalStability: number;
  } | null>(null);
  
  // Load emotional trends when user is available
  useEffect(() => {
    if (user) {
      const trends = analyzeEmotionalTrends(user.id, 30);
      setEmotionalTrends(trends);
    }
  }, [user, messages]);

  const detectEmotion = (text: string, previousMessages: Message[] = []): EmotionalState => {
    const lowerText = text.toLowerCase();
    
    // Enhanced pattern matching with scoring system
    interface EmotionIndicator {
      patterns: RegExp[];
      weight: number; // Importance of this pattern group
    }
    
    // Advanced pattern matching for better emotion detection
    const emotionIndicators: Record<EmotionalState, EmotionIndicator[]> = {
      happy: [
        {
          patterns: [
            /\bvery happy\b|\bextremely happy\b|\bover(?:\s)?joyed\b|\becstatic\b|\bthrilled\b/i,
            /\beuphori(?:c|a)\b|\belated\b|\bin heaven\b|\bon cloud nine\b|\blove it\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\bhappy\b|\bjoy(?:ful)?\b|\bexcited\b|\belated\b|\bcheer(?:ful)?\b|\bglad\b/i,
            /\bgood mood\b|\bfeeling good\b|\bwonderful\b|\bgreat\b|\bamazing\b|\bfantastic\b/i,
            /\bpositive\b|\bupbeat\b|\benergetic\b|\bvibrant\b|\blively\b|\bcontented\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\b😊|😄|😁|🙂|😀|🤗|😍|❤️|💕|💯|🔥\b/,
            /\bsatisf(?:ied|ying)\b|\bpleas(?:ed|ant)\b|\bengaged\b|\boptimistic\b|\bthank you\b/i
          ],
          weight: 0.8
        }
      ],
      sad: [
        {
          patterns: [
            /\bseverely depress(?:ed|ion)\b|\bextremely sad\b|\bhopeless\b|\bdesperate\b/i,
            /\bheartbroken\b|\bcrushed\b|\bdevastated\b|\bdespondent\b|\bmiserable\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\bsad\b|\bdepress(?:ed|ion|ing)?\b|\bdown\b|\blow\b|\bunhappy\b|\bgloomy\b/i,
            /\blonely\b|\bheartbroken\b|\bempty\b|\bforlorn\b|\bmournful\b|\bmelancholic\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\b😢|😭|😥|😓|🥺|💔|😞|😔|☹️|😿\b/,
            /\bdisappointed\b|\bdisheartened\b|\blet down\b|\bbummed\b|\bcrying\b/i,
            /\bupset\b|\bhurting\b|\bstruggling\b|\bsighing\b|\bnot happy\b/i
          ],
          weight: 0.8
        }
      ],
      angry: [
        {
          patterns: [
            /\bfurious\b|\benraged\b|\bfuming\b|\bseething\b|\bincensed\b|\blivid\b/i,
            /\boutraged\b|\binfuriated\b|\birate\b|\braging\b|\bexplod(?:e|ing)\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\bangry\b|\bmad\b|\birrita(?:ted|ting)\b|\bannoy(?:ed|ing)?\b|\bhostile\b/i,
            /\bfrustrated\b|\bpissed\b|\bhateful\b|\bresentful\b|\bvexed\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\b😠|😡|🤬|👿|💢|💥|😤|🔥|😾\b/,
            /\bdisgruntled\b|\bunsatisfied\b|\bticked off\b|\bbothered\b/i,
            /\bhate this\b|\bthis sucks\b|\bstupid\b|\bridiculous\b|\bnot fair\b/i
          ],
          weight: 0.8
        }
      ],
      anxious: [
        {
          patterns: [
            /\bsevere anxiety\b|\bpanic attack\b|\bterrified\b|\bparalyzed by fear\b/i,
            /\boverwhelm(?:ed|ing)\b|\bfrozen\b|\bcannot cope\b|\bdread\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\banxi(?:ous|ety)\b|\bworr(?:y|ied)\b|\bstress(?:ed|ful)?\b|\bfear(?:ful)?\b/i,
            /\buneasy\b|\bpanic(?:ky)?\b|\bapprehens(?:ive|ion)\b|\btense\b|\bjittery\b/i,
            /\bscared\b|\bfrightened\b|\bin danger\b|\bwhat if\b|\bmight happen\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\b😰|😨|😧|😱|😬|🥴|🤢|🙀\b/,
            /\bnervous\b|\bagitated\b|\bon edge\b|\brestless\b|\bcannot relax\b/i
          ],
          weight: 0.8
        }
      ],
      calm: [
        {
          patterns: [
            /\bcompletely calm\b|\babsolutely peaceful\b|\butmost tranquility\b/i,
            /\bzen\b|\bmeditative\b|\bdeep peace\b|\bblissful\b|\bserenity\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\bcalm\b|\bpeace(?:ful)?\b|\brelax(?:ed|ing)?\b|\btranquil\b|\bserene\b/i,
            /\bcomposed\b|\bcentered\b|\bmindful\b|\brestful\b|\bquiet\b|\bstill\b/i,
            /\btaking it easy\b|\btaking deep breaths\b|\bbalanced\b|\bsteady\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\b😌|😊|🧘|🧘‍♀️|🧘‍♂️|💆|🌊|🌈|🌷\b/,
            /\bease\b|\bbalanced\b|\bsoothed\b|\bcontent\b|\buntroubled\b/i
          ],
          weight: 0.8
        }
      ],
      distressed: [
        {
          patterns: [
            /\bsuicid(?:e|al)\b|\bself[-\s]?harm\b|\bend(?:ing)? (?:it|life|everything)\b/i,
            /\bwant to die\b|\bno reason to live\b|\bno way out\b|\bcannot go on\b/i
          ],
          weight: 2.0 // Critical - highest weight
        },
        {
          patterns: [
            /\bhelp(?:less)?\b|\bhurt(?:ing)?\b|\bharming\b|\bdespair\b|\bpain(?:ful)?\b/i,
            /\btorture\b|\bdying\b|\bdeath\b|\bdead\b|\bkill\b|\bhate myself\b/i,
            /\btrauma(?:tic|tized)?\b|\bnightmare\b|\bcrisis\b|\bbreaking down\b/i
          ],
          weight: 1.5
        },
        {
          patterns: [
            /\bno one cares\b|\ball alone\b|\bnever getting better\b|\btoo much\b/i,
            /\bno purpose\b|\bempty\b|\bhopeless\b|\babandoned\b|\blost\b/i,
            /\bgive up\b|\bcan'?t handle\b|\bfailing\b|\bno point\b|\bundone\b/i
          ],
          weight: 1.0
        }
      ],
      neutral: [
        {
          patterns: [
            /\bneutral\b|\bindifferent\b|\bmiddle ground\b|\bneither good nor bad\b/i,
            /\baverage\b|\bmoderate\b|\bnormal\b|\btypical\b|\bregular\b|\busual\b/i,
            /\bjust saying\b|\bjust checking\b|\bjust asking\b|\bjust curious\b/i
          ],
          weight: 1.0
        },
        {
          patterns: [
            /\bok\b|\bokay\b|\bfine\b|\balright\b|\bso-so\b|\bmeh\b/i,
            /^(?:yes|no|maybe|not sure|i think so|perhaps|possibly)$/i,
            /\bi see\b|\bunderstand\b|\bgot it\b|\bthat makes sense\b|\bfair enough\b/i
          ],
          weight: 0.7
        }
      ]
    };

    // Calculate score for each emotion
    const scores: Record<EmotionalState, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      calm: 0,
      distressed: 0,
      neutral: 0.2 // Small baseline for neutral as default
    };

    // Process each emotion
    for (const [emotion, indicators] of Object.entries(emotionIndicators)) {
      for (const indicator of indicators) {
        for (const pattern of indicator.patterns) {
          if (pattern.test(lowerText)) {
            scores[emotion as EmotionalState] += indicator.weight;
            break; // Once a pattern from this indicator matches, move to next indicator
          }
        }
      }
    }

    // Calculate content length factor - improved algorithm
    const contentFactor = Math.min(1.0, Math.sqrt(lowerText.length / 50)); 
    
    // Apply content length factor to neutral score
    // Shorter inputs are more likely to be neutral
    if (lowerText.length < 15) {
      scores.neutral += (1 - contentFactor) * 0.7;
    }
    
    // Check for mixed emotions (detecting multiple emotions in the same message)
    let emotionCount = 0;
    let significantEmotions = [];
    
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > 0.7 && emotion !== 'neutral') {
        emotionCount++;
        significantEmotions.push(emotion);
      }
    }
    
    // If multiple strong emotions detected, adjust neutral score down
    if (emotionCount > 1) {
      scores.neutral -= 0.2 * emotionCount;
    }
    
    // Context-awareness: Analyze previous messages (if available)
    if (previousMessages && previousMessages.length > 0) {
      // Get the last 3 messages from the user
      const recentUserMessages = previousMessages
        .filter(msg => msg.role === 'user')
        .slice(-3);
      
      if (recentUserMessages.length > 0) {
        // Check for emotional continuity
        const lastEmotion = recentUserMessages[recentUserMessages.length - 1].emotionalState;
        
        // If current message is very short and previous emotion was strong, 
        // slightly bias toward emotional continuity
        if (lowerText.length < 10 && lastEmotion !== 'neutral') {
          const continuityFactor = 0.3;
          scores[lastEmotion] += continuityFactor;
        }
        
        // Check for emotional escalation patterns
        const negativeEmotions = ['sad', 'angry', 'anxious', 'distressed'];
        const hasNegativeProgression = recentUserMessages.every(msg => 
          negativeEmotions.includes(msg.emotionalState)
        );
        
        if (hasNegativeProgression && scores.distressed > 0) {
          // Emotional spiral detection - amplify distress if pattern shows escalation
          scores.distressed *= 1.2;
        }
      }
    }

    // Get the emotion with highest score
    let highestScore = 0;
    let dominantEmotion: EmotionalState = 'neutral';

    for (const [emotion, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        dominantEmotion = emotion as EmotionalState;
      }
    }

    // Improved threshold for neutral detection
    if (highestScore < 0.6) {
      // Check if this might be a simple response to a question
      const questionResponsePattern = /^(?:yes|no|maybe|i think so|probably|not really|sometimes)$/i;
      if (questionResponsePattern.test(lowerText.trim())) {
        return 'neutral';
      }
      
      // Check if this might be a greeting
      const greetingPattern = /^(?:hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i;
      if (greetingPattern.test(lowerText.trim())) {
        return 'neutral';
      }
      
      // Handle other cases of low confidence
      return 'neutral';
    }
    
    // Check for negation that might flip the emotional meaning
    if (containsNegation(lowerText)) {
      return getEmotionalStateConsideringNegation(lowerText, dominantEmotion);
    }
    
    // Check if this is a question (questions often don't express the emotions they contain)
    if (isQuestion(lowerText) && dominantEmotion !== 'distressed') {
      // Still detect distress in questions like "Why should I keep living?"
      if (scores.distressed > 0.5) {
        return 'distressed';
      }
      // Reduce emotional intensity for questions
      if (scores[dominantEmotion] < 1.2) {
        return 'neutral';
      }
    }
    
    return dominantEmotion;
  };

  // Track conversation context for context-aware emotion detection
  const [conversationContext, setConversationContext] = useState<ConversationContext>(createConversationContext());
  
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    setErrorMessage('');
    
    // Use context-aware emotion detection
    const detectedEmotion = detectEmotion(input, messages);
    
    // Update conversation context with new emotion
    const updatedContext = updateConversationContext(conversationContext, detectedEmotion);
    setConversationContext(updatedContext);
    
    // Get basic emotional scores for comparison
    const basicScores = getEmotionalScores(detectedEmotion, input.trim());
    
    // Get enhanced context-aware emotional scores
    const emotionScores = getContextAwareEmotionalScores(
      detectedEmotion, 
      input.trim(),
      updatedContext
    );
    
    // For debugging purposes - log both scoring methods
    console.log('Basic emotion scores:', basicScores);
    console.log('Context-aware emotion scores:', emotionScores);
    
    // Save the session for dashboard tracking
    if (user) {
      const session = createAndSaveEQSession(user, input.trim(), detectedEmotion, pitchScore ?? undefined);
      console.log('Saved EQ session:', session);
    }
    
    // Check if distress threshold is exceeded and we should send an alert
    const shouldSendAlert = isEmergencyThresholdExceeded(emotionScores.distressLevel, distressThreshold);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      emotionalState: detectedEmotion,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // If distress threshold is exceeded and alert hasn't been sent, send email alert
    if (shouldSendAlert && !alertSent && user) {
      try {
        const alertSentSuccessfully = await sendEmergencyAlert(
          user,
          emotionScores.distressLevel,
          input.trim()
        );
        
        if (alertSentSuccessfully) {
          setAlertSent(true);
          console.log('Emergency alert sent to contacts');
        }
      } catch (error) {
        console.error('Failed to send emergency alert:', error);
      }
    }

    try {
      // Get updated emotional trends for better personalization
      let trendsInfo = '';
      
      if (user) {
        // Use the emotional trends to enhance the system prompt
        const trends = analyzeEmotionalTrends(user.id, 30);
        setEmotionalTrends(trends);
        
        // Add trend information to the conversation context
        trendsInfo = `
          Based on analysis of the user's emotional patterns:
          - Their overall emotional trend is: ${trends.trendDirection}
          - Their emotional volatility is: ${trends.volatility}
          - Their most common emotional state is: ${trends.mostCommonEmotion}
          - Their emotional stability score is: ${trends.emotionalStability}/100
          - They experience high distress with frequency: ${Math.round(trends.distressFrequency * 100)}%
          
          Tailor your response appropriately for someone with this emotional profile.
        `;
        
        // Calculate recent average emotional state
        const recentSessions = getUserEQSessions(user.id).slice(-5);
        const recentAverages = calculateEmotionalAverages(recentSessions);
        
        trendsInfo += `
          Recent emotional averages:
          - Average mood score: ${recentAverages.avgMood}/100
          - Average distress level: ${recentAverages.avgDistress}/100
          - Average stability score: ${recentAverages.avgStability}/100
        `;
      }
      
      // Prepare conversation history for the API, including only recent messages
      const conversationHistory: ChatMessage[] = [
        { role: 'system', content: `${EQ_BOT_PROMPT}\n\n${trendsInfo}` },
        ...messages.slice(-6).map(msg => ({
          role: (msg.role === 'bot' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: msg.content
        })),
        { role: 'user' as const, content: input.trim() }
      ];

      const response = await generateGrokCompletion(conversationHistory, 0.7);

      if (response?.content) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: response.content,
          timestamp: new Date(),
          emotionalState: 'neutral',
        };
        setMessages(prev => [...prev, botMessage]);
        
        // If distress threshold is exceeded, show the alert UI
        if (shouldSendAlert) {
          setShowAlert(true);
        }
      } else {
        throw new Error('Failed to get a response from the AI assistant');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I apologize, but I'm having trouble responding right now. Please try again or reach out to a mental health professional if you need immediate support.",
        timestamp: new Date(),
        emotionalState: 'neutral',
      };
      setMessages(prev => [...prev, botMessage]);
      setShowAlert(true);
    } finally {
      setIsProcessing(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper: Normalize pitch (Hz) to 0-100 (example: 80-300Hz typical speaking range)
  const normalizePitch = (hz: number) => {
    if (hz < 80 || hz > 400) return 0;
    // Map 80-300Hz to 0-100
    return Math.max(0, Math.min(100, Math.round(((hz - 80) / (300 - 80)) * 100)));
  };

  // Start/stop audio recording for pitch analysis
  const startPitchDetection = async () => {
    if (!navigator.mediaDevices.getUserMedia) return;
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
    audioProcessorRef.current = processor;
    // Vite-compatible worker instantiation
    pitchWorkerRef.current = new Worker(new URL('../../workers/pitchDetection.js', import.meta.url), { type: 'module' });
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      pitchWorkerRef.current?.postMessage({ audioBuffer: Array.from(input), sampleRate: audioContextRef.current!.sampleRate });
    };
    pitchWorkerRef.current.onmessage = (e) => {
      const { pitch } = e.data;
      if (pitch && pitch > 0) {
        const score = normalizePitch(pitch);
        setPitchScore(score);
        setRecentPitchScores((prev) => [...prev.slice(-19), score]);
      }
    };
    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };
  const stopPitchDetection = () => {
    audioProcessorRef.current?.disconnect();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    pitchWorkerRef.current?.terminate();
    audioProcessorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
    pitchWorkerRef.current = null;
  };

  // Start/stop pitch detection with speech recognition
  useEffect(() => {
    if (isRecording) {
      startPitchDetection();
    } else {
      stopPitchDetection();
    }
    // Cleanup on unmount
    return () => stopPitchDetection();
  }, [isRecording]);

  const getEmotionColor = (emotion: EmotionalState) => {
    switch (emotion) {
      case 'happy': return 'bg-green-100 text-green-800';
      case 'sad': return 'bg-blue-100 text-blue-800';
      case 'angry': return 'bg-red-100 text-red-800';
      case 'anxious': return 'bg-yellow-100 text-yellow-800';
      case 'calm': return 'bg-purple-100 text-purple-800';
      case 'distressed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mic button handler for speech-to-text
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput(''); // Clear existing input when starting new recording
      setErrorMessage('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition error:', e);
        setErrorMessage('Failed to start speech recognition. Please try again.');
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {showAlert && (
        <div className="bg-red-50 p-4 rounded-md mb-4 flex items-center">
          <AlertCircle className="text-red-500 mr-2" />
          <div className="flex-1">
            <p className="text-red-700 mb-1">
              {errorMessage || "Our system has detected high emotional distress in your message."}
            </p>
            {!errorMessage && (
              <p className="text-sm text-red-600">
                {alertSent 
                  ? "We've sent an alert to your emergency contacts. Please don't hesitate to reach out to them directly."
                  : "If you're feeling overwhelmed, please consider talking to a mental health professional."}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showTrends && emotionalTrends && (
          <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Your Emotional Trends</h3>
              <button 
                onClick={() => setShowTrends(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <span className="mr-2">Trend:</span>
                {emotionalTrends.trendDirection === 'improving' ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" /> Improving
                  </span>
                ) : emotionalTrends.trendDirection === 'worsening' ? (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1" /> Worsening
                  </span>
                ) : (
                  <span className="text-blue-600 flex items-center">
                    <LineChart className="h-4 w-4 mr-1" /> Stable
                  </span>
                )}
              </div>
              <div>
                <span className="mr-2">Common mood:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getEmotionColor(emotionalTrends.mostCommonEmotion)}`}>
                  {emotionalTrends.mostCommonEmotion}
                </span>
              </div>
              <div>
                <span className="mr-2">Volatility:</span>
                <span className={`
                  ${emotionalTrends.volatility === 'high' ? 'text-red-600' : 
                    emotionalTrends.volatility === 'medium' ? 'text-yellow-600' : 'text-green-600'}
                `}>
                  {emotionalTrends.volatility}
                </span>
              </div>
              <div>
                <span className="mr-2">Stability:</span>
                <span className="font-medium">
                  {emotionalTrends.emotionalStability}/100
                </span>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              <p>{message.content}</p>
              <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${getEmotionColor(message.emotionalState, showScores)}`}>
                {formatEmotionalState(message.emotionalState, showScores)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="show-scores"
                type="checkbox"
                checked={showScores}
                onChange={() => setShowScores(!showScores)}
                className="mr-1 h-4 w-4 text-indigo-600 rounded"
              />
              <label htmlFor="show-scores" className="text-xs text-gray-600 select-none">
                Show emotion scores
              </label>
            </div>
            
            <button
              onClick={() => setShowTrends(!showTrends)}
              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
            >
              <LineChart className="h-3 w-3 mr-1" />
              {showTrends ? 'Hide trends' : 'Show emotional trends'}
            </button>
          </div>
          
          {alertSent && (
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
              Alert sent to emergency contacts
            </span>
          )}
        </div>
      
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMicClick}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            disabled={isProcessing}
          >
            {!isRecording ? <MicOff /> : <Mic />}
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              className="w-full p-2 border rounded-lg pr-4"
              disabled={isProcessing}
            />
            {interimTranscript && (
              <div className="absolute left-0 right-0 -top-8 bg-gray-100 p-2 rounded-lg text-sm text-gray-600 animate-pulse">
                {interimTranscript}
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className={`p-2 rounded-full ${
              isProcessing || !input.trim()
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            aria-label="Send message"
          >
            <Send />
          </button>
        </div>

        {/* Emotional trend analysis section */}
        {user && emotionalTrends && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Emotional Trend Analysis
              </h3>
              <button
                onClick={() => setShowTrends(!showTrends)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showTrends ? 'Hide trends' : 'Show trends'}
              </button>
            </div>
            
            {showTrends && (
              <div>
                <div className="flex space-x-2 text-xs text-gray-500 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: 'rgb(34 197 94)' }} />
                      Improving
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: 'rgb(239 68 68)' }} />
                      Worsening
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: 'rgb(156 163 175)' }} />
                      Stable
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-800 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {emotionalTrends.trendDirection === 'improving' ? (
                        <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                      ) : emotionalTrends.trendDirection === 'worsening' ? (
                        <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                      ) : (
                        <LineChart className="w-4 h-4 mr-1 text-gray-500" />
                      )}
                      Trend: {emotionalTrends.trendDirection.charAt(0).toUpperCase() + emotionalTrends.trendDirection.slice(1)}
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-xs rounded-full px-2 py-1" style={{ backgroundColor: 'rgb(229 231 235)' }}>
                        Volatility: {emotionalTrends.volatility}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-xs rounded-full px-2 py-1" style={{ backgroundColor: 'rgb(229 231 235)' }}>
                        Distress Frequency: {emotionalTrends.distressFrequency}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  Most Common Emotion: <span className="font-semibold text-gray-800">{emotionalTrends.mostCommonEmotion}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  Emotional Stability: <span className="font-semibold text-gray-800">{emotionalTrends.emotionalStability}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1">
          {/* ...existing chat UI ... */}
        </div>
        {/* Pitch Analysis Widget */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pitch Analysis</h3>
          <span className="text-lg font-semibold">
            {pitchScore !== null ? `${pitchScore}/100` : 'N/A/100'}
          </span>
          <div className="text-xs text-gray-500 mb-1">
            {pitchScore !== null ? `Current Score` : 'N/A'}
          </div>
          <div className="bg-indigo-100 h-2 rounded-full mb-2" style={{ width: '100%' }}>
            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pitchScore ?? 0}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mb-1">Recent Pitch Scores:</p>
          <div className="flex flex-wrap gap-1">
            {recentPitchScores.length === 0 ? (
              <span className="text-xs text-gray-400">No data</span>
            ) : (
              recentPitchScores.slice(-10).reverse().map((score, idx) => (
                <span key={idx} className="inline-block bg-indigo-200 text-indigo-800 rounded px-2 py-0.5 text-xs">
                  {score}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EQBotPage;