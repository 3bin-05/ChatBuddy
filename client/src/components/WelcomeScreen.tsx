import React from 'react';
import { Lightbulb, PenTool, Code2, Sparkles, Bot } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  modelName: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  modelName,
}) => {
  const suggestions = [
    {
      title: 'Explain a concept',
      prompt: 'Explain quantum computing in simple everyday terms, using clear analogies.',
      icon: Lightbulb,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/30',
    },
    {
      title: 'Help me write something',
      prompt: 'Help me write a concise, polite follow-up email after a job interview.',
      icon: PenTool,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/30',
    },
    {
      title: 'Generate code',
      prompt: 'Write a TypeScript debounce utility function with complete types and examples.',
      icon: Code2,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/30',
    },
    {
      title: 'Brainstorm ideas',
      prompt: 'Brainstorm 5 innovative ideas for a privacy-focused local productivity tool.',
      icon: Sparkles,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-250">
      {/* Bot Icon with glowing aura */}
      <div className="relative mb-6">
        <div className="absolute -inset-2 rounded-full bg-purple-500/20 blur-lg animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <Bot className="w-9 h-9" />
        </div>
      </div>

      {/* Main greeting */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
        Hello! I'm <span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">ChatBuddy</span>.
      </h1>

      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-2">
        Your personal AI assistant, powered locally.
      </p>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-xs font-medium text-purple-700 dark:text-purple-300 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        Model: <span className="font-mono font-semibold">{modelName}</span>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-2xl bg-white dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600/50 hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

