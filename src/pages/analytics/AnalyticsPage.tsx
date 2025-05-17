import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart as BarChartIcon, Activity, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRecentUserSessions } from '../../services/sessionService';
import { getRecentUserDebateSessions } from '../../services/debateService';
import { realtimeService } from '../../services/realtimeService';

// Removed mock data

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'eq' | 'debate'>('eq');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [eqData, setEQData] = useState<any[]>([]);
  const [debateData, setDebateData] = useState<any[]>([]);

  // Fetch initial data and subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    // Initial fetch
    setEQData(getRecentUserSessions(user.id, 365));
    setDebateData(getRecentUserDebateSessions(user.id, 365));

    // Real-time listeners
    const unsubEQ = realtimeService.subscribe('eq', (session: any) => {
      if (session.userId === user.id) {
        setEQData(prev => [...prev, session]);
      }
    });
    const unsubDebate = realtimeService.subscribe('debate', (session: any) => {
      if (session.userId === user.id) {
        setDebateData(prev => [...prev, session]);
      }
    });
    return () => {
      unsubEQ && unsubEQ();
      unsubDebate && unsubDebate();
    };
  }, [user]);

  // Filter data based on selected time range
  const filterDataByTimeRange = (data: any[]) => {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * msPerDay);
      return data.filter(item => new Date(item.timestamp || item.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * msPerDay);
      return data.filter(item => new Date(item.timestamp || item.date) >= monthAgo);
    }
    return data;
  };

  const filteredEQData = filterDataByTimeRange(eqData);
  const filteredDebateData = filterDataByTimeRange(debateData);

  // Calculate average scores
  const calculateAverages = () => {
    if (activeTab === 'eq') {
      const data = filteredEQData;
      if (!data.length) return { avgMood: 0, avgDistress: 0, avgStability: 0 };
      return {
        avgMood: Math.round(data.reduce((sum, item) => sum + item.moodScore, 0) / data.length),
        avgDistress: Math.round(data.reduce((sum, item) => sum + item.distressLevel, 0) / data.length),
        avgStability: Math.round(data.reduce((sum, item) => sum + item.stabilityScore, 0) / data.length)
      };
    } else {
      const data = filteredDebateData;
      if (!data.length) return { avgCoherence: 0, avgPersuasiveness: 0, avgKnowledge: 0, avgArticulation: 0, avgOverall: 0 };
      return {
        avgCoherence: Math.round(data.reduce((sum, item) => sum + (item.performanceMetrics?.coherence ?? item.coherence ?? 0), 0) / data.length),
        avgPersuasiveness: Math.round(data.reduce((sum, item) => sum + (item.performanceMetrics?.persuasiveness ?? item.persuasiveness ?? 0), 0) / data.length),
        avgKnowledge: Math.round(data.reduce((sum, item) => sum + (item.performanceMetrics?.knowledgeDepth ?? item.knowledgeDepth ?? 0), 0) / data.length),
        avgArticulation: Math.round(data.reduce((sum, item) => sum + (item.performanceMetrics?.articulation ?? item.articulation ?? 0), 0) / data.length),
        avgOverall: Math.round(data.reduce((sum, item) => sum + (item.performanceMetrics?.overallScore ?? item.overallScore ?? 0), 0) / data.length),
      };
    }
  };

  const averages = calculateAverages();

  // Format date for display
  const formatDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper for score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-emerald-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your emotional health and debate performance over time</p>
      </header>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('eq')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'eq'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Emotional Intelligence
          </span>
        </button>
        <button
          onClick={() => setActiveTab('debate')}
          className={`ml-6 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'debate'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Debate Performance
          </span>
        </button>
      </div>
      
      {/* Time range selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === 'week'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === 'month'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === 'all'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      {activeTab === 'eq' ? (
        <>
          {/* EQ Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Average Mood</h3>
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgMood ?? 0)}`}>
                  {averages.avgMood ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${averages.avgMood}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Average Distress</h3>
                <span className={`text-lg font-semibold ${getScoreColor(100 - (averages.avgDistress ?? 0))}`}>
                  {averages.avgDistress ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${averages.avgDistress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Emotional Stability</h3>
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgStability ?? 0)}`}>
                  {averages.avgStability ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${averages.avgStability}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* EQ Line Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Emotional Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredEQData.map(item => ({
                    ...item,
                    date: formatDate(item.date)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="moodScore" 
                    stroke="#6366F1" 
                    name="Mood"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="distressLevel" 
                    stroke="#A855F7" 
                    name="Distress Level" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stabilityScore" 
                    stroke="#3B82F6" 
                    name="Emotional Stability"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent EQ Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent EQ Sessions</h2>
              <BarChartIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stability</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Sent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEQData.map((session) => (
                    <tr key={session.date}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(session.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(session.moodScore)}`}>
                          {session.moodScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(100 - session.distressLevel)}`}>
                          {session.distressLevel}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(session.stabilityScore)}`}>
                          {session.stabilityScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {session.distressLevel > 70 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Debate Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Overall Score</h3>
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgOverall ?? 0)}`}>
                  {averages.avgOverall ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${averages.avgOverall}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Knowledge Depth</h3>
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgKnowledge ?? 0)}`}>
                  {averages.avgKnowledge ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${averages.avgKnowledge}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Persuasiveness</h3>
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgPersuasiveness ?? 0)}`}>
                  {averages.avgPersuasiveness ?? 0}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${averages.avgPersuasiveness}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Debate Bar Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Debate Performance by Topic</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredDebateData.map(item => ({
                    ...item,
                    date: formatDate(item.date)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="coherence" name="Coherence" fill="#6366F1" />
                  <Bar dataKey="persuasiveness" name="Persuasiveness" fill="#3B82F6" />
                  <Bar dataKey="knowledgeDepth" name="Knowledge" fill="#A855F7" />
                  <Bar dataKey="articulation" name="Articulation" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent Debate Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recent Debate Sessions</h2>
              <BarChartIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persuasiveness</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDebateData.map((session) => (
                    <tr key={session.date}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(session.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                        {session.topic}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(session.knowledgeDepth)}`}>
                          {session.knowledgeDepth}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(session.persuasiveness)}`}>
                          {session.persuasiveness}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;