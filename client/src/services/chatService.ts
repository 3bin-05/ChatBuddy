import type { ChatMessage, ConnectionStatusState, ModelSettings } from '../types/chat';

export interface StreamChatOptions {
  messages: ChatMessage[];
  settings: ModelSettings;
  signal?: AbortSignal;
  onChunk: (token: string, isThinking?: boolean) => void;
  onComplete?: () => void;
  onError?: (errorMessage: string) => void;
}

const API_BASE = '/api';

/**
 * Check Ollama & model health
 */
export async function checkOllamaHealth(modelName?: string): Promise<ConnectionStatusState> {
  try {
    const url = new URL(`${API_BASE}/health`, window.location.origin);
    if (modelName) {
      url.searchParams.set('model', modelName);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json();
    return {
      status: data.status === 'connected' ? 'connected' : 'disconnected',
      ollamaReachable: Boolean(data.ollamaReachable),
      modelName: data.modelName || modelName || 'qwen3:4b',
      modelAvailable: Boolean(data.modelAvailable),
      availableModels: Array.isArray(data.availableModels) ? data.availableModels : [],
      message: data.message,
      lastChecked: Date.now(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend connection failed';
    return {
      status: 'disconnected',
      ollamaReachable: false,
      modelName: modelName || 'qwen3:4b',
      modelAvailable: false,
      availableModels: [],
      message: `Could not connect to ChatBuddy backend: ${msg}`,
      lastChecked: Date.now(),
    };
  }
}

/**
 * Stream chat completions via Server-Sent Events
 */
export async function streamChatResponse(options: StreamChatOptions): Promise<void> {
  const { messages, settings, signal, onChunk, onComplete, onError } = options;

  // Format messages payload cleanly
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        systemPrompt: settings.systemPrompt,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        contextWindow: settings.contextWindow,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        errorMsg = await response.text();
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('Response body is empty.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const trimmed = event.trim();
        if (!trimmed) continue;

        // Server-Sent Event lines begin with "data: "
        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonStr = line.substring(5).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.error) {
                onError?.(data.error);
                return;
              }

              if (data.token) {
                onChunk(data.token, Boolean(data.isThinking));
              }

              if (data.done) {
                onComplete?.();
                return;
              }
            } catch {
              // Ignore incomplete SSE chunk parse attempts
            }
          }
        }
      }
    }

    onComplete?.();
  } catch (err: unknown) {
    if (signal?.aborted) {
      // User cancelled generation cleanly
      onComplete?.();
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    onError?.(msg);
  }
}
