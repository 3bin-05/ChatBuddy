import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ollamaService } from './services/ollama.js';

// Load environment variables from server or project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to local server/.env

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Chat and health API routes
app.use('/api', chatRouter);

// Global error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`===============================================`);
  console.log(`🤖 ChatBuddy Backend Server Running`);
  console.log(`🌐 Server Port:     ${port}`);
  console.log(`🦙 Ollama Host:     ${ollamaService.getBaseUrl()}`);
  console.log(`🧠 Default Model:   ${ollamaService.getDefaultModel()}`);
  console.log(`📡 Health endpoint: http://localhost:${port}/api/health`);
  console.log(`===============================================`);
});

