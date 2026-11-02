import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { ModelSettings, ThemeMode } from '../types/chat';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ModelSettings;
  availableModels: string[];
  onSave: (updated: Partial<ModelSettings>) => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  availableModels,
  onSave,
  onClearAllConversations,
}) => {
  const [formData, setFormData] = useState<ModelSettings>({ ...settings });
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setConfirmClear(false);
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    setFormData({
      ...DEFAULT_SETTINGS,
      theme: formData.theme, // keep user's active theme
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                Model Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure your local Qwen & Ollama parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Model Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="model-name" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Ollama Model Name
              </label>
              <span className="text-[11px] text-gray-400">
                Default: <code className="font-mono">qwen3:4b</code>
              </span>
            </div>
            <input
              id="model-name"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value.trim() })}
              placeholder="e.g. qwen3:4b, qwen2.5:3b, qwen2.5:7b"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              required
            />
            {availableModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Detected models:</span>
                {availableModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, model: m })}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                      formData.model === m
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Temperature & Tokens in 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Temperature */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="temp-slider" className="font-medium text-gray-700 dark:text-gray-300">Temperature</label>
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400">
                  {formData.temperature.toFixed(2)}
                </span>
              </div>
              <input
                id="temp-slider"
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0.0 (Strict / Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="max-tokens" className="font-medium text-gray-700 dark:text-gray-300">Max Response Tokens</label>
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400">
                  {formData.maxTokens}
                </span>
              </div>
              <input
                id="max-tokens"
                type="range"
                min="256"
                max="8192"
                step="256"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>512 (Brief)</span>
                <span>2048 (Recommended)</span>
                <span>8192 (Long)</span>
              </div>
            </div>
          </div>

          {/* Context Window */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="context-window" className="font-medium text-gray-700 dark:text-gray-300">
                Context Window (tokens)
              </label>
              <span className="text-[11px] text-gray-400">
                Determines how much previous context Ollama keeps in memory
              </span>
            </div>
            <select
              id="context-window"
              value={formData.contextWindow}
              onChange={(e) => setFormData({ ...formData, contextWindow: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="2048">2,048 tokens (Minimal RAM usage)</option>
              <option value="4096">4,096 tokens (Standard for 4B models)</option>
              <option value="8192">8,192 tokens (Large context)</option>
              <option value="16384">16,384 tokens (Deep context / 8GB+ VRAM)</option>
            </select>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="system-prompt" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                System Prompt
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset prompt
              </button>
            </div>
            <textarea
              id="system-prompt"
              rows={3}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
              placeholder="System prompt instructions for the AI assistant..."
            />
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'system', label: 'System', icon: Laptop },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, theme: id as ThemeMode })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                    formData.theme === id
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone: Clear all conversations */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Conversations
                </h4>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                  Delete all local conversation history from browser storage.
                </p>
              </div>

              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllConversations();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-xs font-medium transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
