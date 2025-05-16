import React, { useState, useEffect } from 'react';
import { LineChart, BarChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getRecentUserSessions, getUserEmotionalAverages } from '../../services/sessionService';
import { EQSession } from '../../types';

// Keep the debate sessions mock for now (not part of our current focus)
const recentDebateSessions = [
  { id: '1', date: '2025-05-14', topic: 'AI Ethics', overallScore: 82 },
  { id: '2', date: '2025-05-08', topic: 'Renewable Energy', overallScore: 76 },
  { id: '3', date: '2025-05-02', topic: 'Quantum Computing', overallScore: 88 },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentEQSessions, setRecentEQSessions] = useState<EQSession[]>([]);
  const [emotionalAverages, setEmotionalAverages] = useState({
    avgMood: 50,
    avgDistress: 35,
    avgStability: 60
  });

  useEffect(() => {
    if (user) {
      // Load recent sessions
      const sessions = getRecentUserSessions(user.id);
      setRecentEQSessions(sessions);

      // Load emotional averages
      const averages = getUserEmotionalAverages(user.id);
      setEmotionalAverages(averages);
    }
  }, [user]);

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's an overview of your emotional and debate performance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Emotional Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Emotional Summary</h2>
            <div className="text-5xl">
              {getMoodEmoji(emotionalAverages.avgMood)}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Average Mood</span>
                <span className={`font-medium ${getScoreColor(emotionalAverages.avgMood)}`}>
                  {emotionalAverages.avgMood}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${emotionalAverages.avgMood}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Distress Level</span>
                <span className={`font-medium ${getScoreColor(100 - emotionalAverages.avgDistress)}`}>
                  {emotionalAverages.avgDistress}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${emotionalAverages.avgDistress}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Emotional Stability</span>
                <span className={`font-medium ${getScoreColor(emotionalAverages.avgStability)}`}>
                  {emotionalAverages.avgStability}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${emotionalAverages.avgStability}%` }}
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
              <BarChart size={20} className="text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Last Session Score</span>
                <span className={`font-medium ${getScoreColor(recentDebateSessions[0]?.overallScore || 50)}`}>
                  {recentDebateSessions[0]?.overallScore || 'N/A'}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${recentDebateSessions[0]?.overallScore || 50}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Recent Topics:</p>
              <div className="space-y-2">
                {recentDebateSessions.map((session) => (
                  <div key={session.id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{session.topic}</span>
                    <span className={`text-sm ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore}/100
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
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Activity Feed */}
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
                    Date: {session.date} | Score: {session.overallScore}/100
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;