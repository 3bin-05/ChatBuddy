# ChatBuddy — Local AI Chatbot

A modern, distraction-free AI chatbot web application built with **React.js**, **Express.js**, and local **Qwen Instruct** models running entirely on your machine via **Ollama**.

ChatBuddy offers a responsive, ChatGPT-style interface with full Markdown formatting, real-time token streaming, browser-cached conversation history (with strict 5-conversation management), customizable model settings, and zero dependency on paid cloud AI APIs.

---

## 🌟 Key Features

- **100% Local & Private**: No API keys, no paid subscriptions, no telemetry. All inference runs directly on your hardware via Ollama.
- **Qwen Instruct Integration**: Built for `qwen3:4b` / `qwen3:4b-instruct` (or any model in your local Ollama library like `qwen2.5:3b`, `llama3`, etc.).
- **Real-Time Token Streaming**: Streams responses incrementally using Server-Sent Events (SSE) with live progress and thoughts support.
- **Interruptible Generation**: Instant cancellation through `AbortController` stops Ollama GPU/CPU computation immediately.
- **Smart 5-Conversation Storage**:
  - Persistent browser `localStorage` management.
  - Automatically caps stored history at **5 complete conversations**.
  - When a 6th conversation is created, the oldest conversation (by creation timestamp) is purged automatically.
  - Individual messages within conversations are never truncated.
- **ChatGPT-Inspired UI**:
  - Light and Dark theme support (with System preference detection).
  - Neutral backgrounds with soft borders, rounded corners, and subtle purple accents (`#8b5cf6`).
  - Collapsible sidebar on desktop, responsive drawer on mobile and tablet devices.
  - Centered welcome screen with suggestion cards for concept explanation, writing, coding, and brainstorming.
  - Auto-resizing multiline message composer (Enter to send, Shift + Enter for new lines).
- **Rich Markdown & Code Highlighting**:
  - Headings, lists, blockquotes, tables, inline code.
  - Syntax-highlighted code blocks with language tags and one-click copy buttons for code and messages.
- **Comprehensive Settings**:
  - Model name selection (with auto-detection of locally installed Ollama models).
  - Temperature, Max Response Tokens, and Context Window sliders.
  - System prompt editor with one-click reset to defaults.
  - Clear all history with confirmation.
- **Connection Health Monitor**:
  - Live indicator showing Ollama connectivity and model availability.
  - Quick terminal hints and troubleshooting steps if Ollama is offline or the model is not found.

---

## 🧱 Architecture & Project Structure

```
ChatBuddy/
├── client/                     # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # Collapsible drawer with history & status
│   │   │   ├── ChatWindow.tsx          # Main chat container & navbar
│   │   │   ├── MessageBubble.tsx       # Markdown message bubble & code copy
│   │   │   ├── MessageComposer.tsx     # Auto-resizing textarea with stop button
│   │   │   ├── WelcomeScreen.tsx       # Initial greeting with 4 prompt cards
│   │   │   ├── SettingsModal.tsx       # Model parameters & theme settings
│   │   │   └── ConnectionStatus.tsx    # Live Ollama health & model monitor
│   │   ├── hooks/
│   │   │   ├── useChat.ts              # Orchestrates chat generation & status
│   │   │   └── useConversations.ts     # LocalStorage state & 5-chat limit rule
│   │   ├── services/
│   │   │   └── chatService.ts          # SSE client & health API requests
│   │   ├── utils/
│   │   │   └── storage.ts              # LocalStorage read/write & title generator
│   │   ├── types/
│   │   │   └── chat.ts                 # TypeScript interfaces
│   │   ├── App.tsx                     # Main layout & theme coordinator
│   │   ├── main.tsx                    # React entrypoint
│   │   └── index.css                   # Tailwind v4, themes, & prose styling
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.ts                 # GET /api/health and POST /api/chat (SSE)
│   │   ├── services/
│   │   │   └── ollama.ts               # Ollama proxy client & stream decoder
│   │   ├── middleware/
│   │   │   └── errorHandler.ts         # User-friendly error responses
│   │   └── index.ts                    # Express server initialization
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example                # Sample environment variables
├── .env                        # Local environment variables
├── .gitignore
├── package.json                # Root package with concurrently scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites

1. **Node.js**: Install Node.js (v18 or newer). Check version:
   ```bash
   node -v
   npm -v
   ```
2. **Ollama**: Install Ollama from [ollama.com](https://ollama.com). Verify installation:
   ```bash
   ollama --version
   ```

### 2. Download the Qwen Instruct Model

Pull the Qwen 4B model into Ollama:
```bash
ollama pull qwen3:4b
```
*(Optional: If you prefer the dedicated instruct-tuned variant without extended thinking, you can also run `ollama pull qwen3:4b-instruct`).*

Verify installed models:
```bash
ollama list
```

### 3. Start the Ollama Server

Make sure the Ollama daemon is running:
```bash
ollama serve
```
*(On Windows and macOS, Ollama typically runs automatically in the system tray).*

### 4. Install Project Dependencies

Clone or open the project folder in your terminal and run:
```bash
# Install root, backend, and frontend dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 5. Configure Environment Variables (Optional)

The backend reads configuration from `.env` or defaults to sensible values:
```env
PORT=5000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
```

### 6. Run ChatBuddy

You can run both client and server concurrently with a single command from the project root:
```bash
npm run dev
```

Or run them individually in separate terminal tabs:

**Terminal 1 (Backend):**
```bash
npm run dev:server
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
npm run dev:client
# Frontend opens at http://localhost:3000
```

### 7. Open the App in Your Browser

Navigate to:
```
http://localhost:3000
```

The connection status badge in the sidebar will show a green dot and `Ready` once connected to your local Ollama server.

---

## ⚙️ Model Settings & Configuration

Click the **Settings** gear icon in the bottom of the sidebar to customize:

| Setting | Default | Description |
| :--- | :--- | :--- |
| **Ollama Model Name** | `qwen3:4b` | Any model tag listed in your `ollama list` (e.g. `qwen3:4b`, `qwen3:4b-instruct`, `qwen3:8b`). Click any detected model pill to switch instantly. |
| **Temperature** | `0.70` | Controls randomness: lower (`0.0 - 0.3`) for code and precise facts, higher (`0.8 - 1.2`) for brainstorming. |
| **Max Response Tokens** | `2048` | Maximum length of generated replies (up to 8,192). |
| **Context Window** | `4096` | Context memory allocated in Ollama for the active chat. |
| **System Prompt** | ChatBuddy Default | Custom instructions guiding the AI assistant's personality and formatting. |
| **Theme** | `System` | Choose between Light, Dark, or System mode. |
| **Clear All History** | — | Permanently empties local browser conversation storage. |

---

## 💾 Conversation Management Rules

- **Browser Storage**: All conversations are stored in browser `localStorage` (`chatbuddy_conversations`).
- **5-Chat Limit**:
  - The application stores a maximum of **5 conversations**.
  - When the user starts a 6th conversation, the application calculates which conversation has the earliest `createdAt` timestamp, purges it, and creates the new chat.
  - History is updated in `localStorage` synchronously.
- **Active-Only Context**: Only messages from the currently opened conversation are transmitted to Ollama as context.
- **Title Generation**: Clean conversational titles are automatically generated from the first user message.
- **Manual Deletion**: Users can delete individual conversations with a safety confirmation prompt.

---

## 🛠️ Troubleshooting

### 1. "Ollama Offline" or "Cannot connect to Ollama"
- **Cause**: Ollama service is not running or is listening on a non-standard port.
- **Fix**: Open a terminal and run `ollama serve`. Make sure `http://localhost:11434/api/tags` responds in your browser or curl.

### 2. "Model Missing: Model 'qwen3:4b' not found"
- **Cause**: The configured model has not been downloaded yet.
- **Fix**: In your terminal, run:
  ```bash
  ollama pull qwen3:4b
  ```
  Or open Settings in ChatBuddy and select an existing installed model from the detected model buttons.

### 3. Port 5000 Already in Use
- Change `PORT=5001` in `.env` (or `server/.env`) and update proxy port in `client/vite.config.ts`.

### 4. Slow Token Generation
- Ensure Ollama has GPU acceleration enabled (NVIDIA CUDA, Apple Metal, or AMD ROCm).
- 4B models require ~2.5 GB of VRAM/RAM, making them fast and responsive on modern laptops and desktops.

---

## 📄 License

MIT License. Designed and crafted for private, local AI workflows.

