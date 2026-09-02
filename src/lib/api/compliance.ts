import { getAuthHeaders } from "./auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://compli-9imp.onrender.com/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export interface ComplianceSuggestion {
  id: string;
  text: string;
  finding_id?: string;
}

export interface ComplianceFinding {
  id: string;
  finding_type: 'missing_clause' | 'weak_clause' | 'conflicting_clause' | 'policy_violation';
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  policy_requirement_id?: string;
  contract_source_chunk_id?: string;
  page_number?: number;
}

export interface ComplianceResult {
  id: string;
  document_id: string;
  policy_id: string;
  policy_version_id: string;
  status: 'pending' | 'comparing' | 'completed' | 'failed';
  compliance_score?: number;
  risk_score?: number;
  error?: string;
  created_at: string;
  completed_at?: string;
  findings: ComplianceFinding[];
  suggestions: ComplianceSuggestion[];
}

export interface UnifiedRisk {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source_type: 'document_risk' | 'compliance_gap';
  document_name: string;
  document_id: string;
  policy_name?: string;
  page_number?: number;
}

export const complianceApi = {
  triggerCheck: async (documentId: string, policyId: string): Promise<{message: string, result_id: string}> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${documentId}/compliance-check?policy_id=${policyId}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getResults: async (documentId: string): Promise<ComplianceResult[]> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${documentId}/compliance-results`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch results');
    return res.json();
  },
  getAllResults: async (): Promise<ComplianceResult[]> => {
    const res = await fetch(`${API_BASE}/api/v1/compliance-results`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch results');
    return res.json();
  },
  getResultDetail: async (resultId: string): Promise<ComplianceResult> => {
    const res = await fetch(`${API_BASE}/api/v1/compliance-results/${resultId}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch result');
    return res.json();
  },
  getRiskCenter: async (): Promise<UnifiedRisk[]> => {
    const res = await fetch(`${API_BASE}/api/v1/risk-center`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch risk center data');
    return res.json();
  }
};
