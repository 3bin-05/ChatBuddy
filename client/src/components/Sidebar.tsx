import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Conversation, ConnectionStatusState } from '../types/chat';
import { ConnectionStatus } from './ConnectionStatus';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  connectionStatus: ConnectionStatusState;
  onRefreshHealth: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isDesktopCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  maxConversations: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenSettings,
  connectionStatus,
  onRefreshHealth,
  isMobileOpen,
  onCloseMobile,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  maxConversations,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-gray-50/90 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isDesktopCollapsed ? 'lg:w-18' : 'lg:w-72'}`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/60 dark:border-gray-800/60">
          {!isDesktopCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                  ChatBuddy
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    Local
                  </span>
                </span>
                <span className="text-[11px] text-gray-400">Qwen AI Assistant</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleDesktopCollapse}
            className="hidden lg:flex p-1.5 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isDesktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-2xl border border-purple-200/80 dark:border-purple-800/40 bg-white dark:bg-gray-800/80 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium text-xs shadow-xs hover:border-purple-400 transition-all ${
              isDesktopCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Start a new chat (Max 5 stored)"
          >
            <Plus className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
            {!isDesktopCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {!isDesktopCollapsed && (
            <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <span>Recent Conversations</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  conversations.length >= maxConversations
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
                title="Application stores a maximum of 5 conversations locally"
              >
                {conversations.length} / {maxConversations}
              </span>
            </div>
          )}

          {conversations.length === 0 ? (
            !isDesktopCollapsed && (
              <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                No conversations yet. Start a new chat!
              </div>
            )
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isConfirming = deleteConfirmId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center gap-2.5 py-2.5 px-3 rounded-2xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-purple-100/70 dark:bg-purple-950/50 text-purple-900 dark:text-purple-100 font-medium border border-purple-200/80 dark:border-purple-800/60'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                  } ${isDesktopCollapsed ? 'justify-center px-0' : ''}`}
                  title={conv.title}
                >
                  <MessageSquare
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                    }`}
                  />

                  {!isDesktopCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="truncate leading-tight">{conv.title}</p>
                      </div>

                      {/* Delete Action & Confirmation */}
                      {isConfirming ? (
                        <div
                          className="flex items-center gap-1 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => confirmDelete(e, conv.id)}
                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold px-1.5"
                            title="Confirm delete"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={cancelDelete}
                            className="p-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px]"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, conv.id)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Section: Connection & Settings */}
        <div className="p-3 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
          {!isDesktopCollapsed ? (
            <>
              <ConnectionStatus
                status={connectionStatus}
                onRefresh={onRefreshHealth}
                onOpenSettings={onOpenSettings}
              />

              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </span>
                <span className="text-[10px] font-mono text-gray-400">v1.0</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
