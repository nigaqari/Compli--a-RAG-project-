import axios from "axios";
import { getAuthHeaders } from "./auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://compli-9imp.onrender.com/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '');
const API_URL = `${API_BASE}/api/v1/analysis`;

export interface ClauseOut {
  id: string;
  category: string;
  found: boolean;
  summary_text: string | null;
  source_chunk_id: string | null;
  page_number: number | null;
}

export interface RiskOut {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  rationale: string;
  source_chunk_id: string | null;
  page_number: number | null;
}

export interface RecommendationOut {
  id: string;
  text: string;
  related_risk_id: string | null;
}

export interface AnalysisOut {
  id: string;
  document_id: string;
  status: "pending" | "analyzing" | "completed" | "failed";
  executive_summary: string | null;
  key_parties: { name: string; role: string }[] | null;
  compliance_score: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  clauses: ClauseOut[];
  risks: RiskOut[];
  recommendations: RecommendationOut[];
}

export interface AnalysisStatus {
  status: "none" | "pending" | "analyzing" | "completed" | "failed";
  analysis_id: string | null;
  error: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export const analysisApi = {
  triggerAnalysis: async (documentId: string): Promise<{ analysis_id: string; status: string }> => {
    const res = await axios.post(`${API_URL}/documents/${documentId}/analyze`, {}, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getAnalysisStatus: async (documentId: string): Promise<AnalysisStatus> => {
    const res = await axios.get(`${API_URL}/documents/${documentId}/analysis/status`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getLatestAnalysis: async (documentId: string): Promise<AnalysisOut> => {
    const res = await axios.get(`${API_URL}/documents/${documentId}/analysis`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getAnalysisById: async (analysisId: string): Promise<AnalysisOut> => {
    const res = await axios.get(`${API_URL}/analysis/${analysisId}`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },
};
