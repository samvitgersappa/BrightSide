import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, BarChart, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  Flame, AlertOctagon, Trophy, Activity, Target, Star,
  Award, Book, Zap, Calendar 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  getRecentUserSessions,
  analyzeEmotionalTrends 
} from '../../services/sessionService';
import {
  getRecentUserDebateSessions,
  getUserDebateAverages,
  analyzeDebatePerformanceTrends
} from '../../services/debateService';
import { getPersonalizedMetrics } from '../../services/personalizationService';
import { getRealTimeAnalytics, type RealTimeMetrics } from '../../services/analyticsService';
import { realtimeService } from '../../services/realtimeService';
import { EQSession, DebateSession, PersonalizedMetrics } from '../../types';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentEQSessions, setRecentEQSessions] = useState<EQSession[]>([]);
  const [recentDebateSessions, setRecentDebateSessions] = useState<DebateSession[]>([]);
  // Removed emotionalAverages state as we're using realTimeMetrics
  const [debateAverages, setDebateAverages] = useState({
    avgCoherence: 50,
    avgPersuasiveness: 50,
    avgKnowledgeDepth: 50,
    avgArticulation: 50,
    avgOverallScore: 50
  });
  const [emotionalTrends, setEmotionalTrends] = useState<any>(null);
  const [debateTrends, setDebateTrends] = useState<any>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);
  const [personalizedMetrics, setPersonalizedMetrics] = useState<PersonalizedMetrics | null>(null);

  // Enhanced real-time debate performance tracking
  const [debatePerformanceMetrics, setDebatePerformanceMetrics] = useState({
    currentArgument: '',
    argumentScore: 0,
    realtimeScore: 0,
    lastUpdateTimestamp: null
  });

  const [activeDebate, setActiveDebate] = useState<{
    currentArgument: string;
    score: number;
    lastUpdate: Date | null;
    inProgress: boolean;
  }>({
    currentArgument: '',
    score: 0,
    lastUpdate: null,
    inProgress: false
  });

  // Update dashboard data when new sessions arrive
  const updateDashboardData = useCallback(async () => {
    if (user) {
      // Get session data
      const eqSessions = getRecentUserSessions(user.id);
      setRecentEQSessions(eqSessions);
      
      // Get emotional trends
      const eqTrends = analyzeEmotionalTrends(user.id);
      setEmotionalTrends(eqTrends);
      
      // Get debate data
      const debateSessions = getRecentUserDebateSessions(user.id);
      setRecentDebateSessions(debateSessions);
      
      // Get debate metrics  
      const debateAvgs = getUserDebateAverages(user.id);
      setDebateAverages(debateAvgs);
      
      // Get debate performance trends
      const debatePerformance = analyzeDebatePerformanceTrends(user.id);
      setDebateTrends(debatePerformance);

      // Get real-time analytics for dashboard
      const analytics = getRealTimeAnalytics(user.id);
      setRealTimeMetrics(analytics);

      // Get personalized metrics
      const metrics = await getPersonalizedMetrics(user.id);
      setPersonalizedMetrics(metrics);
    }
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (user) {
      // Initial data load
      updateDashboardData().catch(console.error);
      
      // Subscribe to real-time updates
      const unsubscribeEQ = realtimeService.subscribe('eq', (session: EQSession) => {
        if (session.userId === user.id) {
          updateDashboardData().catch(console.error);
        }
      });
      
      // Enhanced debate subscription with real-time performance tracking
      const unsubscribeDebate = realtimeService.subscribe('debate', (session: DebateSession) => {
        if (session.userId === user.id) {
          // Update overall dashboard data
          updateDashboardData().catch(console.error);
          
          // Update real-time debate status
          if (session.inProgress) {
            setActiveDebate({
              currentArgument: session.currentArgument || '',
              score: session.performanceMetrics.overallScore,
              lastUpdate: session.lastArgumentTimestamp || new Date(),
              inProgress: true
            });
          } else {
            setActiveDebate(prev => ({
              ...prev,
              inProgress: false
            }));
          }

          // Update debate averages immediately
          setDebateAverages({
            avgCoherence: session.performanceMetrics.coherence,
            avgPersuasiveness: session.performanceMetrics.persuasiveness,
            avgKnowledgeDepth: session.performanceMetrics.knowledgeDepth,
            avgArticulation: session.performanceMetrics.articulation,
            avgOverallScore: session.performanceMetrics.overallScore
          });
        }
      });
      
      // Cleanup subscriptions
      return () => {
        unsubscribeEQ();
        unsubscribeDebate();
      };
    }
  }, [user, updateDashboardData]);

  // For demo purposes - simulate real-time updates
  const simulateEQUpdate = () => {
    if (user) {
      const randomMood = Math.floor(Math.random() * 100);
      const randomDistress = Math.floor(Math.random() * 100);
      const randomStability = Math.floor(Math.random() * 100);
      
      const newSession = {
        id: `sim-${Date.now()}`,
        userId: user.id,
        timestamp: new Date(),
        moodScore: randomMood,
        distressLevel: randomDistress,
        stabilityScore: randomStability,
        transcript: "This is a simulated EQ session.",
        summary: `Simulated ${randomMood > 70 ? 'positive' : randomMood < 30 ? 'negative' : 'neutral'} sentiment.`,
        alertSent: randomDistress > 70
      };
      
      // Use the realtimeService to simulate a real-time update
      realtimeService.simulateUpdate('eq', newSession);
    }
  };

  const simulateDebateUpdate = () => {
    if (user) {
      const randomCoherence = Math.floor(Math.random() * 100);
      const randomPersuasiveness = Math.floor(Math.random() * 100);
      const randomKnowledge = Math.floor(Math.random() * 100);
      const randomArticulation = Math.floor(Math.random() * 100);
      const randomOverall = Math.round((randomCoherence + randomPersuasiveness + randomKnowledge + randomArticulation) / 4);
      
      const topics = ["AI Ethics", "Renewable Energy", "Quantum Computing", "Future of Education", "Cybersecurity"];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const newSession = {
        id: `sim-${Date.now()}`,
        userId: user.id,
        timestamp: new Date(),
        topic: randomTopic,
        transcript: `This is a simulated debate on ${randomTopic}.`,
        performanceMetrics: {
          coherence: randomCoherence,
          persuasiveness: randomPersuasiveness,
          knowledgeDepth: randomKnowledge,
          articulation: randomArticulation,
          overallScore: randomOverall
        },
        feedback: `Simulated feedback for ${randomTopic} debate.`
      };
      
      // Use the realtimeService to simulate a real-time update
      realtimeService.simulateUpdate('debate', newSession);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 80) return '😊';
    if (score >= 60) return '🙂';
    if (score >= 40) return '😐';
    if (score >= 20) return '🙁';
    return '😔';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-emerald-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
            <span>Live data</span>
          </div>
        </div>
        <p className="text-gray-600 mt-1">Here's an overview of your emotional and debate performance</p>
      </header>

      {/* Daily Progress & Streaks */}
      {personalizedMetrics && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Daily Sessions</p>
                  <p className="text-2xl font-semibold">
                    {personalizedMetrics.dailyGoals.sessionsCompleted} / {personalizedMetrics.dailyGoals.sessionsTarget}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Current Streak</p>
                  <p className="text-2xl font-semibold">
                    {personalizedMetrics.dailyGoals.streakDays} days
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Weekly Growth</p>
                  <p className="text-2xl font-semibold">
                    +{Math.max(
                      personalizedMetrics.weeklyProgress.emotionalGrowth,
                      personalizedMetrics.weeklyProgress.debateSkillGrowth
                    )}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {personalizedMetrics && personalizedMetrics.achievements.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Achievements</h2>
              <Award className="text-yellow-500" size={24} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalizedMetrics.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Personalized Tips */}
      {personalizedMetrics && personalizedMetrics.personalizedTips.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Personalized Tips</h2>
              <Book className="text-blue-500" size={24} />
            </div>
            
            <div className="space-y-3">
              {personalizedMetrics.personalizedTips.map((tip, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${
                    tip.category === 'emotional' ? 'bg-pink-50' :
                    tip.category === 'debate' ? 'bg-blue-50' :
                    'bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 rounded-full p-2 ${
                    tip.category === 'emotional' ? 'bg-pink-100 text-pink-600' :
                    tip.category === 'debate' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {tip.category === 'emotional' ? <Activity size={16} /> :
                     tip.category === 'debate' ? <Zap size={16} /> :
                     <Calendar size={16} />}
                  </div>
                  <p className="text-sm text-gray-700">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Topics */}
      {personalizedMetrics && personalizedMetrics.weeklyProgress.topicsExplored.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Topics You've Explored</h2>
            <div className="flex flex-wrap gap-2">
              {personalizedMetrics.weeklyProgress.topicsExplored.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {showWarnings && realTimeMetrics?.warnings && realTimeMetrics.warnings.length > 0 && (
        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <AlertOctagon className="text-orange-500 mr-2" size={20} />
                <h2 className="text-lg font-semibold text-orange-800">Active Warnings</h2>
              </div>
              <button 
                onClick={() => setShowWarnings(false)}
                className="text-orange-500 hover:text-orange-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {realTimeMetrics?.warnings?.map((warning, index) => (
                <div 
                  key={index}
                  className={`flex items-start p-2 rounded ${
                    warning.level === 'high' ? 'bg-red-100 text-red-800' :
                    warning.level === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{warning.message}</p>
                    <p className="text-sm opacity-75">
                      {formatDate(warning.timestamp)} - {warning.metric}: {warning.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Streaks Section */}
      {realTimeMetrics?.activeStreaks && realTimeMetrics.activeStreaks.length > 0 && (
        <div className="mb-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Flame className="text-indigo-500 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-indigo-800">Active Streaks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {realTimeMetrics?.activeStreaks?.map((streak, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded ${
                    streak.type === 'positive' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className={`rounded-full p-2 ${
                    streak.type === 'positive' ? 'bg-green-200' : 'bg-red-200'
                  }`}>
                    {streak.type === 'positive' ? (
                      <Trophy size={16} className="text-green-700" />
                    ) : (
                      <Activity size={16} className="text-red-700" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium ${
                      streak.type === 'positive' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {streak.count} day streak in {streak.metric}
                    </p>
                    <p className="text-sm opacity-75">
                      {streak.type === 'positive' 
                        ? `Above ${streak.threshold}% consistently` 
                        : `Below ${streak.threshold}% consistently`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Insights */}
      {realTimeMetrics?.combinedInsights && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Real-time Insights</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Emotional State</p>
                  <p className={`text-lg font-medium capitalize ${
                    realTimeMetrics.combinedInsights.emotionalState === 'positive' ? 'text-green-600' :
                    realTimeMetrics.combinedInsights.emotionalState === 'negative' ? 'text-red-600' :
                    realTimeMetrics.combinedInsights.emotionalState === 'distressed' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {realTimeMetrics.combinedInsights.emotionalState}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Debate Performance</p>
                  <p className={`text-lg font-medium capitalize ${
                    realTimeMetrics.combinedInsights.debatePerformance === 'strong' ? 'text-green-600' :
                    realTimeMetrics.combinedInsights.debatePerformance === 'struggling' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {realTimeMetrics.combinedInsights.debatePerformance}
                  </p>
                </div>
                {realTimeMetrics.moodTrend !== 'stable' && (
                  <div className="flex items-center">
                    {realTimeMetrics.moodTrend === 'up' ? (
                      <TrendingUp className="text-green-500 mr-1" size={20} />
                    ) : (
                      <TrendingDown className="text-red-500 mr-1" size={20} />
                    )}
                    <span className="text-sm font-medium">
                      {realTimeMetrics.moodTrend === 'up' ? 'Improving' : 'Declining'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-800">Recommended Action:</p>
                <p className="text-sm text-gray-600 mt-1">
                  {realTimeMetrics.combinedInsights.recommendedAction}
                </p>
              </div>

              {realTimeMetrics.debateProgress.consistentAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700">Strong Areas:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {realTimeMetrics.debateProgress.consistentAreas.map(area => (
                      <span 
                        key={area}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {realTimeMetrics.debateProgress.challengingAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-700">Areas for Improvement:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {realTimeMetrics.debateProgress.challengingAreas.map(area => (
                      <span 
                        key={area}
                        className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Emotional Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Emotional Summary</h2>
            <div className="text-5xl">
              {getMoodEmoji(realTimeMetrics?.currentMood || 50)}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Current Mood</span>
                <div className="flex items-center">
                  {realTimeMetrics?.moodTrend !== 'stable' && (
                    <span className="mr-2">
                      {realTimeMetrics?.moodTrend === 'up' ? (
                        <TrendingUp className="text-green-500" size={16} />
                      ) : (
                        <TrendingDown className="text-red-500" size={16} />
                      )}
                    </span>
                  )}
                  <span className={`font-medium ${getScoreColor(realTimeMetrics?.currentMood || 50)}`}>
                    {realTimeMetrics?.currentMood || 50}/100
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${realTimeMetrics?.currentMood || 50}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Distress Level</span>
                <span className={`font-medium ${getScoreColor(100 - (realTimeMetrics?.distressLevel || 0))}`}>
                  {realTimeMetrics?.distressLevel || 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${realTimeMetrics?.distressLevel || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Emotional Stability</span>
                <span className={`font-medium ${getScoreColor(emotionalTrends?.emotionalStability || 50)}`}>
                  {emotionalTrends?.emotionalStability || 50}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${emotionalTrends?.emotionalStability || 50}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <Link to="/eq-bot" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Talk to EQ Bot
            </Link>
            <Link to="/analytics" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <LineChart size={16} className="mr-1" />
              View trends
            </Link>
          </div>
        </div>
        
        {/* Debate Performance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Debate Performance</h2>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {activeDebate.inProgress ? (
                <div className="animate-pulse">
                  <Activity size={20} className="text-blue-600" />
                </div>
              ) : (
                <BarChart size={20} className="text-blue-600" />
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {activeDebate.inProgress && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Active Debate Session</span>
                  <span className="text-xs text-blue-600">
                    Last update: {activeDebate.lastUpdate ? new Date(activeDebate.lastUpdate).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-blue-700 mb-2">
                  Current Argument: {activeDebate.currentArgument || 'Listening...'}
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-blue-600">Real-time Score</span>
                  <span className={`font-medium ${getScoreColor(activeDebate.score)}`}>
                    {activeDebate.score}/100
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${activeDebate.score}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Session Score</span>
                <span className={`font-medium ${getScoreColor(debateAverages.avgOverallScore)}`}>
                  {debateAverages.avgOverallScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${debateAverages.avgOverallScore}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Recent Topics:</p>
              <div className="space-y-2">
                {recentDebateSessions.map((session) => (
                  <div key={session.id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{session.topic}</span>
                    <span className={`text-sm ${getScoreColor(session.performanceMetrics.overallScore)}`}>
                      {session.performanceMetrics.overallScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <Link to="/debate-bot" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Start a debate
            </Link>
            <Link to="/analytics" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <LineChart size={16} className="mr-1" />
              View analytics
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Insights & Trends Section */}
        {/* EQ Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Emotional Intelligence Trends</h2>
          
          {emotionalTrends && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`flex items-center space-x-1 ${
                  emotionalTrends.trendDirection === 'improving' ? 'text-green-600' :
                  emotionalTrends.trendDirection === 'worsening' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {emotionalTrends.trendDirection === 'improving' ? <TrendingUp size={16} /> :
                   emotionalTrends.trendDirection === 'worsening' ? <TrendingDown size={16} /> :
                   <Minus size={16} />}
                  <span className="capitalize">{emotionalTrends.trendDirection}</span>
                </div>
                {emotionalTrends.volatility !== 'low' && (
                  <div className="text-orange-500 flex items-center space-x-1">
                    <AlertTriangle size={16} />
                    <span className="capitalize">{emotionalTrends.volatility} Volatility</span>
                  </div>
                )}
              </div>
              
              <div className="h-64">
                <Line
                  data={{
                    labels: recentEQSessions.map(session => 
                      formatDate(session.timestamp)
                    ).reverse(),
                    datasets: [
                      {
                        label: 'Mood Score',
                        data: recentEQSessions.map(session => 
                          session.moodScore
                        ).reverse(),
                        borderColor: 'rgb(99, 102, 241)',
                        tension: 0.4
                      },
                      {
                        label: 'Distress Level',
                        data: recentEQSessions.map(session => 
                          session.distressLevel
                        ).reverse(),
                        borderColor: 'rgb(139, 92, 246)',
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100
                      }
                    }
                  }}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium">Key Insights:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Your emotional stability is {emotionalTrends.emotionalStability}% ({emotionalTrends.volatility} volatility)</li>
                  <li>• Most common emotion: <span className="capitalize">{emotionalTrends.mostCommonEmotion}</span></li>
                  <li>• High distress frequency: {Math.round(emotionalTrends.distressFrequency * 100)}% of sessions</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Debate Performance Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Debate Performance Analysis</h2>
          
          {debateTrends && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`flex items-center space-x-1 ${
                  debateTrends.trendDirection === 'improving' ? 'text-green-600' :
                  debateTrends.trendDirection === 'declining' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {debateTrends.trendDirection === 'improving' ? <TrendingUp size={16} /> :
                   debateTrends.trendDirection === 'declining' ? <TrendingDown size={16} /> :
                   <Minus size={16} />}
                  <span>{debateTrends.improvementRate > 0 ? '+' : ''}{debateTrends.improvementRate}% growth</span>
                </div>
              </div>
              
              <div className="h-64">
                <Radar
                  data={{
                    labels: ['Coherence', 'Persuasiveness', 'Knowledge', 'Articulation'],
                    datasets: [{
                      label: 'Your Performance',
                      data: [
                        debateAverages.avgCoherence,
                        debateAverages.avgPersuasiveness,
                        debateAverages.avgKnowledgeDepth,
                        debateAverages.avgArticulation
                      ],
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      borderColor: 'rgb(99, 102, 241)',
                      pointBackgroundColor: 'rgb(99, 102, 241)'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        min: 0,
                        max: 100,
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium">Key Insights:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Strongest area: <span className="capitalize">{debateTrends.strongestArea}</span></li>
                  <li>• Area for improvement: <span className="capitalize">{debateTrends.weakestArea}</span></li>
                  <li>• Most discussed topics: {debateTrends.mostDiscussedTopics.join(', ')}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Activity Feed */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          
          <div className="divide-y divide-gray-100">
            {recentEQSessions.map((session) => (
              <div key={`eq-${session.id}`} className="py-3 flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    {getMoodEmoji(session.moodScore)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    EQ Session on {formatDate(session.timestamp)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mood: {session.moodScore}/100 | Distress: {session.distressLevel}/100
                  </p>
                </div>
              </div>
            ))}

            {recentDebateSessions.map((session) => (
              <div key={`debate-${session.id}`} className="py-3 flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart size={18} className="text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Debate on {session.topic}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Date: {formatDate(session.timestamp)} | Score: {session.performanceMetrics.overallScore}/100
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Simulation Controls (for demo purposes) */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Real-time Demo Controls</h2>
          <p className="text-sm text-gray-600 mb-4">These buttons simulate real-time updates from EQ and Debate bots.</p>
          <div className="flex space-x-4">
            <button
              onClick={simulateEQUpdate}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Simulate EQ Update
            </button>
            <button
              onClick={simulateDebateUpdate}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Simulate Debate Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;