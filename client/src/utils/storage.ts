import type { Conversation, ModelSettings } from '../types/chat';

const STORAGE_KEY_CONVERSATIONS = 'chatbuddy_conversations';
const STORAGE_KEY_ACTIVE_ID = 'chatbuddy_active_conversation_id';
const STORAGE_KEY_SETTINGS = 'chatbuddy_settings';
export const MAX_CONVERSATIONS = 5;

export const DEFAULT_SYSTEM_PROMPT =
  'You are ChatBuddy, a helpful, friendly, and intelligent AI assistant. Provide accurate, clear, and useful answers. Explain complex topics in simple terms when appropriate. Use Markdown formatting for readability. If you do not know something, be honest. Keep responses concise unless the user requests detailed explanations.';

export const DEFAULT_SETTINGS: ModelSettings = {
  model: 'qwen3:4b',
  temperature: 0.7,
  maxTokens: 2048,
  contextWindow: 4096,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  theme: 'system',
};

/**
 * Generate a clean, descriptive title from the first message
 */
export function generateTitleFromMessage(content: string): string {
  if (!content) return 'New Chat';
  // Strip code blocks and special markdown chars
  const clean = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`_~>[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 'New Chat';

  if (clean.length <= 36) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  // Find nearest space before char 35
  const truncated = clean.substring(0, 35);
  const lastSpace = truncated.lastIndexOf(' ');
  const result = lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated;
  return result.charAt(0).toUpperCase() + result.slice(1) + '...';
}

/**
 * Safely parse JSON from localStorage
 */
function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[ChatBuddy Storage] Error reading key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set JSON in localStorage
 */
function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[ChatBuddy Storage] Error saving key "${key}":`, error);
    return false;
  }
}

/**
 * Retrieve all stored conversations
 */
export function getStoredConversations(): Conversation[] {
  const items = safeGetItem<Conversation[]>(STORAGE_KEY_CONVERSATIONS, []);
  if (!Array.isArray(items)) return [];
  // Ensure valid structure
  return items.filter(
    (item) => item && typeof item.id === 'string' && Array.isArray(item.messages)
  );
}

/**
 * Persist conversation array to localStorage
 */
export function saveStoredConversations(conversations: Conversation[]): void {
  safeSetItem(STORAGE_KEY_CONVERSATIONS, conversations);
}

/**
 * Create a new conversation adhering strictly to the 5-conversation maximum limit.
 * If 5 exist, deletes the oldest by createdAt.
 */
export function createNewConversation(initialTitle = 'New Chat'): Conversation {
  const current = getStoredConversations();

  // If 5 or more exist, remove the oldest (earliest createdAt)
  let updatedList = [...current];
  if (updatedList.length >= MAX_CONVERSATIONS) {
    // Find the oldest conversation by createdAt
    updatedList.sort((a, b) => a.createdAt - b.createdAt);
    // Remove the oldest one(s) so that after adding 1 new, total count is <= MAX_CONVERSATIONS
    while (updatedList.length >= MAX_CONVERSATIONS) {
      updatedList.shift();
    }
    // Maintain most recent activity ordering for remaining conversations
    updatedList.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  const now = Date.now();
  const newConversation: Conversation = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chat_${now}_${Math.random().toString(36).substring(2, 9)}`,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  // Prepend to show newest first in history
  updatedList = [newConversation, ...updatedList];
  saveStoredConversations(updatedList);
  setActiveConversationId(newConversation.id);

  return newConversation;
}

/**
 * Update an existing conversation in localStorage
 */
export function updateStoredConversation(updated: Conversation): void {
  const current = getStoredConversations();
  const index = current.findIndex((c) => c.id === updated.id);
  if (index >= 0) {
    current[index] = { ...updated, updatedAt: Date.now() };
    saveStoredConversations(current);
  } else {
    // If not found, append/save
    saveStoredConversations([updated, ...current]);
  }
}

/**
 * Delete a specific conversation by ID
 */
export function deleteStoredConversation(id: string): Conversation[] {
  const current = getStoredConversations();
  const filtered = current.filter((c) => c.id !== id);
  saveStoredConversations(filtered);

  const activeId = getActiveConversationId();
  if (activeId === id) {
    setActiveConversationId(filtered[0]?.id || null);
  }

  return filtered;
}

/**
 * Wipe all conversations
 */
export function clearAllStoredConversations(): void {
  localStorage.removeItem(STORAGE_KEY_CONVERSATIONS);
  localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
}

/**
 * Get or set active conversation ID
 */
export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  } catch {
    // ignore
  }
}

/**
 * Settings persistence
 */
export function getStoredSettings(): ModelSettings {
  const loaded = safeGetItem<Partial<ModelSettings>>(STORAGE_KEY_SETTINGS, {});
  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
  };
}

export function saveStoredSettings(settings: ModelSettings): void {
  safeSetItem(STORAGE_KEY_SETTINGS, settings);
}
