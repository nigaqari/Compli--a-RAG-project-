import axios from "axios"

const API_URL = "http://localhost:8000/api/v1/dashboard"

export interface DashboardStats {
  total_documents: number
  pending_reviews: number
  open_risks: number
  high_risks: number
  medium_risks: number
  low_risks: number
  avg_compliance_score: number | null
}

export interface RiskBreakdown {
  high: number
  medium: number
  low: number
}

export interface ActivityTrend {
  date: string
  count: number
}

export interface RecentAnalysis {
  analysis_id: string
  document_id: string
  document_name: string
  completed_at: string | null
  top_risk_severity: "high" | "medium" | "low" | null
  risk_count: number
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await axios.get(`${API_URL}/stats`)
    return res.data
  },

  getRiskBreakdown: async (): Promise<RiskBreakdown> => {
    const res = await axios.get(`${API_URL}/risk-breakdown`)
    return res.data
  },

  getActivityTrend: async (): Promise<ActivityTrend[]> => {
    const res = await axios.get(`${API_URL}/activity-trend`)
    return res.data
  },

  getRecentAnalyses: async (limit: number = 5): Promise<RecentAnalysis[]> => {
    const res = await axios.get(`${API_URL}/recent-analyses`, { params: { limit } })
    return res.data
  },
}
