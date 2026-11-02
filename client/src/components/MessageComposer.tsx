import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, Sparkles } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(newHeight, 44)}px`;
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isGenerating) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setInput('');

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0f1117] dark:via-[#0f1117]/95 dark:to-transparent pt-6">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200 dark:border-gray-700/80 shadow-lg shadow-purple-500/5 focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/20 p-2 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? 'ChatBuddy is not ready...'
                : 'Ask ChatBuddy anything... (Shift + Enter for new line)'
            }
            rows={1}
            className="flex-1 max-h-44 min-h-[44px] px-3.5 py-2.5 bg-transparent border-0 focus:outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              title="Stop generating"
              className="flex-shrink-0 w-9 h-9 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-rose-600/20"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              title="Send message"
              className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                input.trim() && !disabled
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </form>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Powered by Qwen · Running locally with Ollama</span>
        </div>
      </div>
    </div>
  );
};

