import { getAuthHeaders } from "./auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  document_type: 'contract' | 'policy' | 'nda' | 'sla';
  status?: string;
  compliance_score?: number | null;
  owner_id: string;
  uploaded_at: string;
  updated_at: string;
}

export const documentsApi = {
  getDocuments: async (): Promise<DocumentItem[]> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },
  getDocument: async (id: string): Promise<DocumentItem> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },
  getStatus: async (id: string): Promise<{ processing_status: string; processing_error?: string; page_count?: number; chunk_count?: number }> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}/status`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch document status');
    return res.json();
  },
  reprocess: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}/reprocess`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to reprocess document');
  },
  deleteDocument: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },
  uploadDocument: async (file: File, documentType: string = 'contract'): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    const res = await fetch(`${API_BASE}/api/v1/documents/`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  }
};
