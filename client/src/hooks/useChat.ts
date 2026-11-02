import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  ChatMessage,
  ModelSettings,
  ConnectionStatusState,
} from '../types/chat';
import { useConversations } from './useConversations';
import { streamChatResponse, checkOllamaHealth } from '../services/chatService';
import { getStoredSettings, saveStoredSettings } from '../utils/storage';

export function useChat() {
  const {
    conversations,
    activeId,
    activeConversation,
    selectConversation,
    startNewConversation,
    removeConversation,
    clearAll,
    appendMessage,
    updateMessageContent,
  } = useConversations();

  const [settings, setSettings] = useState<ModelSettings>(() => getStoredSettings());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusState>({
    status: 'checking',
    ollamaReachable: false,
    modelName: settings.model,
    modelAvailable: false,
    availableModels: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Health check on mount and when settings.model changes
  const checkHealth = useCallback(async (modelName?: string) => {
    setConnectionStatus((prev) => ({ ...prev, status: 'checking' }));
    const result = await checkOllamaHealth(modelName || settings.model);
    setConnectionStatus(result);
  }, [settings.model]);

  useEffect(() => {
    checkHealth();
    // Periodically re-check every 30 seconds
    const interval = setInterval(() => checkHealth(), 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Update settings and persist
  const updateSettings = useCallback((newSettings: Partial<ModelSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveStoredSettings(updated);
      return updated;
    });
  }, []);

  // Stop active generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Send a chat message
  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed || isGenerating) return;

      setError(null);

      // Create or ensure conversation exists
      let currentConv = activeConversation;
      if (!currentConv) {
        currentConv = startNewConversation();
      }

      const userMessageId = `msg_${Date.now()}_u`;
      const assistantMessageId = `msg_${Date.now() + 1}_a`;

      const userMsg: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      // Add user message to conversation immediately
      appendMessage(userMsg);

      // Create placeholder assistant message
      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      appendMessage(assistantMsg);

      setIsGenerating(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Messages to send to Ollama: only active conversation history + userMsg
      const existingHistory = currentConv.messages.filter((m) => m.content.trim().length > 0);
      const messagesForApi = [...existingHistory, userMsg];

      let accumulatedThinking = '';
      let accumulatedContent = '';

      try {
        await streamChatResponse({
          messages: messagesForApi,
          settings,
          signal: controller.signal,
          onChunk: (chunk, isThinking) => {
            if (isThinking) {
              accumulatedThinking += chunk;
              const formatted = `<details open>\n<summary>💭 Thinking process</summary>\n\n${accumulatedThinking}\n\n</details>`;
              updateMessageContent(assistantMessageId, formatted);
            } else {
              accumulatedContent += chunk;
              const formatted = accumulatedThinking
                ? `<details>\n<summary>💭 Thought process</summary>\n\n${accumulatedThinking}\n\n</details>\n\n${accumulatedContent}`
                : accumulatedContent;
              updateMessageContent(assistantMessageId, formatted);
            }
          },
          onComplete: () => {
            setIsGenerating(false);
            abortControllerRef.current = null;
          },
          onError: (errMsg) => {
            setError(errMsg);
            setIsGenerating(false);
            abortControllerRef.current = null;
            // If nothing was streamed yet, show clean error in message
            if (!accumulatedContent && !accumulatedThinking) {
              updateMessageContent(
                assistantMessageId,
                `⚠️ **Unable to complete response**\n\n${errMsg}`
              );
            }
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown generation error';
        setError(msg);
        setIsGenerating(false);
        abortControllerRef.current = null;
        if (!accumulatedContent && !accumulatedThinking) {
          updateMessageContent(
            assistantMessageId,
            `⚠️ **Error:** ${msg}`
          );
        }
      }
    },
    [activeConversation, appendMessage, isGenerating, settings, startNewConversation, updateMessageContent]
  );

  return {
    conversations,
    activeId,
    activeConversation,
    messages: activeConversation?.messages || [],
    isGenerating,
    error,
    settings,
    connectionStatus,
    sendMessage,
    stopGeneration,
    selectConversation,
    startNewConversation,
    removeConversation,
    clearAll,
    updateSettings,
    checkHealth,
  };
}
