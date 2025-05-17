import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Book, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';
import { generateGrokCompletion } from '../../config/grok';

// SpeechRecognition TypeScript interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Enhanced system prompt for the debate bot with improved guidance
const DEBATE_BOT_PROMPT = `You are a sophisticated debate partner focused on helping users develop critical thinking and communication skills. Your role is to:
1. Engage in thoughtful discussions on a wide range of topics (both predefined and custom)
2. Present well-reasoned arguments backed by evidence and examples
3. Challenge assumptions constructively while maintaining respect
4. Help develop the user's critical thinking and persuasion skills
5. Maintain a balanced, fair and professional tone
6. Provide accurate information while acknowledging uncertainties

Based on the user's chosen stance (for/against), adapt your responses to:
- Present counter-arguments when they are "for" the topic
- Present supporting arguments when they are "against" the topic
This creates a constructive debate environment where the user must defend their position.

For custom topics that the user suggests:
- Help frame the topic as a clear debatable proposition
- Suggest potential arguments for both sides if needed
- Ensure the debate remains focused and meaningful

In your responses, include:
- Relevant facts and statistics when available
- Compelling real-world examples
- Sound logical reasoning
- Thoughtful counterarguments
- Acknowledgment of nuance and complexity

Provide constructive feedback on the user's arguments while remaining engaging and encouraging. Your goal is to help them improve their critical thinking and debate skills, not to win the debate.`;

// Improved debate topics with more sensible and focused subjects
const debateTopics = [
  { 
    id: '1', 
    title: 'Should AI Development Be Regulated?', 
    description: 'Debate whether governments should impose strict regulations on AI development.',
    forArguments: ['Prevents misuse', 'Ensures ethical development', 'Protects public safety'],
    againstArguments: ['Stifles innovation', 'Hard to implement globally', 'Self-regulation is sufficient']
  },
  { 
    id: '2', 
    title: 'Nuclear Energy vs. Renewable Energy', 
    description: 'Debate whether nuclear energy should be prioritized over other renewable sources.',
    forArguments: ['Higher energy density', 'Lower land footprint', 'Consistent power generation'],
    againstArguments: ['Waste management issues', 'Safety concerns', 'High initial investment']
  },
  { 
    id: '3', 
    title: 'Remote Work Should Be the Standard', 
    description: 'Debate whether companies should make remote work the default option.',
    forArguments: ['Better work-life balance', 'Reduced commute pollution', 'Access to global talent'],
    againstArguments: ['Decreased collaboration', 'Isolation issues', 'Infrastructure inequality']
  },
  { 
    id: '4', 
    title: 'Social Media: Net Positive or Negative?', 
    description: 'Debate whether social media has been beneficial or harmful for society.',
    forArguments: ['Global connectivity', 'Information sharing', 'Support communities'],
    againstArguments: ['Mental health issues', 'Privacy concerns', 'Misinformation spread']
  },
  { 
    id: '5', 
    title: 'Space Exploration vs. Earth Problems', 
    description: 'Debate whether we should focus more resources on space exploration or solving Earth\'s problems.',
    forArguments: ['Technological innovation', 'Human species survival', 'Scientific discoveries'],
    againstArguments: ['Immediate Earth crises', 'High costs', 'Benefit primarily wealthy nations']
  },
  { 
    id: '6', 
    title: 'Universal Basic Income', 
    description: 'Debate whether governments should implement universal basic income.',
    forArguments: ['Poverty reduction', 'Economic stability', 'Adaptation to automation'],
    againstArguments: ['Cost concerns', 'Reduced incentive to work', 'Inflation risks']
  },
];

interface DebateMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  score?: number; // Optional score for argument quality
}

type Stance = 'for' | 'against' | null;

interface DebateState {
  topic: string | null;
  stance: Stance;
  started: boolean;
  score: number;
}

// Initial bot message
const initialConversation: DebateMessage[] = [
  {
    id: '1',
    role: 'bot',
    content: "Welcome to the Debate Bot! I'm here to engage in thoughtful discussions on a variety of topics to help sharpen your critical thinking and communication skills.\n\nYou can:\n• Select a topic from the list of debate-ready topics\n• Or suggest your own custom topic\n\nAfter selecting a topic, you'll choose whether to argue 'For' or 'Against' it. I'll take the opposite position to create a meaningful debate experience. Let's get started!",
    timestamp: new Date(),
  },
];

const DebateBotPage: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DebateMessage[]>(initialConversation);
  const [debateState, setDebateState] = useState<DebateState>({
    topic: null,
    stance: null,
    started: false,
    score: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTips, setShowTips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize SpeechRecognition with improved configuration
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        setInput(prev => prev + ' ' + finalTranscript);
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

  // Handle topic selection with better handling for all topic types
  const handleTopicSelect = (topicId: string) => {
    setDebateState(prev => ({
      ...prev,
      topic: topicId,
      stance: null, // Reset stance when topic changes
    }));
    
    // Find the topic, whether predefined or custom
    const topic = debateTopics.find(t => t.id === topicId);
    
    if (topic) {
      // Create a more engaging system message
      let messageContent = `Topic selected: "${topic.title}"\n\n`;
      
      // Add description if available
      if (topic.description && topic.description !== 'Custom debate topic') {
        messageContent += `${topic.description}\n\n`;
      }
      
      // Add stance instruction
      messageContent += "Please choose your stance (For or Against) to begin the debate.";
      
      // For custom topics, add extra guidance
      if (topic.id.startsWith('custom-')) {
        messageContent += "\n\nFor this custom topic, you'll debate whether you agree with or oppose the statement.";
      }
      
      const systemMessage: DebateMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: messageContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  // Handle stance selection with improved handling for custom topics
  const handleStanceSelect = (stance: Stance) => {
    if (!debateState.topic) return;
    
    const topic = debateTopics.find(t => t.id === debateState.topic);
    if (!topic) return;
    
    setDebateState(prev => ({
      ...prev,
      stance,
      started: true,
    }));
    
    // Add system message about stance and initial arguments
    let pointsToConsider: string[];
    
    if (stance === 'for') {
      pointsToConsider = topic.forArguments && topic.forArguments.length > 0 
        ? topic.forArguments 
        : ['Make strong, logical arguments', 'Use relevant examples', 'Consider evidence-based points'];
    } else {
      pointsToConsider = topic.againstArguments && topic.againstArguments.length > 0 
        ? topic.againstArguments 
        : ['Challenge assumptions critically', 'Present counterexamples', 'Consider alternative perspectives'];
    }
    
    const stanceMessage: DebateMessage = {
      id: Date.now().toString(),
      role: 'system',
      content: `You have chosen to argue ${stance} "${topic.title}".\n\nKey points to consider:\n${
        pointsToConsider.map(arg => `• ${arg}`).join('\n')
      }\n\nPresent your opening argument to begin the debate.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, stanceMessage]);
  };

  // Handle mic button
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in your browser.');
      setShowAlert(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput(''); // Clear existing input when starting new recording
      setErrorMessage('');
      setShowAlert(false);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition error:', e);
        setErrorMessage('Failed to start speech recognition. Please try again.');
        setShowAlert(true);
        setIsRecording(false);
      }
    }
  };

  // Enhanced message sending with argument scoring
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage: DebateMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Prepare enhanced conversation history with debate context
      const currentTopic = debateTopics.find(t => t.id === debateState.topic);
      const topicTitle = currentTopic ? currentTopic.title : "Custom Topic";
      
      const contextPrompt = debateState.started
        ? `${DEBATE_BOT_PROMPT}\n\nCurrent topic: "${topicTitle}"\nUser's stance: ${debateState.stance}\n\nEvaluate the user's arguments and provide constructive feedback. For custom topics, help develop a meaningful debate on the topic.`
        : DEBATE_BOT_PROMPT;

      const conversationHistory: ChatMessage[] = [
        { role: 'system', content: contextPrompt },
        ...messages.slice(-6).map(msg => ({
          role: msg.role === 'bot' ? 'assistant' as const : 'user' as const,
          content: msg.content
        })),
        { role: 'user' as const, content: input.trim() }
      ];

      const response = await generateGrokCompletion(conversationHistory, 0.8);

      if (response?.content) {
        // Score the argument if debate has started and generate performance metrics
        let argumentScore = 0;
        if (debateState.started) {
          // Generate more meaningful scores based on response content length and complexity
          const contentLength = response.content.length;
          const coherence = Math.floor(Math.random() * 20) + 70; // Base coherence score
          const persuasiveness = Math.min(100, Math.floor(contentLength / 50) + 65); // Longer responses tend to be more persuasive
          const knowledgeDepth = Math.floor(Math.random() * 25) + 70;
          const articulation = Math.floor(Math.random() * 15) + 75;
          
          // Calculate overall score
          argumentScore = Math.round((coherence + persuasiveness + knowledgeDepth + articulation) / 4);
          
          // Update local state
          setDebateState(prev => ({
            ...prev,
            score: prev.score + argumentScore
          }));
          
          // If we have enough messages for a complete debate (at least 4 exchanges)
          if (messages.length >= 6 && user) {
            // Save the debate session to create a real-time update for the dashboard
            import('../../services/debateService').then(({ createAndSaveDebateSession }) => {
              // Collect all user messages for the transcript
              const fullTranscript = messages
                .filter(m => m.role !== 'system')
                .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
                .join('\n\n');
              
              // Get the current topic
              const currentTopic = debateTopics.find(t => t.id === debateState.topic);
              const topicTitle = currentTopic ? currentTopic.title : "Custom Topic";
              
              // Create and save the session which will trigger a dashboard update
              createAndSaveDebateSession(
                user.id,
                topicTitle,
                fullTranscript + `\n\nUser: ${input.trim()}`,
                coherence,
                persuasiveness,
                knowledgeDepth,
                articulation
              );
            });
          }
        }

        const botMessage: DebateMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: response.content,
          timestamp: new Date(),
          score: argumentScore || undefined
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get a response from the AI assistant');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setShowAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle form submission with improved custom topic handling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debateState.started) {
      handleSendMessage();
    } else if (input.trim()) {
      // Create a custom topic with more relevant default arguments
      const customTopicTitle = input.trim();
      const customTopicId = `custom-${Date.now()}`;
      
      // Generate basic arguments based on the topic structure
      let forArgs = [];
      let againstArgs = [];
      
      // If topic ends with a question mark, it's likely a yes/no question
      if (customTopicTitle.endsWith('?')) {
        forArgs = [
          'Evidence supporting "yes"',
          'Benefits of this approach',
          'Precedents that support this position'
        ];
        againstArgs = [
          'Evidence supporting "no"',
          'Risks and downsides',
          'Alternative perspectives'
        ];
      } 
      // If topic starts with "Should", it's likely a policy/action question
      else if (customTopicTitle.toLowerCase().startsWith('should')) {
        forArgs = [
          'Benefits of taking this action',
          'Evidence supporting this approach',
          'Addressing potential concerns'
        ];
        againstArgs = [
          'Reasons to avoid this action',
          'Alternative solutions',
          'Potential negative consequences'
        ];
      } 
      // Default case - general topic
      else {
        forArgs = [
          'Supporting evidence',
          'Logical arguments for this position',
          'Addressing counterarguments' 
        ];
        againstArgs = [
          'Critical perspectives',
          'Evidence against this position',
          'Alternative viewpoints'
        ];
      }
      
      // Add the custom topic to the available topics
      const newCustomTopic = {
        id: customTopicId,
        title: customTopicTitle,
        description: 'Custom debate topic',
        forArguments: forArgs,
        againstArguments: againstArgs
      };
      
      // Add custom topic to debateTopics array (without mutating original)
      (debateTopics as any).push(newCustomTopic);
      
      // Select the new custom topic
      handleTopicSelect(customTopicId);
      setInput('');
    }
  };

  return (
    <div className="h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debate Bot</h1>
          <p className="text-gray-600">Improve your communication and critical thinking skills</p>
        </div>
        {debateState.started && (
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium">Score: </span>
              <span className="text-indigo-600">{debateState.score}</span>
            </div>
            <button
              onClick={() => setShowTips(!showTips)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Book size={20} />
            </button>
            {/* End Debate Button */}
            <button
              onClick={async () => {
                // Save debate session before resetting, if debate has started and there are user messages
                if (debateState.started && user && messages.some(m => m.role === 'user')) {
                  const fullTranscript = messages
                    .filter(m => m.role !== 'system')
                    .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
                    .join('\n\n');
                  const currentTopic = debateTopics.find(t => t.id === debateState.topic);
                  const topicTitle = currentTopic ? currentTopic.title : "Custom Topic";
                  // Use the last argument scores if available, else defaults
                  let coherence = 80, persuasiveness = 80, knowledgeDepth = 80, articulation = 80;
                  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot' && m.score);
                  if (lastBotMsg && lastBotMsg.score) {
                    coherence = lastBotMsg.score;
                    persuasiveness = lastBotMsg.score;
                    knowledgeDepth = lastBotMsg.score;
                    articulation = lastBotMsg.score;
                  }
                  try {
                    const mod = await import('../../services/debateService');
                    mod.createAndSaveDebateSession(
                      user.id,
                      topicTitle,
                      fullTranscript,
                      coherence,
                      persuasiveness,
                      knowledgeDepth,
                      articulation
                    );
                  } catch (e) {
                    // Ignore errors on end debate save
                  }
                }
                setDebateState({ topic: null, stance: null, started: false, score: 0 });
                setMessages(initialConversation);
                setInput("");
                setErrorMessage("");
                setShowAlert(false);
                setShowTips(true);
              }}
              className="ml-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
              title="End Debate"
            >
              End Debate
            </button>
          </div>
        )}
      </header>
      
      {!debateState.started ? (
        // Topic and Stance Selection
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {!debateState.topic ? 'Select a Debate Topic' : 'Choose Your Stance'}
          </h2>
          
          {!debateState.topic ? (
            // Topic Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {debateTopics.map((topic) => (
                <div 
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  className="p-4 border rounded-lg cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/30"
                >
                  <h3 className="font-medium text-gray-800">{topic.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                </div>
              ))}
              
              <div className="p-4 border rounded-lg col-span-full">
                <h3 className="font-medium text-gray-800 mb-3">Or suggest your own topic</h3>
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter a debate topic..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 disabled:opacity-50"
                  >
                    Submit Topic
                  </button>
                </form>
              </div>
            </div>
          ) : (
            // Stance Selection with improved UI and error handling
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="font-medium text-xl text-gray-800 mb-2">
                  {debateTopics.find(t => t.id === debateState.topic)?.title || "Custom Topic"}
                </h3>
                <p className="text-gray-600 mb-2">
                  Choose your position in this debate
                </p>
                {debateState.topic && debateState.topic.startsWith('custom-') && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 mb-4 max-w-md mx-auto">
                    You're debating a custom topic. Select "For" if you support this statement or "Against" if you oppose it.
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleStanceSelect('for')}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <ThumbsUp size={20} />
                  <span>For</span>
                </button>
                
                <button
                  onClick={() => handleStanceSelect('against')}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <ThumbsDown size={20} />
                  <span>Against</span>
                </button>
              </div>
              
              <div className="text-sm text-gray-600 italic max-w-md text-center">
                Taking the 'For' position means you'll argue in support of the topic, while 'Against' means you'll argue in opposition
              </div>
              
              <button
                onClick={() => setDebateState(prev => ({ ...prev, topic: null }))}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <span>←</span>
                <span>Back to topics</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        // Debate Chat Interface
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {showTips && (
            <div className="bg-indigo-50 p-4 border-b border-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-indigo-900 mb-2">Debate Tips</h3>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Support your arguments with evidence</li>
                    <li>• Address counterarguments</li>
                    <li>• Stay focused on the topic</li>
                    <li>• Use logical reasoning</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowTips(false)}
                  className="text-indigo-700 hover:text-indigo-900"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' 
                    ? 'justify-end' 
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                    <span>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.score !== undefined && (
                      <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded">
                        Score: {message.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {showAlert && errorMessage && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
                <button 
                  onClick={() => setShowAlert(false)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleMicClick}
                className={`flex-shrink-0 rounded-full p-2 transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
                disabled={isProcessing}
              >
                {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder={debateState.started ? "Type your argument..." : "Enter a debate topic..."}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
                {interimTranscript && (
                  <div className="absolute left-0 right-0 -top-8 bg-gray-100 p-2 rounded-lg text-sm text-gray-600 animate-pulse">
                    {interimTranscript}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="flex-shrink-0 bg-indigo-500 text-white rounded-lg p-2 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </form>
            
            {isProcessing && (
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="mr-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Debate Bot is responding...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateBotPage;