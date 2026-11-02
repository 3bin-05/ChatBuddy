export interface OllamaModelInfo {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaTagsResponse {
  models: OllamaModelInfo[];
}

export interface HealthCheckResult {
  status: 'connected' | 'disconnected';
  ollamaReachable: boolean;
  modelName: string;
  modelAvailable: boolean;
  availableModels: string[];
  message?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  options?: ChatOptions;
  signal?: AbortSignal;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = (baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || 'qwen3:4b';
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async checkHealth(requestedModel?: string): Promise<HealthCheckResult> {
    const targetModel = (requestedModel || this.defaultModel).trim();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'disconnected',
          ollamaReachable: false,
          modelName: targetModel,
          modelAvailable: false,
          availableModels: [],
          message: `Ollama server returned status ${response.status}`,
        };
      }

      const data = (await response.json()) as OllamaTagsResponse;
      const models = Array.isArray(data?.models) ? data.models : [];
      const availableNames = models.map((m) => m.name);

      // Model matching: exact or base tag matching (e.g., "qwen3:4b" or "qwen3:4b-instruct" or "qwen3:latest")
      const modelAvailable = availableNames.some((name) => {
        if (name === targetModel) return true;
        if (name.split(':')[0] === targetModel.split(':')[0] && targetModel.includes(':') === false) return true;
        return false;
      });

      return {
        status: 'connected',
        ollamaReachable: true,
        modelName: targetModel,
        modelAvailable,
        availableModels: availableNames,
        message: modelAvailable
          ? `Connected to Ollama. Model '${targetModel}' is ready.`
          : `Connected to Ollama, but model '${targetModel}' is not found in local models. Run 'ollama pull ${targetModel}' or choose another model.`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        status: 'disconnected',
        ollamaReachable: false,
        modelName: targetModel,
        modelAvailable: false,
        availableModels: [],
        message: `Cannot connect to Ollama at ${this.baseUrl}. Please ensure Ollama is installed and running ('ollama serve'). Details: ${errorMessage}`,
      };
    }
  }

  async streamChat(
    params: StreamChatParams,
    onChunk: (chunk: { token: string; isThinking?: boolean; done: boolean; raw?: Record<string, unknown> }) => void
  ): Promise<void> {
    const { messages, systemPrompt, model, options, signal } = params;
    const activeModel = (model || this.defaultModel).trim();

    const formattedMessages: ChatMessage[] = [];
    if (systemPrompt && systemPrompt.trim()) {
      formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    for (const msg of messages) {
      if (msg.content && msg.content.trim()) {
        formattedMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    const payload = {
      model: activeModel,
      messages: formattedMessages,
      stream: true,
      options: {
        ...(options?.temperature !== undefined ? { temperature: options.temperature } : { temperature: 0.7 }),
        ...(options?.maxTokens !== undefined ? { num_predict: options.maxTokens } : { num_predict: 2048 }),
        ...(options?.contextWindow !== undefined ? { num_ctx: options.contextWindow } : { num_ctx: 4096 }),
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Chat generation aborted by user.');
      }
      throw new Error(`Failed to reach Ollama at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!response.ok) {
      let errText = '';
      try {
        errText = await response.text();
      } catch {
        errText = response.statusText;
      }

      if (response.status === 404) {
        throw new Error(`Model '${activeModel}' not found in Ollama. Please run 'ollama pull ${activeModel}' to install it.`);
      }

      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('Ollama returned an empty response body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const content = parsed?.message?.content ?? '';
            const thinking = parsed?.message?.thinking ?? '';
            const isDone = Boolean(parsed?.done);

            const isThinking = Boolean(thinking && !content);
            const token = isThinking ? thinking : content;

            if (token || isDone) {
              onChunk({
                token,
                isThinking,
                done: isDone,
                raw: parsed,
              });
            }

            if (isDone) {
              return;
            }
          } catch {
            // Ignore malformed JSON chunks from stream boundaries
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const content = parsed?.message?.content ?? '';
          const thinking = parsed?.message?.thinking ?? '';
          const isDone = Boolean(parsed?.done);
          const isThinking = Boolean(thinking && !content);
          const token = isThinking ? thinking : content;

          if (token || isDone) {
            onChunk({
              token,
              isThinking,
              done: isDone,
              raw: parsed,
            });
          }
        } catch {
          // ignore
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const ollamaService = new OllamaService();
