import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  MessageCircle,
  X,
  RotateCcw,
  Bot,
  WifiOff,
  Minimize2,
  Maximize2,
  Upload,
  Trash2,
  FileText,
  BarChart2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatbot } from '../../hooks/useChatbot';
import { chatbotService, DocumentItem } from '../../services/chatbotService';

// ============================================
// WELCOME MESSAGE
// ============================================

const WELCOME_CONTENT =
  'Bonjour ! Je suis l\'assistant IA de la Servante Intelligente.\n\nJe peux vous aider avec :\n• Emprunter et retourner des outils\n• Trouver des outils disponibles\n• Naviguer dans la plateforme\n• Toutes vos questions sur le système\n\nComment puis-je vous aider ?';

// ============================================
// STATUS BADGE
// ============================================

const StatusBadge: React.FC<{ status: 'checking' | 'online' | 'offline' }> = ({ status }) => {
  const dot =
    status === 'checking'
      ? 'bg-yellow-400 animate-pulse'
      : status === 'online'
      ? 'bg-green-400'
      : 'bg-red-400';
  const label =
    status === 'checking'
      ? 'Connexion…'
      : status === 'online'
      ? 'En ligne · RAG actif'
      : 'Hors ligne';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
};

// ============================================
// ADMIN DOCS PANEL
// ============================================

const AdminDocsPanel: React.FC = () => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [stats, setStats] = useState<{ totalDocuments: number; collectionName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        chatbotService.listDocuments(),
        chatbotService.getStats(),
      ]);
      setDocs(docsRes.documents || []);
      setStats(statsRes.stats || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    try {
      const res = await chatbotService.uploadDocument(file, file.name, 'general');
      if (res.success) {
        setUploadStatus('success');
        setUploadMessage(`"${file.name}" indexé avec succès`);
        await loadData();
      } else {
        throw new Error(res.error || 'Erreur upload');
      }
    } catch (err: unknown) {
      setUploadStatus('error');
      setUploadMessage(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadStatus('idle'), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await chatbotService.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (stats) setStats({ ...stats, totalDocuments: stats.totalDocuments - 1 });
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Stats bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600">Documents indexés :</span>
          <span className="font-bold text-slate-800">
            {loading ? '…' : stats?.totalDocuments ?? 0}
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Upload…' : 'Ajouter'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload feedback */}
      {uploadStatus !== 'idle' && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b ${
            uploadStatus === 'success'
              ? 'bg-green-50 text-green-800 border-green-100'
              : 'bg-red-50 text-red-800 border-red-100'
          }`}
        >
          {uploadStatus === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {uploadMessage}
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading && docs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
            <FileText className="w-8 h-8 opacity-40" />
            <p>Aucun document indexé</p>
            <p className="text-xs">Uploadez un fichier .txt, .md ou .pdf</p>
          </div>
        ) : (
          docs.map((doc) => {
            const title =
              String(doc.metadata?.title || doc.metadata?.filename || doc.id);
            const category = doc.metadata?.category
              ? String(doc.metadata.category)
              : null;
            const size = doc.metadata?.size
              ? `${Math.round(Number(doc.metadata.size) / 1024)} KB`
              : null;
            const isExpanded = expandedDoc === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {category && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {category}
                        </span>
                      )}
                      {size && <span className="text-xs text-slate-400">{size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.content && (
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deletingId === doc.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {isExpanded && doc.content && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-50">
                    <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed">
                      {doc.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN WIDGET
// ============================================

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');
  const [hasUnread, setHasUnread] = useState(false);

  const {
    messages,
    isLoading,
    onlineStatus,
    messagesEndRef,
    sendMessage,
    clearMessages,
    checkHealth,
  } = useChatbot();

  // Detect admin from localStorage
  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUser?.role === 'admin';

  // Get language from localStorage or default to 'fr'
  const language = (() => {
    try {
      return localStorage.getItem('i18nextLng') || 'fr';
    } catch {
      return 'fr';
    }
  })();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check health on first open
  useEffect(() => {
    if (isOpen) {
      checkHealth();
      setHasUnread(false);
    }
  }, [isOpen, checkHealth]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollContainerRef.current && activeTab === 'chat') {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    // Show unread badge when closed
    if (!isOpen && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') setHasUnread(true);
    }
  }, [messages, isOpen, activeTab]);

  const allMessages = [
    {
      id: 'welcome',
      role: 'assistant' as const,
      content: WELCOME_CONTENT,
      timestamp: new Date(0),
    },
    ...messages,
  ];

  // ----------------------------------------
  // PORTAL CONTENT
  // ----------------------------------------

  const widget = (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{
            width: '460px',
            height: isMinimized ? 'auto' : '680px',
            animation: 'chatbotSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0f2b56 0%, #1a3d6e 50%, #1e4d8c 100%)',
            }}
          >
            {/* Avatar + title */}
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm leading-tight">
                Servante Assistant
              </h3>
              {!isMinimized && <StatusBadge status={onlineStatus} />}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {!isMinimized && (
                <button
                  onClick={clearMessages}
                  title="Effacer la conversation"
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body — hidden when minimized */}
          {!isMinimized && (
            <>
              {/* Offline banner */}
              {onlineStatus === 'offline' && (
                <div className="flex items-start gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
                  <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-snug">
                    Service indisponible. Assurez-vous que ChromaDB et Ollama sont démarrés.
                  </p>
                </div>
              )}

              {/* Tabs — admin only */}
              {isAdmin && (
                <div className="flex border-b border-slate-100 flex-shrink-0 bg-white">
                  {(['chat', 'docs'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                        activeTab === tab
                          ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {tab === 'chat' ? '💬 Chat' : '📁 Documents'}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <>
                  {/* Messages */}
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-slate-50"
                  >
                    {allMessages.map((msg) => (
                      <ChatMessageComponent key={msg.id} message={msg} />
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                      <div className="flex gap-2.5 items-end">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f2b56] to-[#1e4080] flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1.5 items-center">
                            <span
                              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                              style={{ animationDelay: '160ms' }}
                            />
                            <span
                              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                              style={{ animationDelay: '320ms' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <ChatInput
                    onSend={sendMessage}
                    isLoading={isLoading}
                    disabled={onlineStatus === 'offline'}
                    language={language}
                  />
                </>
              )}

              {/* Docs Tab (admin) */}
              {activeTab === 'docs' && isAdmin && <AdminDocsPanel />}
            </>
          )}
        </div>
      )}

      {/* ── FAB BUTTON ── */}
      <button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            setIsOpen(true);
            setIsMinimized(false);
            setHasUnread(false);
          }
        }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        style={{
          background: isOpen
            ? '#475569'
            : 'linear-gradient(135deg, #0f2b56 0%, #2563eb 100%)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(71,85,105,0.4)'
            : '0 4px 24px rgba(37,99,235,0.45)',
        }}
        aria-label="Ouvrir l'assistant"
      >
        <div
          className="transition-all duration-300"
          style={{ transform: isOpen ? 'rotate(0deg) scale(1)' : 'rotate(0deg) scale(1)' }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Unread dot */}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {/* Online pulse ring */}
        {!isOpen && onlineStatus === 'online' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white bg-green-400" />
        )}
      </button>
    </div>
  );

  return ReactDOM.createPortal(widget, document.body);
};

export default ChatbotWidget;
