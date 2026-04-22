import React, { useState } from 'react';
import { Bot, User, ChevronDown, ChevronUp, FileText, Clock, Zap } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../hooks/useChatbot';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';
  const hasSources = message.sources && message.sources.length > 0;

  const formattedTime = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Render content with basic line-break support
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
            : 'bg-gradient-to-br from-[#0f2b56] to-[#1e4080]'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Bubble + meta */}
      <div className={`flex flex-col max-w-[78%] gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-sm'
              : message.isError
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-2xl rounded-bl-sm'
              : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm'
          }`}
        >
          {renderContent(message.content)}
        </div>

        {/* Sources toggle */}
        {!isUser && hasSources && (
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors ml-1"
          >
            <FileText className="w-3 h-3" />
            {message.sources!.length} source{message.sources!.length > 1 ? 's' : ''}
            {showSources ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Sources panel */}
        {!isUser && hasSources && showSources && (
          <div className="w-full space-y-2 mt-1">
            {message.sources!.map((source, i) => (
              <div
                key={i}
                className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-blue-900 leading-tight">
                    {source.metadata?.title ||
                      source.metadata?.filename ||
                      `Source ${i + 1}`}
                  </span>
                  {source.metadata?.category && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full text-xs font-medium">
                      {String(source.metadata.category)}
                    </span>
                  )}
                </div>
                <p className="text-blue-700 line-clamp-2 leading-relaxed">
                  {source.content}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-blue-500">
                  <Zap className="w-3 h-3" />
                  <span>Relevance: {Math.round(source.relevanceScore)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata row */}
        <div className={`flex items-center gap-2 text-xs text-slate-400 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedTime}
          </div>
          {!isUser && message.metadata && (
            <>
              <span>·</span>
              <span>{message.metadata.model}</span>
              <span>·</span>
              <span>{message.metadata.processingTime}ms</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
