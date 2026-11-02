import React, { useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Server, Cpu, HelpCircle } from 'lucide-react';
import type { ConnectionStatusState } from '../types/chat';

interface ConnectionStatusProps {
  status: ConnectionStatusState;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  onRefresh,
  onOpenSettings,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const isConnected = status.status === 'connected' && status.modelAvailable;
  const isModelMissing = status.status === 'connected' && !status.modelAvailable;
  const isChecking = status.status === 'checking';
  const isOffline = status.status === 'disconnected';

  let dotColor = 'bg-emerald-500';
  let badgeBorder = 'border-emerald-200 dark:border-emerald-900/40';
  let badgeBg = 'bg-emerald-50/70 dark:bg-emerald-950/20';
  let textColor = 'text-emerald-700 dark:text-emerald-300';
  let label = 'Ready';
  let StatusIcon = Wifi;

  if (isChecking) {
    dotColor = 'bg-amber-400 animate-pulse';
    badgeBorder = 'border-amber-200 dark:border-amber-900/40';
    badgeBg = 'bg-amber-50/70 dark:bg-amber-950/20';
    textColor = 'text-amber-700 dark:text-amber-300';
    label = 'Checking...';
    StatusIcon = RefreshCw;
  } else if (isModelMissing) {
    dotColor = 'bg-amber-500';
    badgeBorder = 'border-amber-300 dark:border-amber-800/40';
    badgeBg = 'bg-amber-50 dark:bg-amber-950/30';
    textColor = 'text-amber-700 dark:text-amber-300';
    label = 'Model Missing';
    StatusIcon = AlertTriangle;
  } else if (isOffline) {
    dotColor = 'bg-rose-500';
    badgeBorder = 'border-rose-200 dark:border-rose-900/40';
    badgeBg = 'bg-rose-50/80 dark:bg-rose-950/20';
    textColor = 'text-rose-700 dark:text-rose-300';
    label = 'Ollama Offline';
    StatusIcon = WifiOff;
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${badgeBg} ${badgeBorder}`}
      >
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
          title="Click for connection details"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
          </span>

          <div className="flex flex-col min-w-0">
            <span className="truncate font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-500 flex-shrink-0" />
              <span className="truncate">{status.modelName}</span>
            </span>
            <span className={`text-[10px] ${textColor} flex items-center gap-1`}>
              <StatusIcon className={`w-2.5 h-2.5 ${isChecking ? 'animate-spin' : ''}`} />
              {label}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh connection status"
            aria-label="Refresh connection status"
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded status details card/popover */}
      {showTooltip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTooltip(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl z-50 text-xs text-gray-700 dark:text-gray-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold flex items-center gap-1.5 text-gray-900 dark:text-white">
                <Server className="w-3.5 h-3.5 text-purple-500" />
                Local Ollama Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${textColor} ${badgeBg}`}>
                {label}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Ollama Server:</span>
                <span className="font-mono text-[11px] text-gray-900 dark:text-white">
                  {status.ollamaReachable ? 'Reachable (localhost:11434)' : 'Unreachable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Target Model:</span>
                <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                  {status.modelName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Model Installed:</span>
                <span>{status.modelAvailable ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {status.message && (
              <p className="mt-2.5 p-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-800">
                {status.message}
              </p>
            )}

            {!status.ollamaReachable && (
              <div className="mt-2.5 p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-[11px] text-purple-800 dark:text-purple-300">
                <div className="font-semibold mb-0.5 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Quick Setup:
                </div>
                1. Start Ollama: <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">ollama serve</code>
                <br />
                2. Pull model: <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">ollama pull {status.modelName}</code>
              </div>
            )}

            {status.ollamaReachable && !status.modelAvailable && (
              <div className="mt-2.5 p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-[11px] text-purple-800 dark:text-purple-300">
                To download this model, run in your terminal:
                <div className="font-mono bg-purple-100 dark:bg-purple-900/60 p-1 mt-1 rounded select-all font-semibold">
                  ollama pull {status.modelName}
                </div>
              </div>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setShowTooltip(false);
                  onOpenSettings();
                }}
                className="mt-3 w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-center transition-colors text-xs"
              >
                Change Model / Settings
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

