import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart as BarChartIcon, Activity, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for the analytics
const mockEQData = [
  { date: '2025-04-01', moodScore: 65, distressLevel: 40, stabilityScore: 70 },
  { date: '2025-04-08', moodScore: 70, distressLevel: 35, stabilityScore: 75 },
  { date: '2025-04-15', moodScore: 60, distressLevel: 50, stabilityScore: 65 },
  { date: '2025-04-22', moodScore: 72, distressLevel: 30, stabilityScore: 80 },
  { date: '2025-04-29', moodScore: 75, distressLevel: 25, stabilityScore: 82 },
  { date: '2025-05-05', moodScore: 90, distressLevel: 15, stabilityScore: 85 },
  { date: '2025-05-10', moodScore: 65, distressLevel: 45, stabilityScore: 60 },
  { date: '2025-05-15', moodScore: 85, distressLevel: 20, stabilityScore: 75 },
];

const mockDebateData = [
  { date: '2025-04-02', topic: 'AI Ethics', coherence: 75, persuasiveness: 70, knowledgeDepth: 65, articulation: 80, overallScore: 72 },
  { date: '2025-04-10', topic: 'Clean Energy', coherence: 70, persuasiveness: 75, knowledgeDepth: 72, articulation: 78, overallScore: 74 },
  { date: '2025-04-18', topic: 'Robotics', coherence: 80, persuasiveness: 78, knowledgeDepth: 82, articulation: 75, overallScore: 79 },
  { date: '2025-04-25', topic: 'Bioengineering', coherence: 78, persuasiveness: 80, knowledgeDepth: 85, articulation: 79, overallScore: 80 },
  { date: '2025-05-02', topic: 'Quantum Computing', coherence: 85, persuasiveness: 82, knowledgeDepth: 88, articulation: 84, overallScore: 85 },
  { date: '2025-05-08', topic: 'Renewable Energy', coherence: 74, persuasiveness: 76, knowledgeDepth: 78, articulation: 75, overallScore: 76 },
  { date: '2025-05-14', topic: 'AI Ethics', coherence: 82, persuasiveness: 80, knowledgeDepth: 85, articulation: 81, overallScore: 82 },
];

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'eq' | 'debate'>('eq');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  
  // Filter data based on selected time range
  const filterDataByTimeRange = (data: any[]) => {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * msPerDay);
      return data.filter(item => new Date(item.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * msPerDay);
      return data.filter(item => new Date(item.date) >= monthAgo);
    }
    
    return data;
  };
  
  const filteredEQData = filterDataByTimeRange(mockEQData);
  const filteredDebateData = filterDataByTimeRange(mockDebateData);
  
  // Calculate average scores
  const calculateAverages = () => {
    if (activeTab === 'eq') {
      const data = filteredEQData;
      return {
        avgMood: Math.round(data.reduce((sum, item) => sum + item.moodScore, 0) / data.length),
        avgDistress: Math.round(data.reduce((sum, item) => sum + item.distressLevel, 0) / data.length),
        avgStability: Math.round(data.reduce((sum, item) => sum + item.stabilityScore, 0) / data.length)
      };
    } else {
      const data = filteredDebateData;
      return {
        avgCoherence: Math.round(data.reduce((sum, item) => sum + item.coherence, 0) / data.length),
        avgPersuasiveness: Math.round(data.reduce((sum, item) => sum + item.persuasiveness, 0) / data.length),
        avgKnowledge: Math.round(data.reduce((sum, item) => sum + item.knowledgeDepth, 0) / data.length),
        avgArticulation: Math.round(data.reduce((sum, item) => sum + item.articulation, 0) / data.length),
        avgOverall: Math.round(data.reduce((sum, item) => sum + item.overallScore, 0) / data.length),
      };
    }
  };
  
  const averages = calculateAverages();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgMood)}`}>
                  {averages.avgMood}/100
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
                <span className={`text-lg font-semibold ${getScoreColor(100 - averages.avgDistress)}`}>
                  {averages.avgDistress}/100
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
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgStability)}`}>
                  {averages.avgStability}/100
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
                  {filteredEQData.map((session, index) => (
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
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgOverall)}`}>
                  {averages.avgOverall}/100
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
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgKnowledge)}`}>
                  {averages.avgKnowledge}/100
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
                <span className={`text-lg font-semibold ${getScoreColor(averages.avgPersuasiveness)}`}>
                  {averages.avgPersuasiveness}/100
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