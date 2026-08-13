import axios from "axios";
import { getAuthHeaders } from "./auth";

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
const API_URL = `${API_BASE}/api/v1/chat`;

export interface Citation {
  document_id: string;
  document_name: string;
  page_number: number;
  excerpt_snippet: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export interface Conversation {
  id: string;
  title: string;
  document_scope_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversation_id: string;
  message_id: string;
}

export const chatApi = {
  listConversations: async (): Promise<Conversation[]> => {
    const res = await axios.get(`${API_URL}/conversations`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  createConversation: async (title?: string, document_scope_id?: string): Promise<Conversation> => {
    const res = await axios.post(`${API_URL}/conversations`, { title, document_scope_id }, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  sendMessage: async (conversationId: string, question: string, document_scope_id?: string): Promise<ChatResponse> => {
    const res = await axios.post(`${API_URL}/conversations/${conversationId}/messages`, {
      question,
      document_scope_id
    }, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  renameConversation: async (conversationId: string, title: string): Promise<Conversation> => {
    const res = await axios.patch(`${API_URL}/conversations/${conversationId}`, { title }, {
      headers: { ...getAuthHeaders() }
    });
    return res.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await axios.delete(`${API_URL}/conversations/${conversationId}`, {
      headers: { ...getAuthHeaders() }
    });
  }
};
