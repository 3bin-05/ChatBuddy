import React, { useRef, useEffect } from 'react';
import { Menu, Plus, AlertCircle, Bot, RefreshCw } from 'lucide-react';
import type { ChatMessage, ConnectionStatusState } from '../types/chat';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

interface ChatWindowProps {
  messages: ChatMessage[];
  activeTitle?: string;
  isGenerating: boolean;
  error: string | null;
  connectionStatus: ConnectionStatusState;
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  onNewChat: () => void;
  onOpenMobileMenu: () => void;
  onRefreshHealth: () => void;
  onOpenSettings: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  activeTitle,
  isGenerating,
  error,
  connectionStatus,
  onSendMessage,
  onStopGeneration,
  onNewChat,
  onOpenMobileMenu,
  onRefreshHealth,
  onOpenSettings,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  // Monitor scroll position to avoid snapping if user is looking up previous history
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 100;
  };

  // Auto-scroll when messages update or stream
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const hasMessages = messages.length > 0;

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#0f1117] relative">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/80 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {activeTitle || 'ChatBuddy'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 font-mono">
                <Bot className="w-3 h-3 text-purple-500" />
                {connectionStatus.modelName}
              </span>
              <span>•</span>
              <span
                className={`font-medium ${
                  connectionStatus.status === 'connected' && connectionStatus.modelAvailable
                    ? 'text-emerald-500'
                    : 'text-amber-500'
                }`}
              >
                {connectionStatus.status === 'connected' && connectionStatus.modelAvailable
                  ? 'Local AI Ready'
                  : 'Check Connection'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium shadow-2xs transition-all hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
            title="New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Ollama Disconnected / Model Missing Alert Banner */}
      {connectionStatus.status !== 'checking' &&
        (!connectionStatus.ollamaReachable || !connectionStatus.modelAvailable) && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                {!connectionStatus.ollamaReachable
                  ? "Ollama server is not running locally. Start it with 'ollama serve'."
                  : `Model '${connectionStatus.modelName}' is not installed in Ollama. Pull it with 'ollama pull ${connectionStatus.modelName}'.`}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onRefreshHealth}
                className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 font-medium transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="underline font-medium hover:text-amber-950 dark:hover:text-amber-100"
              >
                Settings
              </button>
            </div>
          </div>
        )}

      {/* Global Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Chat Messages or Welcome Screen */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col"
      >
        {!hasMessages ? (
          <WelcomeScreen
            onSelectPrompt={onSendMessage}
            modelName={connectionStatus.modelName}
          />
        ) : (
          <div className="flex-1 py-4">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreamingMessage = isLastMessage && isGenerating && msg.role === 'assistant';

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreamingMessage}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        onStopGeneration={onStopGeneration}
        isGenerating={isGenerating}
        disabled={false}
      />
    </main>
  );
};

