import axios from "axios";
import { getAuthHeaders } from "./auth";

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
const API_URL = `${API_BASE}/api/v1/dashboard`;

export interface DashboardStats {
  total_documents: number;
  pending_reviews: number;
  open_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  avg_compliance_score: number | null;
}

export interface RiskBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

export interface RecentAnalysis {
  analysis_id: string;
  document_id: string;
  document_name: string;
  completed_at: string | null;
  top_risk_severity: "high" | "medium" | "low" | null;
  risk_count: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await axios.get(`${API_URL}/stats`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getRiskBreakdown: async (): Promise<RiskBreakdown> => {
    const res = await axios.get(`${API_URL}/risk-breakdown`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getActivityTrend: async (): Promise<ActivityTrend[]> => {
    const res = await axios.get(`${API_URL}/activity-trend`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getRecentAnalyses: async (limit: number = 5): Promise<RecentAnalysis[]> => {
    const res = await axios.get(`${API_URL}/recent-analyses`, {
      params: { limit },
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },
};
