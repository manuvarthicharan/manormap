import { AgentMessage, Property } from '../types';

export interface AgentSessionState {
  sessionId: string;
  messages: AgentMessage[];
  lastQueriedLocality?: string;
  previousLocality?: string;
  recentPropertyIds: string[];
  activeRequirements: {
    bhk?: number;
    maxPrice?: number;
    locality?: string;
    category?: string;
    type?: 'sale' | 'rent';
  };
  lastSelectedProperty?: Property;
}

const STORAGE_KEY = 'manormap_agent_session_v1';

class AgentMemoryService {
  private session: AgentSessionState;

  constructor() {
    this.session = this.loadSession();
  }

  private loadSession(): AgentSessionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load agent session from localStorage', e);
    }
    return {
      sessionId: `session-${Date.now()}`,
      messages: [
        {
          id: 'welcome',
          sender: 'agent',
          content:
            'Hello! I am **your AI Real Estate Consultant**, your autonomous real estate research and geospatial advisory agent.\n\nI can directly navigate and operate the interactive Google Map, investigate neighborhoods, analyze property flood risks, and calculate investment yields. What would you like to explore?',
          timestamp: 'Just now'
        }
      ],
      recentPropertyIds: [],
      activeRequirements: {}
    };
  }

  private saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } catch (e) {
      console.warn('Failed to save agent session', e);
    }
  }

  public getSession(): AgentSessionState {
    return this.session;
  }

  public addMessage(msg: AgentMessage) {
    this.session.messages.push(msg);
    // Limit stored messages to avoid quota overflows
    if (this.session.messages.length > 50) {
      this.session.messages = this.session.messages.slice(-35);
    }
    this.saveSession();
  }

  public updateLastLocality(locality: string) {
    if (this.session.lastQueriedLocality && this.session.lastQueriedLocality !== locality) {
      this.session.previousLocality = this.session.lastQueriedLocality;
    }
    this.session.lastQueriedLocality = locality;
    this.saveSession();
  }

  public recordPropertyInspection(propertyId: string) {
    if (!this.session.recentPropertyIds.includes(propertyId)) {
      this.session.recentPropertyIds.unshift(propertyId);
      if (this.session.recentPropertyIds.length > 10) {
        this.session.recentPropertyIds.pop();
      }
      this.saveSession();
    }
  }

  public updateRequirements(reqs: Partial<AgentSessionState['activeRequirements']>) {
    this.session.activeRequirements = { ...this.session.activeRequirements, ...reqs };
    this.saveSession();
  }

  public clearHistory() {
    this.session = {
      sessionId: `session-${Date.now()}`,
      messages: [
        {
          id: 'welcome-reset',
          sender: 'agent',
          content: 'Session reset. I am ready to research locations or properties for you.',
          timestamp: 'Just now'
        }
      ],
      recentPropertyIds: [],
      activeRequirements: {}
    };
    this.saveSession();
  }
}

export const agentMemoryService = new AgentMemoryService();

