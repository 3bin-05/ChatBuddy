import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async (text: string, isBlock = false, callback?: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      if (callback) {
        callback();
      } else if (!isBlock) {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(timestamp));
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`group w-full py-4 px-4 sm:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-purple-50/20 dark:bg-gray-800/25 border-y border-purple-100/30 dark:border-gray-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 sm:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-semibold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {isUser ? 'You' : 'ChatBuddy'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">
                {formatTime(message.timestamp)}
              </span>

              {!isUser && message.content && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(message.content)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-[11px] flex items-center gap-1"
                  title="Copy message"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Message Text */}
          {isUser ? (
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            /* Assistant Markdown Rendering */
            <div className="prose-chat text-sm text-gray-800 dark:text-gray-200 leading-relaxed overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Code block with top bar and copy button
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    const codeString = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono text-xs border border-purple-200/50 dark:border-purple-800/40"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock
                        language={match ? match[1] : 'text'}
                        code={codeString}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming Cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-purple-600 dark:bg-purple-400 animate-cursor align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized Code Block component with Copy button & language tag
const CodeBlock: React.FC<{ language: string; code: string }> = ({
  language,
  code,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-900 shadow-sm text-gray-100">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/60 text-xs">
        <span className="font-mono text-gray-400 font-medium lowercase">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/80 transition-colors text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed">
        <pre className="!m-0 !p-0 !bg-transparent">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

