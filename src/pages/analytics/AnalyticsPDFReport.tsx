import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define types for props
interface User {
  id: string;
  name: string;
}
interface EQSession {
  date?: string;
  timestamp?: string;
  moodScore: number;
  distressLevel: number;
  stabilityScore: number;
}
interface DebateSession {
  date?: string;
  timestamp?: string;
  topic: string;
  overallScore?: number;
  knowledgeDepth?: number;
  persuasiveness?: number;
  performanceMetrics?: {
    overallScore?: number;
    knowledgeDepth?: number;
    persuasiveness?: number;
  };
}
interface QuizSession {
  timestamp: string;
  subject: string;
  questionsCorrect: number;
  questionsTotal: number;
  eqQuestionsCorrect: number;
  eqQuestionsTotal: number;
}
interface Averages {
  avgMood: number;
  avgDistress: number;
  avgStability: number;
  avgOverall: number;
  avgKnowledge: number;
  avgPersuasiveness: number;
  avgCoherence: number;
  avgArticulation: number;
}
interface AnalyticsPDFReportProps {
  user: User;
  eqData: EQSession[];
  debateData: DebateSession[];
  quizData: QuizSession[];
  averages: Averages;
  timeRange: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#3730a3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 4,
  },
  label: {
    fontWeight: 700,
    color: '#6366f1',
  },
  value: {
    fontWeight: 400,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  table: {
    width: 'auto',
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 4,
    borderBottom: '1px solid #e5e7eb',
  },
});

// Props: pass all analytics data needed for the report
const AnalyticsPDFReport: React.FC<AnalyticsPDFReportProps> = ({ user, eqData, debateData, quizData, averages, timeRange }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.section}>
        <Text style={styles.title}>BrightSide Analytics Report</Text>
        <Text style={styles.subtitle}>Personal Growth & Development Insights</Text>
        <Text style={{ color: '#64748b', marginBottom: 2 }}>User: {user?.name || 'N/A'} | User ID: {user?.id || 'N/A'}</Text>
        <Text style={{ color: '#64748b', marginBottom: 2 }}>Report Date: {new Date().toLocaleDateString()}</Text>
        <Text style={{ color: '#6366f1', fontSize: 10 }}>Time Range: {timeRange}</Text>
      </View>

      {/* Executive Summary */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Executive Summary</Text>
        <View style={styles.card}>
          <Text>• Emotional Wellbeing: {averages.avgMood > 70 ? 'Consistently positive' : averages.avgMood > 50 ? 'Moderately stable' : 'Needs support'}</Text>
          <Text>• Debate Performance: {averages.avgOverall > 75 ? 'Outstanding' : averages.avgOverall > 60 ? 'Strong' : 'Developing'}</Text>
          <Text>• Progress Trend: {(eqData.length > 1 || debateData.length > 1) ? 'Showing improvement' : 'More data needed'}</Text>
        </View>
      </View>

      {/* EQ Metrics */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Emotional Intelligence Metrics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Average Mood:</Text>
          <Text style={styles.value}>{averages.avgMood}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Distress Level:</Text>
          <Text style={styles.value}>{averages.avgDistress}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stability:</Text>
          <Text style={styles.value}>{averages.avgStability}/100</Text>
        </View>
      </View>

      {/* Debate Metrics */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Debate Performance Metrics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Overall:</Text>
          <Text style={styles.value}>{averages.avgOverall}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Knowledge:</Text>
          <Text style={styles.value}>{averages.avgKnowledge}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Persuasiveness:</Text>
          <Text style={styles.value}>{averages.avgPersuasiveness}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Coherence:</Text>
          <Text style={styles.value}>{averages.avgCoherence}/100</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Articulation:</Text>
          <Text style={styles.value}>{averages.avgArticulation}/100</Text>
        </View>
      </View>

      {/* Recent EQ Sessions Table */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Recent EQ Sessions</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Mood</Text>
            <Text style={styles.tableCell}>Distress</Text>
            <Text style={styles.tableCell}>Stability</Text>
          </View>
          {eqData.slice(-5).map((session: EQSession, idx: number) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{session.date || session.timestamp}</Text>
              <Text style={styles.tableCell}>{session.moodScore}</Text>
              <Text style={styles.tableCell}>{session.distressLevel}</Text>
              <Text style={styles.tableCell}>{session.stabilityScore}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Debate Sessions Table */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Recent Debate Sessions</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Topic</Text>
            <Text style={styles.tableCell}>Overall</Text>
            <Text style={styles.tableCell}>Knowledge</Text>
            <Text style={styles.tableCell}>Persuasiveness</Text>
          </View>
          {debateData.slice(-5).map((session: DebateSession, idx: number) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{session.date || session.timestamp}</Text>
              <Text style={styles.tableCell}>{session.topic}</Text>
              <Text style={styles.tableCell}>{session.overallScore || session.performanceMetrics?.overallScore}</Text>
              <Text style={styles.tableCell}>{session.knowledgeDepth || session.performanceMetrics?.knowledgeDepth}</Text>
              <Text style={styles.tableCell}>{session.persuasiveness || session.performanceMetrics?.persuasiveness}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quiz Analytics Table */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Quiz Performance (Recent)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Subject</Text>
            <Text style={styles.tableCell}>Score</Text>
            <Text style={styles.tableCell}>EQ Score</Text>
          </View>
          {quizData.slice(-5).map((session: QuizSession, idx: number) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tableCell}>{session.timestamp}</Text>
              <Text style={styles.tableCell}>{session.subject}</Text>
              <Text style={styles.tableCell}>{Math.round((session.questionsCorrect / session.questionsTotal) * 100)}%</Text>
              <Text style={styles.tableCell}>{Math.round((session.eqQuestionsCorrect / session.eqQuestionsTotal) * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={{ marginTop: 32, textAlign: 'center' }}>
        <Text style={{ color: '#6366f1', fontSize: 10 }}>BrightSide Analytics • Empowering Personal Growth</Text>
      </View>
    </Page>
  </Document>
);

export default AnalyticsPDFReport;
