import { getAuthHeaders } from "./auth";

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export interface PolicyRequirement {
  id: string;
  category: string;
  requirement_text: string;
  mandatory: boolean;
  source_chunk_id?: string;
  page_number?: number;
}

export interface PolicyVersion {
  id: string;
  version_number: number;
  uploaded_by: string;
  change_note?: string;
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  requirements: PolicyRequirement[];
}

export interface Policy {
  id: string;
  name: string;
  category: string;
  owner_id: string;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export const policiesApi = {
  getPolicies: async (): Promise<Policy[]> => {
    const res = await fetch(`${API_BASE}/api/v1/policies`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },
  createPolicy: async (file: File, name: string, category: string): Promise<Policy> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    const res = await fetch(`${API_BASE}/api/v1/policies/`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create policy');
    }
    return res.json();
  },
  getPolicy: async (policyId: string): Promise<Policy> => {
    const res = await fetch(`${API_BASE}/api/v1/policies/${policyId}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch policy');
    return res.json();
  },
  getPolicyVersions: async (policyId: string): Promise<PolicyVersion[]> => {
    const res = await fetch(`${API_BASE}/api/v1/policies/${policyId}/versions`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },
  uploadNewVersion: async (policyId: string, file: File, changeNote: string): Promise<PolicyVersion> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('change_note', changeNote);
    const res = await fetch(`${API_BASE}/api/v1/policies/${policyId}/versions`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload new version');
    return res.json();
  }
};
