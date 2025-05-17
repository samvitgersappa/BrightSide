import React, { useState, useEffect } from 'react';
import { LineChart as ReLineChart, Line as ReLine, BarChart as ReBarChart, Bar as ReBar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend as ReLegend, ResponsiveContainer } from 'recharts';
import { Calendar, BarChart as BarChartIcon, Activity, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRecentUserSessions } from '../../services/sessionService';
import { getRecentUserDebateSessions } from '../../services/debateService';
import { realtimeService } from '../../services/realtimeService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Pie as ChartPie, Bar as ChartBar, Line as ChartLine } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

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

  // Helper: Infer mood label from moodScore
  const getMoodLabel = (score: number) => {
    if (score > 90) return 'Happy';
    if (score > 75) return 'Calm';
    if (score > 65) return 'Neutral';
    if (score > 50) return 'Anxious';
    if (score > 35) return 'Sad';
    if (score > 20) return 'Distressed';
    return 'Suicidal';
  };

  // Format date for display (update to use consistent format)
  const formatDate = (dateValue: string | Date | undefined | null) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Helper: Get color class based on score
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 35) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper: Check if jsPDF has getNumberOfPages
  const getPDFPageCount = (pdf: jsPDF) => {
    return (pdf as any).internal.getNumberOfPages() || pdf.internal.pages.length - 1;
  };

  // PDF Report Generation with improved formatting
  const handleGenerateReport = async () => {
    const reportElement = document.getElementById('analytics-report-content');
    if (!reportElement) return;

    // Create PDF with A4 size
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'pt', 
      format: 'a4',
      compress: true
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add gradient header background with modern design
    const addPageHeader = (pageNum: number) => {
      pdf.setPage(pageNum);
      // Header gradient
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 140, 'F');
      pdf.setFillColor(79, 82, 221);
      pdf.rect(0, 0, pageWidth, 100, 'F');
      
      // Logo placeholder (replace with actual logo)
      pdf.setFillColor(255, 255, 255, 0.1);
      pdf.circle(margin + 20, 50, 15, 'F');
      
      // Title & Date
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BrightSide Analytics', margin + 50, 60);
      
      // Subtitle
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Comprehensive ${timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Complete'} Report`, margin + 50, 85);
      
      // Report metadata
      pdf.setFontSize(12);
      const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated: ${timestamp}`, margin + 50, 110);
      
      // User info box
      pdf.setFillColor(255, 255, 255, 0.1);
      pdf.roundedRect(pageWidth - margin - 200, 40, 180, 70, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('Report prepared for:', pageWidth - margin - 180, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(user?.name || 'N/A', pageWidth - margin - 180, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text('User ID: ' + (user?.id || 'N/A'), pageWidth - margin - 180, 105);
    };

    // Add professional footer
    const addPageFooter = (pageNum: number, totalPages: number) => {
      pdf.setPage(pageNum);
      const footerY = pageHeight - margin;
      
      // Footer gradient
      pdf.setFillColor(247, 248, 250);
      pdf.rect(0, footerY - 40, pageWidth, 40, 'F');
      
      // Footer content
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('BrightSide Analytics Report', margin, footerY - 15);
      pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY - 15, { align: 'right' });
      
      // Footer line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 25, pageWidth - margin, footerY - 25);
    };

    // Executive Summary Section
    const addExecutiveSummary = (y: number) => {
      pdf.setFontSize(20);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin, y);
      
      y += 30;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);

      const summaryText = [
        `This report provides a comprehensive analysis of your emotional intelligence and debate performance over the ${timeRange} period.`,
        '',
        'Key Findings:',
        `• Emotional Wellbeing: ${averages.avgMood ? averages.avgMood > 70 ? 'Consistently positive emotional state' : averages.avgMood > 50 ? 'Moderately stable emotional patterns' : 'Areas identified for emotional support' : 'Insufficient data'}`,
        `• Debate Performance: ${averages.avgOverall ? averages.avgOverall > 75 ? 'Outstanding debate capabilities' : averages.avgOverall > 60 ? 'Strong debate performance' : 'Developing debate skills' : 'Insufficient data'}`,
        `• Progress Trend: ${getBestWorstSessions(eqData, 'moodScore').best && getBestWorstSessions(debateData, 'overallScore').best ? 'Showing consistent improvement' : 'More data needed for trend analysis'}`,
      ];

      summaryText.forEach((line, index) => {
        pdf.text(line, margin, y + (index * 20));
      });

      return y + (summaryText.length * 20) + 30;
    };

    // Performance Analysis Section
    const addPerformanceAnalysis = (y: number) => {
      pdf.setFontSize(20);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Performance Analysis', margin, y);
      
      y += 30;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      // EQ Analysis
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Emotional Intelligence Insights', margin, y);
      y += 20;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);

      const eqInsights = [
        `• Average Mood Score: ${averages.avgMood?.toFixed(1)}/100`,
        `• Emotional Stability: ${averages.avgStability?.toFixed(1)}/100`,
        `• Distress Management: ${averages.avgDistress ? 'Well managed' : 'Needs attention'}`,
        '',
        'Recommendations:',
        '• ' + (averages.avgMood && averages.avgMood < 70 ? 'Consider scheduling regular mood check-ins' : 'Maintain current emotional awareness practices'),
        '• ' + (averages.avgStability && averages.avgStability < 65 ? 'Focus on emotional regulation techniques' : 'Continue practicing emotional stability exercises'),
      ];

      eqInsights.forEach((line, index) => {
        pdf.text(line, margin, y + (index * 20));
      });

      y += (eqInsights.length * 20) + 30;

      // Debate Analysis
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Debate Performance Insights', margin, y);
      y += 20;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);

      const debateInsights = [
        `• Overall Performance: ${averages.avgOverall?.toFixed(1)}/100`,
        `• Knowledge Depth: ${averages.avgKnowledge?.toFixed(1)}/100`,
        `• Persuasiveness: ${averages.avgPersuasiveness?.toFixed(1)}/100`,
        '',
        'Areas of Excellence:',
        `• ${averages.avgKnowledge && averages.avgKnowledge > 75 ? 'Strong knowledge foundation' : 'Growing topic expertise'}`,
        `• ${averages.avgPersuasiveness && averages.avgPersuasiveness > 75 ? 'Effective persuasion techniques' : 'Developing argumentation skills'}`,
      ];

      debateInsights.forEach((line, index) => {
        pdf.text(line, margin, y + (index * 20));
      });

      return y + (debateInsights.length * 20) + 30;
    };

    // Start generating the report
    let currentY = 160;
    
    // Add first page header
    addPageHeader(1);
    
    // Add Executive Summary
    currentY = addExecutiveSummary(currentY);
    
    // Check if we need a new page
    if (currentY > pageHeight - 200) {
      pdf.addPage();
      addPageHeader(2);
      currentY = 160;
    }
    
    // Add Performance Analysis
    currentY = addPerformanceAnalysis(currentY);
    
    // Add charts and analytics content
    const canvas = await html2canvas(reportElement, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#fff',
      scrollY: -window.scrollY,
      windowWidth: 1200,
      onclone: (doc) => {
        const element = doc.getElementById('analytics-report-content');
        if (element) {
          element.style.height = 'auto';
          element.style.overflow = 'visible';
        }
      }
    });

    // Add visualizations page
    pdf.addPage();
    addPageHeader(pdf.getNumberOfPages());
    
    pdf.setFontSize(20);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data Visualizations', margin, 160);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', margin, 190, imgWidth, imgHeight);

    // Add recommendations page
    pdf.addPage();
    addPageHeader(pdf.getNumberOfPages());
    
    pdf.setFontSize(20);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommendations & Action Items', margin, 160);
    
    const recommendations = [
      'Emotional Intelligence:',
      `1. ${averages.avgMood && averages.avgMood < 70 ? 'Schedule regular emotional check-ins' : 'Maintain current emotional awareness practices'}`,
      `2. ${averages.avgDistress && averages.avgDistress > 40 ? 'Implement stress management techniques' : 'Continue current stress management practices'}`,
      `3. ${averages.avgStability && averages.avgStability < 65 ? 'Focus on emotional regulation exercises' : 'Share your emotional regulation success strategies'}`,
      '',
      'Debate Performance:',
      `1. ${averages.avgKnowledge && averages.avgKnowledge < 75 ? 'Expand knowledge in key debate topics' : 'Maintain strong knowledge foundation'}`,
      `2. ${averages.avgPersuasiveness && averages.avgPersuasiveness < 75 ? 'Practice persuasion techniques' : 'Share effective persuasion strategies'}`,
      `3. ${averages.avgOverall && averages.avgOverall < 70 ? 'Engage in more practice debates' : 'Consider mentoring others'}`,
      '',
      'Next Steps:',
      '1. Review this report with your mentor or coach',
      '2. Set specific goals based on the insights provided',
      '3. Schedule regular progress check-ins',
      '4. Document successful strategies and areas for improvement'
    ];

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    
    recommendations.forEach((line, index) => {
      if (line.includes(':')) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
      }
      pdf.text(line, margin, 190 + (index * 20));
    });

    // Add footer to all pages
    const pageCount = getPDFPageCount(pdf);
    for (let i = 1; i <= pageCount; i++) {
      addPageFooter(i, pageCount);
    }

    // Save the PDF
    pdf.save('brightside_analytics_report.pdf');
  };

  // --- New Analytics/Insights ---
  // Helper: Get mood distribution for Pie chart
  const getMoodDistribution = () => {
    const moodCounts: Record<string, number> = {};
    eqData.forEach(item => {
      const mood = getMoodLabel(item.moodScore);
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    return moodCounts;
  };

  // Helper: Get session counts by weekday
  const getSessionCountsByWeekday = (data: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);
    data.forEach(item => {
      const d = new Date(item.date || item.timestamp);
      counts[d.getDay()]++;
    });
    return { labels: days, data: counts };
  };

  // Helper: Get best/worst sessions
  const getBestWorstSessions = (data: any[], key: string) => {
    if (!data.length) return { best: null, worst: null };
    const sorted = [...data].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  };

  // Debate Topic Distribution Pie Chart
  const getDebateTopicDistribution = () => {
    const topicCounts: Record<string, number> = {};
    debateData.forEach(item => {
      const topic = item.topic || 'Unknown';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    return topicCounts;
  };
  const moodDist = getMoodDistribution();
  const moodPieData = {
    labels: Object.keys(moodDist),
    datasets: [
      {
        data: Object.values(moodDist),
        backgroundColor: [
          '#6366F1', '#A855F7', '#3B82F6', '#10B981', '#F59E42', '#EF4444', '#FBBF24', '#6EE7B7'
        ],
      },
    ],
  };
  const debateTopicDist = getDebateTopicDistribution();
  const debateTopicPieData = {
    labels: Object.keys(debateTopicDist),
    datasets: [
      {
        data: Object.values(debateTopicDist),
        backgroundColor: [
          '#6366F1', '#A855F7', '#3B82F6', '#10B981', '#F59E42', '#EF4444', '#FBBF24', '#6EE7B7'
        ],
      },
    ],
  };

  // EQ Sessions by Weekday Bar Chart
  const eqWeekday = getSessionCountsByWeekday(eqData);
  const eqWeekdayBarData = {
    labels: eqWeekday.labels,
    datasets: [
      {
        label: 'EQ Sessions',
        data: eqWeekday.data,
        backgroundColor: '#6366F1',
      },
    ],
  };

  // Debate Sessions by Weekday Bar Chart
  const debateWeekday = getSessionCountsByWeekday(debateData);
  const debateWeekdayBarData = {
    labels: debateWeekday.labels,
    datasets: [
      {
        label: 'Debate Sessions',
        data: debateWeekday.data,
        backgroundColor: '#A855F7',
      },
    ],
  };

  // Cumulative Mood Line Chart
  const cumulativeMoodData = {
    labels: eqData.map(item => formatDate(item.date || item.timestamp)),
    datasets: [
      {
        label: 'Mood Score',
        data: eqData.reduce((acc, item, idx) => {
          acc.push((acc[idx - 1] || 0) + (item.moodScore || 0));
          return acc;
        }, []),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99,102,241,0.2)',
        fill: true,
      },
    ],
  };

  // Best/Worst Sessions
  const bestMood = getBestWorstSessions(eqData, 'moodScore');
  const bestDebate = getBestWorstSessions(debateData, 'overallScore');

  // Helper: Robustly get a date string for any session
  const getSessionDate = (session: any) => {
    const raw = session.timestamp || session.date;
    if (!raw) return '';
    const date = new Date(raw);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your emotional health and debate performance over time</p>
        <button
          onClick={handleGenerateReport}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-semibold"
        >
          Generate Report (PDF)
        </button>
      </header>
      <div id="analytics-report-content">
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
                  <ReLineChart
                    data={filteredEQData.map(item => ({
                      ...item,
                      date: formatDate(item.date)
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <ReTooltip />
                    <ReLegend />
                    <ReLine 
                      type="monotone" 
                      dataKey="moodScore" 
                      stroke="#6366F1" 
                      name="Mood"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <ReLine 
                      type="monotone" 
                      dataKey="distressLevel" 
                      stroke="#A855F7" 
                      name="Distress Level" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <ReLine 
                      type="monotone" 
                      dataKey="stabilityScore" 
                      stroke="#3B82F6" 
                      name="Emotional Stability"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ReLineChart>
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
                          {formatDate(session.timestamp || session.date)}
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
            {/* Enhanced Debate Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
              {/* Debate Topic Distribution Pie Chart */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">Debate Topic Distribution</h3>
                <ChartPie data={debateTopicPieData} />
                <p className="mt-2 text-sm text-gray-600">
                  This chart shows the frequency of your debate topics. Focusing on a variety of topics can help broaden your skills.
                </p>
              </div>
              {/* Performance Metrics Radar (as before) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">Performance Metrics Overview</h3>
                <ChartLine
                  data={{
                    labels: ['Coherence', 'Persuasiveness', 'Knowledge', 'Articulation', 'Overall'],
                    datasets: [
                      {
                        label: 'Average',
                        data: [
                          averages.avgCoherence ?? 0,
                          averages.avgPersuasiveness ?? 0,
                          averages.avgKnowledge ?? 0,
                          averages.avgArticulation ?? 0,
                          averages.avgOverall ?? 0
                        ],
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99,102,241,0.2)',
                        fill: true,
                        tension: 0.3
                      }
                    ]
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100 } }
                  }}
                />
                <p className="mt-2 text-sm text-gray-600">
                  This chart summarizes your debate performance across key metrics. Aim for balanced growth in all areas.
                </p>
              </div>
            </div>
            {/* Debate Score Trend Line Chart with insight */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
              <h3 className="text-lg font-semibold mb-2">Debate Score Trend</h3>
              <ChartLine
                data={{
                  labels: filteredDebateData.map(getSessionDate),
                  datasets: [
                    {
                      label: 'Overall Score',
                      data: filteredDebateData.map(item => item.overallScore ?? item.performanceMetrics?.overallScore ?? 0),
                      borderColor: '#A855F7',
                      backgroundColor: 'rgba(168,85,247,0.2)',
                      fill: true,
                      tension: 0.3
                    }
                  ]
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { min: 0, max: 100 } }
                }}
              />
              <p className="mt-2 text-sm text-gray-600">
                Track your debate performance over time. Consistent improvement indicates effective learning and adaptation.
              </p>
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
                          {formatDate(session.timestamp || session.date)}
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
        
        {/* --- Additional Analytics & Insights --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          {/* Mood Distribution Pie Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-2">Mood Distribution</h3>
            <ChartPie data={moodPieData} />
          </div>
          {/* EQ Sessions by Weekday */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-2">EQ Sessions by Weekday</h3>
            <ChartBar data={eqWeekdayBarData} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          {/* Debate Sessions by Weekday */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-2">Debate Sessions by Weekday</h3>
            <ChartBar data={debateWeekdayBarData} />
          </div>
          {/* Cumulative Mood Line Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-2">Cumulative Mood Score</h3>
            <ChartLine data={cumulativeMoodData} />
          </div>
        </div>
        {/* Best/Worst Sessions Table */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 my-8">
          <h3 className="text-lg font-semibold mb-4">Best & Worst Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Best EQ Session</h4>
              {bestMood.best ? (
                <div className="text-sm">
                  <div>Date: {formatDate(bestMood.best.date || bestMood.best.timestamp)}</div>
                  <div>Mood: {bestMood.best.moodScore}/100</div>
                  <div>Distress: {bestMood.best.distressLevel}/100</div>
                  <div>Stability: {bestMood.best.stabilityScore}/100</div>
                  <div>Summary: {bestMood.best.summary}</div>
                </div>
              ) : <div className="text-gray-500">No data</div>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Best Debate Session</h4>
              {bestDebate.best ? (
                <div className="text-sm">
                  <div>Date: {formatDate(bestDebate.best.date || bestDebate.best.timestamp)}</div>
                  <div>Topic: {bestDebate.best.topic}</div>
                  <div>Overall Score: {bestDebate.best.overallScore || bestDebate.best.performanceMetrics?.overallScore}/100</div>
                  <div>Feedback: {bestDebate.best.feedback}</div>
                </div>
              ) : <div className="text-gray-500">No data</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;