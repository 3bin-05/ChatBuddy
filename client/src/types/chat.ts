export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  systemPrompt: string;
  theme: ThemeMode;
}

export interface ConnectionStatusState {
  status: 'connected' | 'disconnected' | 'checking';
  ollamaReachable: boolean;
  modelName: string;
  modelAvailable: boolean;
  availableModels: string[];
  message?: string;
  lastChecked?: number;
}

