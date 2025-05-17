import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Code, 
  Database, 
  Network, 
  Server, 
  Shield, 
  Smartphone, 
  ChevronRight, 
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getEmotionalScores } from '../../utils/emotionUtils';
import { createAndSaveEQSession } from '../../services/sessionService';
import { EmotionalState } from '../../types';

// Define quiz question structure
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  subject: QuizSubject;
  eqType?: EmotionalState | null;
  eqExplanation?: string;
}

// Define quiz subject types
type QuizSubject = 'algorithms' | 'data-structures' | 'databases' | 'web-dev' | 'cybersecurity' | 'mobile';

// Constants for EQ scoring
const EQ_QUESTION_PERCENTAGE = 0.4; // 40% of questions will have EQ component

// Quiz subjects with their icons and descriptions
const QUIZ_SUBJECTS = [
  { 
    id: 'algorithms', 
    name: 'Algorithms', 
    icon: <Code />, 
    description: 'Test your knowledge of algorithmic efficiency and problem-solving techniques.'
  },
  { 
    id: 'data-structures', 
    name: 'Data Structures', 
    icon: <Book />, 
    description: 'Explore your understanding of fundamental data structures like arrays, linked lists, trees, and graphs.'
  },
  { 
    id: 'databases', 
    name: 'Databases', 
    icon: <Database />, 
    description: 'Challenge yourself with SQL, NoSQL, and database design concepts.'
  },
  { 
    id: 'web-dev', 
    name: 'Web Development', 
    icon: <Network />, 
    description: 'Test your knowledge of frontend and backend technologies, frameworks, and best practices.'
  },
  { 
    id: 'cybersecurity', 
    name: 'Cybersecurity', 
    icon: <Shield />, 
    description: 'Assess your understanding of security principles, vulnerabilities, and safeguards.'
  },
  { 
    id: 'mobile', 
    name: 'Mobile Development', 
    icon: <Smartphone />, 
    description: 'Test your knowledge of mobile development frameworks, patterns, and practices.'
  },
];

// Generate quiz questions with embedded EQ components
const generateQuizQuestions = (): QuizQuestion[] => {
  const emotionalStates: EmotionalState[] = ['happy', 'sad', 'angry', 'anxious', 'neutral', 'calm', 'distressed'];
  
  const questions: QuizQuestion[] = [
    // Algorithms Questions
    {
      id: 'algo-1',
      question: 'What is the time complexity of a binary search algorithm?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
      correctAnswer: 1,
      subject: 'algorithms',
      eqType: null
    },
    {
      id: 'algo-2',
      question: 'When implementing a sorting algorithm for a critical project deadline that makes you anxious, which one should you choose for best average-case performance?',
      options: ['Bubble sort', 'Insertion sort', 'Quick sort', 'Selection sort'],
      correctAnswer: 2,
      subject: 'algorithms',
      eqType: 'anxious',
      eqExplanation: 'This question evaluates how you handle pressure and anxiety when making technical decisions.'
    },
    {
      id: 'algo-3',
      question: 'A recursive algorithm that makes you calm and collected when solving problems must avoid what pitfall?',
      options: ['Loop invariants', 'Stack overflow', 'Branch prediction', 'Cache invalidation'],
      correctAnswer: 1,
      subject: 'algorithms',
      eqType: 'calm',
      eqExplanation: 'This question measures how you maintain calm while avoiding technical issues.'
    },
    
    // Data Structures Questions
    {
      id: 'ds-1',
      question: 'What data structure would you use to implement a priority queue?',
      options: ['Array', 'Linked List', 'Heap', 'Hash Table'],
      correctAnswer: 2,
      subject: 'data-structures',
      eqType: null
    },
    {
      id: 'ds-2',
      question: 'You\'re feeling frustrated and angry while debugging. Which data structure is most appropriate for implementing a cache with fast lookups?',
      options: ['Linked List', 'Binary Tree', 'Hash Table', 'Stack'],
      correctAnswer: 2,
      subject: 'data-structures',
      eqType: 'angry',
      eqExplanation: 'This question evaluates how you handle frustration while making technical decisions.'
    },
    {
      id: 'ds-3',
      question: 'When feeling sad about a failed project, which tree traversal would you use to visit nodes in ascending order?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level order'],
      correctAnswer: 1,
      subject: 'data-structures',
      eqType: 'sad',
      eqExplanation: 'This question assesses your ability to focus despite feeling down.'
    },
    
    // Databases Questions
    {
      id: 'db-1',
      question: 'Which normal form eliminates transitive dependencies?',
      options: ['1NF', '2NF', '3NF', '4NF'],
      correctAnswer: 2,
      subject: 'databases',
      eqType: null
    },
    {
      id: 'db-2',
      question: 'You\'re excitedly designing a database schema. What type of relationship allows many records in one table to relate to many records in another?',
      options: ['One-to-one', 'One-to-many', 'Many-to-many', 'Recursive'],
      correctAnswer: 2,
      subject: 'databases',
      eqType: 'happy',
      eqExplanation: 'This question measures how effectively you channel positive energy into technical work.'
    },
    {
      id: 'db-3',
      question: 'While feeling overwhelmed and distressed, you need to optimize a slow SQL query. What should you check first?',
      options: ['Add more WHERE clauses', 'Index the relevant columns', 'Use more JOIN statements', 'Convert to a stored procedure'],
      correctAnswer: 1,
      subject: 'databases',
      eqType: 'distressed',
      eqExplanation: 'This question evaluates how you prioritize under severe stress.'
    },
    
    // Web Development Questions
    {
      id: 'web-1',
      question: 'What does CORS stand for in web development?',
      options: ['Cross-Origin Resource Sharing', 'Create Object Render System', 'Cross Origin Response System', 'Create Object Response Script'],
      correctAnswer: 0,
      subject: 'web-dev',
      eqType: null
    },
    {
      id: 'web-2',
      question: 'When feeling neutral about a project, which pattern would you use to handle component communication in React?',
      options: ['Singletons', 'Event delegation', 'Prop drilling', 'Context API'],
      correctAnswer: 3,
      subject: 'web-dev',
      eqType: 'neutral',
      eqExplanation: 'This question assesses your default technical choices when not emotionally influenced.'
    },
    {
      id: 'web-3',
      question: 'Your team is feeling anxious about a deadline. Which approach to CSS would be most efficient?',
      options: ['Inline styles', 'CSS-in-JS', 'Utility classes (like Tailwind)', 'CSS preprocessors (like SASS)'],
      correctAnswer: 2,
      subject: 'web-dev',
      eqType: 'anxious',
      eqExplanation: 'This question evaluates how you make technical decisions under time pressure.'
    },
    
    // Cybersecurity Questions
    {
      id: 'sec-1',
      question: 'What type of attack uses falsified ARP messages?',
      options: ['Phishing', 'DDoS', 'ARP spoofing', 'SQL injection'],
      correctAnswer: 2,
      subject: 'cybersecurity',
      eqType: null
    },
    {
      id: 'sec-2',
      question: 'You discover a security breach and feel angry about the oversight. What\'s the first step you should take?',
      options: ['Fix the vulnerability', 'Inform management', 'Document the breach', 'Isolate affected systems'],
      correctAnswer: 3,
      subject: 'cybersecurity',
      eqType: 'angry',
      eqExplanation: 'This question evaluates how you handle security incidents while feeling upset.'
    },
    {
      id: 'sec-3',
      question: 'Feeling calm and methodical, which encryption method would you choose for storing passwords?',
      options: ['AES encryption', 'One-way hashing with salt', 'Base64 encoding', 'XOR cipher'],
      correctAnswer: 1,
      subject: 'cybersecurity',
      eqType: 'calm',
      eqExplanation: 'This question assesses your security decision-making when in a balanced state.'
    },
    
    // Mobile Development Questions
    {
      id: 'mob-1',
      question: 'Which pattern is commonly used for state management in mobile apps?',
      options: ['MVC', 'MVVM', 'Repository', 'All of the above'],
      correctAnswer: 3,
      subject: 'mobile',
      eqType: null
    },
    {
      id: 'mob-2',
      question: 'When you\'re feeling happy and productive, which approach to handling device orientation changes is best?',
      options: ['Lock orientation', 'Recreate the activity/view controller', 'Save instance state', 'Use a responsive layout'],
      correctAnswer: 3,
      subject: 'mobile',
      eqType: 'happy',
      eqExplanation: 'This question evaluates how you handle technical challenges when in a positive mood.'
    },
    {
      id: 'mob-3',
      question: 'You\'re feeling sad after user feedback. How should you implement offline functionality in a mobile app?',
      options: ['Cache API responses', 'Use a local database', 'Implement a sync service', 'All of the above'],
      correctAnswer: 3,
      subject: 'mobile',
      eqType: 'sad',
      eqExplanation: 'This question assesses how you respond to feedback and improve user experience.'
    },
    
    // Additional questions for each category
    // Algorithms
    {
      id: 'algo-4',
      question: 'What divide-and-conquer algorithm has an average time complexity of O(n log n)?',
      options: ['Bubble sort', 'Merge sort', 'Insertion sort', 'Selection sort'],
      correctAnswer: 1,
      subject: 'algorithms',
      eqType: null
    },
    {
      id: 'algo-5',
      question: 'While feeling overwhelmed, which algorithm would you use for finding the shortest path in a weighted graph?',
      options: ['BFS', 'DFS', 'Dijkstra\'s', 'A*'],
      correctAnswer: 2,
      subject: 'algorithms',
      eqType: 'distressed',
      eqExplanation: 'This question evaluates your technical decision-making under distress.'
    },
    
    // Data Structures
    {
      id: 'ds-4',
      question: 'Which data structure uses LIFO ordering?',
      options: ['Queue', 'Stack', 'Heap', 'LinkedList'],
      correctAnswer: 1,
      subject: 'data-structures',
      eqType: null
    },
    {
      id: 'ds-5',
      question: 'When feeling happy and confident, which would you choose for dynamic memory allocation?',
      options: ['Array', 'Linked List', 'Both depending on use case', 'Neither'],
      correctAnswer: 2,
      subject: 'data-structures',
      eqType: 'happy',
      eqExplanation: 'This question assesses your balanced decision-making when feeling positive.'
    },
    
    // Databases
    {
      id: 'db-4',
      question: 'What is eventual consistency in distributed databases?',
      options: [
        'Data will be consistent if given enough time', 
        'Data is always consistent', 
        'Data is never consistent', 
        'Consistency is not important'
      ],
      correctAnswer: 0,
      subject: 'databases',
      eqType: null
    },
    {
      id: 'db-5',
      question: 'Feeling anxious about database performance, which type of index would you add to improve query speed?',
      options: ['Full-text index', 'Clustered index', 'Non-clustered index', 'Depends on the query pattern'],
      correctAnswer: 3,
      subject: 'databases',
      eqType: 'anxious',
      eqExplanation: 'This question measures your ability to make nuanced decisions under pressure.'
    },
    
    // Web Development
    {
      id: 'web-4',
      question: 'What is the purpose of the "use strict" directive in JavaScript?',
      options: [
        'Force variable declaration before use', 
        'Eliminate silent errors', 
        'Prevent unsafe actions', 
        'All of the above'
      ],
      correctAnswer: 3,
      subject: 'web-dev',
      eqType: null
    },
    {
      id: 'web-5',
      question: 'While feeling neutral about framework choices, which state management solution would you pick for a large-scale React app?',
      options: ['Context API only', 'Redux', 'MobX', 'Recoil'],
      correctAnswer: 1,
      subject: 'web-dev',
      eqType: 'neutral',
      eqExplanation: 'This question evaluates your technical preferences without emotional influence.'
    },
    
    // Cybersecurity
    {
      id: 'sec-4',
      question: 'What is the main purpose of a WAF (Web Application Firewall)?',
      options: [
        'Filter network traffic', 
        'Protect against application-layer attacks', 
        'Scan for malware', 
        'Authenticate users'
      ],
      correctAnswer: 1,
      subject: 'cybersecurity',
      eqType: null
    },
    {
      id: 'sec-5',
      question: 'You\'re feeling calm during a security audit. What\'s the most comprehensive approach to testing for vulnerabilities?',
      options: ['Automated scanning', 'Manual code review', 'Penetration testing', 'A combination of all approaches'],
      correctAnswer: 3,
      subject: 'cybersecurity',
      eqType: 'calm',
      eqExplanation: 'This question assesses your thoroughness in security work when feeling centered.'
    },
    
    // Mobile Development
    {
      id: 'mob-4',
      question: 'What is the key difference between WebView and native components?',
      options: [
        'WebView renders web content; native uses platform UI components', 
        'WebView is faster than native components', 
        'Native components cannot access device features', 
        'WebView has better security'
      ],
      correctAnswer: 0,
      subject: 'mobile',
      eqType: null
    },
    {
      id: 'mob-5',
      question: 'Feeling sad about poor app performance, which approach would you take to optimize battery usage?',
      options: [
        'Use more background services', 
        'Implement wake locks', 
        'Batch network requests and use workmanagers', 
        'Disable all background processing'
      ],
      correctAnswer: 2,
      subject: 'mobile',
      eqType: 'sad',
      eqExplanation: 'This question evaluates your problem-solving ability when feeling down.'
    },
  ];
  
  return questions;
};

const QuizPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSubject, setActiveSubject] = useState<QuizSubject>('algorithms');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [eqMetrics, setEqMetrics] = useState({
    moodScore: 0,
    distressLevel: 0,
    stabilityScore: 0,
    emotionalState: 'neutral' as EmotionalState
  });
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showEqInsight, setShowEqInsight] = useState(false);
  
  // Generate and filter questions based on subject
  useEffect(() => {
    const allQuestions = generateQuizQuestions();
    setQuestions(allQuestions.filter(q => q.subject === activeSubject));
    // Reset quiz state when subject changes
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    setShowEqInsight(false);
  }, [activeSubject]);
  
  // Calculate EQ metrics based on question responses
  const calculateEQMetrics = (question: QuizQuestion, isCorrect: boolean) => {
    if (!question.eqType) return;
    
    // Get baseline emotional scores for the question type
    const baseScores = getEmotionalScores(question.eqType);
    
    // Adjust based on correctness
    let adjustedScores = { ...baseScores };
    
    // If the user got it right, shift the scores in a positive direction
    if (isCorrect) {
      // For negative emotions, reduce their intensity
      if (['sad', 'angry', 'anxious', 'distressed'].includes(question.eqType)) {
        adjustedScores.distressLevel = Math.max(0, adjustedScores.distressLevel - 15);
        adjustedScores.stabilityScore = Math.min(100, adjustedScores.stabilityScore + 10);
        adjustedScores.moodScore = Math.min(100, adjustedScores.moodScore + 10);
      } 
      // For positive emotions, enhance them
      else if (['happy', 'calm'].includes(question.eqType)) {
        adjustedScores.moodScore = Math.min(100, adjustedScores.moodScore + 15);
        adjustedScores.stabilityScore = Math.min(100, adjustedScores.stabilityScore + 10);
        adjustedScores.distressLevel = Math.max(0, adjustedScores.distressLevel - 10);
      }
    } 
    // If wrong, shift in a negative direction
    else {
      // For negative emotions, intensify them
      if (['sad', 'angry', 'anxious', 'distressed'].includes(question.eqType)) {
        adjustedScores.distressLevel = Math.min(100, adjustedScores.distressLevel + 10);
        adjustedScores.stabilityScore = Math.max(0, adjustedScores.stabilityScore - 10);
        adjustedScores.moodScore = Math.max(0, adjustedScores.moodScore - 10);
      } 
      // For positive emotions, dampen them
      else if (['happy', 'calm'].includes(question.eqType)) {
        adjustedScores.moodScore = Math.max(0, adjustedScores.moodScore - 15);
        adjustedScores.stabilityScore = Math.max(0, adjustedScores.stabilityScore - 10);
        adjustedScores.distressLevel = Math.min(100, adjustedScores.distressLevel + 5);
      }
    }
    
    // Update running average of EQ metrics
    setEqMetrics(prev => {
      const totalQuestions = currentQuestionIndex + 1;
      const eqQuestionsAnswered = questions.slice(0, currentQuestionIndex + 1).filter(q => q.eqType).length;
      
      if (eqQuestionsAnswered === 0) return prev;
      
      return {
        moodScore: Math.round((prev.moodScore * (eqQuestionsAnswered - 1) + adjustedScores.moodScore) / eqQuestionsAnswered),
        distressLevel: Math.round((prev.distressLevel * (eqQuestionsAnswered - 1) + adjustedScores.distressLevel) / eqQuestionsAnswered),
        stabilityScore: Math.round((prev.stabilityScore * (eqQuestionsAnswered - 1) + adjustedScores.stabilityScore) / eqQuestionsAnswered),
        emotionalState: question.eqType
      };
    });
  };
  
  // Handle option selection
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Process EQ metrics if this is an EQ question
    if (currentQuestion.eqType) {
      calculateEQMetrics(currentQuestion, isCorrect);
    }
  };
  
  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz is completed
      setQuizCompleted(true);
      
      // Save the EQ session if user is logged in and EQ metrics were collected
      if (user && questions.some(q => q.eqType)) {
        const transcript = `Quiz completed on ${activeSubject}: Score ${score}/${questions.length}`;
        
        createAndSaveEQSession(user, transcript, eqMetrics.emotionalState);
      }
    }
  };
  
  // Reset quiz
  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    setEqMetrics({
      moodScore: 0,
      distressLevel: 0,
      stabilityScore: 0,
      emotionalState: 'neutral'
    });
    setShowEqInsight(false);
  };
  
  // Generate PDF report
  const handleGeneratePDF = () => {
    // This would be implemented with PDF generation library
    console.log('Generating PDF with score:', score, 'EQ metrics:', eqMetrics);
    // For now we'll just show a placeholder message
    alert('PDF report generated! Check your downloads folder.');
  };
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Count EQ questions
  const eqQuestionCount = questions.filter(q => q.eqType).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CS Engineering Quiz</h1>
        <p className="text-gray-600 mt-1">Test your technical knowledge across different CS engineering domains</p>
      </header>
      
      {/* Subject tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {QUIZ_SUBJECTS.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setActiveSubject(subject.id as QuizSubject)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSubject === subject.id
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{subject.icon}</span>
              <span>{subject.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Subject description */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            {QUIZ_SUBJECTS.find(s => s.id === activeSubject)?.icon}
            <span className="ml-2">{QUIZ_SUBJECTS.find(s => s.id === activeSubject)?.name}</span>
          </h2>
          <p className="text-gray-600 mt-1">{QUIZ_SUBJECTS.find(s => s.id === activeSubject)?.description}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">{questions.length}</span> questions total • 
            <span className="font-medium"> {eqQuestionCount}</span> with EQ components
          </div>
        </div>
      </div>
      
      {!quizCompleted ? (
        /* Quiz in progress */
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {/* Progress indicator */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="text-sm font-medium text-indigo-600">
                Score: {score}/{currentQuestionIndex + (isAnswered ? 1 : 0)}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-2 bg-indigo-600 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              ></div>
            </div>
            
            {currentQuestion && (
              <>
                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl font-medium text-gray-800 mb-2">
                    {currentQuestion.question}
                  </h3>
                  {currentQuestion.eqType && (
                    <div className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1 inline-flex items-center">
                      <span>EQ Component</span>
                    </div>
                  )}
                </div>
                
                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(index)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-lg border transition ${
                        isAnswered 
                          ? index === currentQuestion.correctAnswer
                            ? 'border-green-300 bg-green-50 text-green-800'
                            : index === selectedOption
                              ? 'border-red-300 bg-red-50 text-red-800'
                              : 'border-gray-200 text-gray-500'
                          : selectedOption === index
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isAnswered && (
                          index === currentQuestion.correctAnswer 
                            ? <CheckCircle className="h-5 w-5 text-green-600" />
                            : index === selectedOption && index !== currentQuestion.correctAnswer
                              ? <XCircle className="h-5 w-5 text-red-600" />
                              : null
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* EQ Explanation when answered */}
                {isAnswered && currentQuestion.eqType && currentQuestion.eqExplanation && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    <p><strong>EQ Insight:</strong> {currentQuestion.eqExplanation}</p>
                  </div>
                )}
                
                {/* Next button */}
                {isAnswered && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Quiz completed */
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
            <p className="text-gray-600 mb-4">
              You scored {score} out of {questions.length} questions correctly
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
              <button
                onClick={() => setShowEqInsight(!showEqInsight)}
                className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                {showEqInsight ? 'Hide EQ Insights' : 'Show EQ Insights'}
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
              <button
                onClick={handleResetQuiz}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
            
            {/* EQ Insights */}
            {showEqInsight && eqMetrics.moodScore > 0 && (
              <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 text-left">
                <h3 className="font-semibold text-lg text-blue-800 mb-2">Your Emotional Intelligence Insights</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Mood Score</p>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className="h-3 bg-blue-600 rounded-full"
                        style={{ width: `${eqMetrics.moodScore}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{eqMetrics.moodScore}/100</span>
                      <span>100</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Emotional Stability</p>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className="h-3 bg-purple-600 rounded-full"
                        style={{ width: `${eqMetrics.stabilityScore}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{eqMetrics.stabilityScore}/100</span>
                      <span>100</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Distress Level</p>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className="h-3 bg-red-500 rounded-full"
                        style={{ width: `${eqMetrics.distressLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{eqMetrics.distressLevel}/100</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-700">
                  <p>Based on your responses to emotional components in technical questions, these metrics reflect how you might handle similar situations in real work environments.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
