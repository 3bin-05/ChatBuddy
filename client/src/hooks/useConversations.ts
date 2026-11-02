import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ChatMessage } from '../types/chat';
import {
  getStoredConversations,
  saveStoredConversations,
  createNewConversation,
  deleteStoredConversation,
  clearAllStoredConversations,
  getActiveConversationId,
  setActiveConversationId,
  generateTitleFromMessage,
  MAX_CONVERSATIONS,
} from '../utils/storage';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const list = getStoredConversations();
    return list;
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    const savedActive = getActiveConversationId();
    const list = getStoredConversations();
    if (savedActive && list.some((c) => c.id === savedActive)) {
      return savedActive;
    }
    return list[0]?.id || null;
  });

  // Keep activeId in sync with localStorage
  useEffect(() => {
    setActiveConversationId(activeId);
  }, [activeId]);

  // Derived active conversation
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Select a conversation
  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // Create a new conversation adhering strictly to the 5-conversation limit
  const startNewConversation = useCallback((title?: string) => {
    const created = createNewConversation(title || 'New Chat');
    const updatedList = getStoredConversations();
    setConversations(updatedList);
    setActiveId(created.id);
    return created;
  }, []);

  // Delete a specific conversation
  const removeConversation = useCallback((id: string) => {
    const remaining = deleteStoredConversation(id);
    setConversations(remaining);
    if (activeId === id) {
      setActiveId(remaining[0]?.id || null);
    }
  }, [activeId]);

  // Clear all conversations
  const clearAll = useCallback(() => {
    clearAllStoredConversations();
    setConversations([]);
    setActiveId(null);
  }, []);

  // Append a message to the active conversation
  const appendMessage = useCallback((message: ChatMessage) => {
    setConversations((prev) => {
      let targetId = activeId;
      let targetIndex = prev.findIndex((c) => c.id === targetId);

      let workingList = [...prev];

      // If no active conversation exists, create one now adhering to 5 max limit
      if (targetIndex === -1) {
        const newChat = createNewConversation();
        workingList = getStoredConversations();
        targetId = newChat.id;
        targetIndex = workingList.findIndex((c) => c.id === targetId);
        setActiveId(targetId);
      }

      const conv = workingList[targetIndex];
      const isFirstUserMessage =
        message.role === 'user' &&
        (!conv.messages || conv.messages.filter((m) => m.role === 'user').length === 0);

      const newTitle = isFirstUserMessage
        ? generateTitleFromMessage(message.content)
        : conv.title;

      const updatedConv: Conversation = {
        ...conv,
        title: newTitle,
        updatedAt: Date.now(),
        messages: [...conv.messages, message],
      };

      workingList[targetIndex] = updatedConv;

      // Re-sort so most recently updated appears near top
      workingList.sort((a, b) => b.updatedAt - a.updatedAt);
      saveStoredConversations(workingList);
      return workingList;
    });
  }, [activeId]);

  // Stream-update or edit a message content in active conversation
  const updateMessageContent = useCallback((messageId: string, content: string) => {
    setConversations((prev) => {
      const targetIndex = prev.findIndex((c) => c.id === activeId);
      if (targetIndex === -1) return prev;

      const conv = prev[targetIndex];
      const msgIndex = conv.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return prev;

      const updatedMessages = [...conv.messages];
      updatedMessages[msgIndex] = {
        ...updatedMessages[msgIndex],
        content,
      };

      const updatedConv: Conversation = {
        ...conv,
        updatedAt: Date.now(),
        messages: updatedMessages,
      };

      const workingList = [...prev];
      workingList[targetIndex] = updatedConv;
      saveStoredConversations(workingList);
      return workingList;
    });
  }, [activeId]);

  return {
    conversations,
    activeId,
    activeConversation,
    maxConversations: MAX_CONVERSATIONS,
    selectConversation,
    startNewConversation,
    removeConversation,
    clearAll,
    appendMessage,
    updateMessageContent,
  };
}

