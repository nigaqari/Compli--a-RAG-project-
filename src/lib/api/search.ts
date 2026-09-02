import { getAuthHeaders } from "./auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://compli-9imp.onrender.com/api/v1').replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  type: 'document' | 'policy' | 'risk' | 'clause' | 'report';
  severity?: string;
  url: string;
}

export interface GlobalSearchResults {
  documents: SearchResultItem[];
  policies: SearchResultItem[];
  risks: SearchResultItem[];
  clauses: SearchResultItem[];
  reports: SearchResultItem[];
}

export const searchApi = {
  search: async (query: string, limit: number = 5): Promise<GlobalSearchResults> => {
    if (!query.trim()) {
      return { documents: [], policies: [], risks: [], clauses: [], reports: [] };
    }
    const res = await fetch(`${API_BASE}/api/v1/search/?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  }
};
