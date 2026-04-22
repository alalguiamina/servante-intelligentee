import { useState, useCallback, useRef } from 'react';
import { chatbotService, Source, ChatMetadata } from '../services/chatbotService';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  metadata?: ChatMetadata;
  timestamp: Date;
  isError?: boolean;
  isStreaming?: boolean;
}

export type OnlineStatus = 'checking' | 'online' | 'offline';

// ============================================
// HOOK
// ============================================

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, []);

  const checkHealth = useCallback(async () => {
    setOnlineStatus('checking');
    try {
      const health = await chatbotService.healthCheck();
      setOnlineStatus(health.rag?.status === 'ready' ? 'online' : 'offline');
    } catch {
      setOnlineStatus('offline');
    }
  }, []);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      scrollToBottom();

      // Add an empty assistant message immediately — will be filled via streaming
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        await chatbotService.chatStream(
          query.trim(),

          // onToken — append each token to the message in real-time
          (token: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
            scrollToBottom();
          },

          // onDone — finalise with sources & metadata
          (result) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: result.answer,
                      sources: result.sources?.length ? result.sources : undefined,
                      metadata: result.metadata,
                      isStreaming: false,
                    }
                  : m
              )
            );
            setIsLoading(false);
            scrollToBottom();
          },

          // onError
          (err: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: `Erreur : ${err}. Vérifiez que le serveur, ChromaDB et Ollama sont démarrés.`,
                      isError: true,
                      isStreaming: false,
                    }
                  : m
              )
            );
            setIsLoading(false);
          }
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    'Service indisponible. Vérifiez que le serveur backend est démarré.',
                  isError: true,
                  isStreaming: false,
                }
              : m
          )
        );
        setIsLoading(false);
      } finally {
        // Garantit que isStreaming est toujours désactivé même si onDone n'arrive pas
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
        setIsLoading(false);
      }
    },
    [isLoading, scrollToBottom]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    onlineStatus,
    messagesEndRef,
    sendMessage,
    clearMessages,
    checkHealth,
  };
}
