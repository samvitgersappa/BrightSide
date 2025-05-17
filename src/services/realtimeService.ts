import { EQSession, DebateSession } from '../types';

type DataUpdateListener = (data: any) => void;
type DataChannel = 'eq' | 'debate';

class RealtimeService {
  private ws: WebSocket | null = null;
  private listeners: Map<DataChannel, Set<DataUpdateListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.listeners.set('eq', new Set());
    this.listeners.set('debate', new Set());
  }

  connect() {
    try {
      // Using secure WebSocket for production, fallback to ws for local development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // For development environment, don't try to connect if we're in development
      if (process.env.NODE_ENV === 'development') {
        console.log('WebSocket connection skipped in development mode');
        return;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'eq_update') {
            this.notifyListeners('eq', data.session);
          } else if (data.type === 'debate_update') {
            this.notifyListeners('debate', data.session);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, 1000 * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  subscribe(channel: DataChannel, listener: DataUpdateListener) {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.add(listener);
    }

    // If this is the first listener, establish connection
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      if (channelListeners) {
        channelListeners.delete(listener);
      }
    };
  }

  private notifyListeners(channel: DataChannel, data: any) {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(listener => listener(data));
    }
  }

  // Method to simulate real-time updates for development/testing
  simulateUpdate(channel: DataChannel, data: any) {
    this.notifyListeners(channel, data);
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();
