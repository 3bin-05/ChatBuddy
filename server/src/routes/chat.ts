import { Router, type Request, type Response } from 'express';
import { ollamaService, type ChatMessage } from '../services/ollama.js';

export const chatRouter = Router();

// GET /api/health
chatRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const requestedModel = typeof req.query.model === 'string' ? req.query.model : undefined;
    const health = await ollamaService.checkHealth(requestedModel);
    res.json(health);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query Ollama health';
    res.status(503).json({
      status: 'disconnected',
      ollamaReachable: false,
      modelName: typeof req.query.model === 'string' ? req.query.model : ollamaService.getDefaultModel(),
      modelAvailable: false,
      availableModels: [],
      message,
    });
  }
});

// POST /api/chat
chatRouter.post('/chat', async (req: Request, res: Response) => {
  const { messages, systemPrompt, model, temperature, maxTokens, contextWindow } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({
      error: { message: 'Request must include a non-empty array of messages.' },
    });
    return;
  }

  // Create an AbortController for Ollama streaming
  const controller = new AbortController();

  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // If client connection closes before response finishes, abort Ollama request
  res.on('close', () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  // Helper to send SSE data
  const sendEvent = (payload: Record<string, unknown>) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };

  try {
    await ollamaService.streamChat(
      {
        messages: messages as ChatMessage[],
        systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : undefined,
        model: typeof model === 'string' ? model : undefined,
        options: {
          temperature: typeof temperature === 'number' ? temperature : undefined,
          maxTokens: typeof maxTokens === 'number' ? maxTokens : undefined,
          contextWindow: typeof contextWindow === 'number' ? contextWindow : undefined,
        },
        signal: controller.signal,
      },
      (chunk) => {
        sendEvent({
          token: chunk.token,
          isThinking: chunk.isThinking || false,
          done: chunk.done,
          totalDuration: chunk.raw?.total_duration,
          evalCount: chunk.raw?.eval_count,
        });
      }
    );

    if (!res.writableEnded) {
      res.end();
    }
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      if (!res.writableEnded) {
        sendEvent({ done: true, aborted: true });
        res.end();
      }
      return;
    }

    const message = err instanceof Error ? err.message : 'Error generating chat completion';
    sendEvent({ error: message, done: true });
    if (!res.writableEnded) {
      res.end();
    }
  }
});
