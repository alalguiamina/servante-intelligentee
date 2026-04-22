import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  language?: string;
}

const SUGGESTIONS_FR = [
  'Comment emprunter un outil ?',
  'Quels outils sont disponibles ?',
  'Comment retourner un outil ?',
];

const SUGGESTIONS_EN = [
  'How do I borrow a tool?',
  'What tools are available?',
  'How to return a tool?',
];

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  disabled = false,
  language = 'en',
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = language === 'fr' ? SUGGESTIONS_FR : SUGGESTIONS_EN;
  const placeholder =
    language === 'fr'
      ? 'Posez une question sur la plateforme…'
      : 'Ask anything about the platform…';

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSuggestion = (suggestion: string) => {
    if (isLoading || disabled) return;
    onSend(suggestion);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white rounded-b-2xl">
      {/* Quick suggestions — only show when input is empty */}
      {!input && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s)}
              disabled={isLoading || disabled}
              className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-full border border-slate-200 hover:border-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading || disabled}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              !input.trim() || isLoading || disabled
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #1e40af, #2563eb)',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
