import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = `${API_BASE_URL}/chatbot`;

const chatbotApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

chatbotApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================
// TYPES
// ============================================

export interface Source {
  id: string;
  content: string;
  metadata: {
    title?: string;
    category?: string;
    filename?: string;
    [key: string]: unknown;
  };
  relevanceScore: number;
}

export interface ChatMetadata {
  model: string;
  processingTime: number;
  chunksUsed: number;
  query?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Source[];
  metadata: ChatMetadata;
  error?: string;
}

export interface HealthStatus {
  success: boolean;
  chromadb: { status: string; collection: string; mode?: string };
  ollama: { status: string; models: string[]; error?: string };
  rag: { status: string };
}

export interface DocumentItem {
  id: string;
  content?: string;
  metadata: {
    title?: string;
    category?: string;
    filename?: string;
    size?: number;
    [key: string]: unknown;
  };
}

export interface StatsResponse {
  success: boolean;
  stats: {
    totalDocuments: number;
    collectionName: string;
  };
}

// ============================================
// API CALLS
// ============================================

export const chatbotService = {
  chat: async (query: string): Promise<ChatResponse> => {
    const response = await chatbotApi.post('/chat', { query });
    return response.data;
  },

  /**
   * Streaming chat — calls the SSE endpoint and forwards tokens in real-time
   */
  chatStream: async (
    query: string,
    onToken: (token: string) => void,
    onDone: (result: ChatResponse) => void,
    onError: (err: string) => void
  ): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok || !response.body) {
      onError(`Server error: ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      // SSE lines start with "data: "
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === 'token') onToken(data.content);
          else if (data.type === 'done') onDone(data as ChatResponse);
          else if (data.type === 'error') onError(data.error);
        } catch {
          // skip malformed line
        }
      }
    }
  },

  healthCheck: async (): Promise<HealthStatus> => {
    const response = await chatbotApi.get('/health');
    return response.data;
  },

  uploadDocument: async (
    file: File,
    title?: string,
    category?: string,
    tags?: string
  ) => {
    const formData = new FormData();
    formData.append('document', file);
    if (title) formData.append('title', title);
    if (category) formData.append('category', category);
    if (tags) formData.append('tags', tags);

    const response = await chatbotApi.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listDocuments: async (): Promise<{ success: boolean; count: number; documents: DocumentItem[] }> => {
    const response = await chatbotApi.get('/admin/documents');
    return response.data;
  },

  deleteDocument: async (id: string) => {
    const response = await chatbotApi.delete(`/admin/documents/${id}`);
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await chatbotApi.get('/admin/stats');
    return response.data;
  },
};
