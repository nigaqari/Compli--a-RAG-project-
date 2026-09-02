import { getAuthHeaders } from "./auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://compli-9imp.onrender.com/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export type ReportType = 'executive_summary' | 'compliance' | 'risk_assessment' | 'complete_analysis';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ReportItem {
  id: string;
  document_id: string;
  document_name?: string;
  generated_by: string;
  report_type: ReportType;
  status: ReportStatus;
  file_path?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export const reportsApi = {
  getReports: async (): Promise<ReportItem[]> => {
    const res = await fetch(`${API_BASE}/api/v1/reports/`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  getReport: async (id: string): Promise<ReportItem> => {
    const res = await fetch(`${API_BASE}/api/v1/reports/${id}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },

  createReport: async (documentId: string, reportType: ReportType): Promise<ReportItem> => {
    const res = await fetch(`${API_BASE}/api/v1/reports/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ document_id: documentId, report_type: reportType })
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  getStatus: async (id: string): Promise<{ id: string; status: ReportStatus; error?: string }> => {
    const res = await fetch(`${API_BASE}/api/v1/reports/${id}/status`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch report status');
    return res.json();
  },

  deleteReport: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/v1/reports/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete report');
  }
};
