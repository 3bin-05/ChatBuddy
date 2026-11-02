import React, { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const {
    conversations,
    activeId,
    activeConversation,
    messages,
    isGenerating,
    error,
    settings,
    connectionStatus,
    sendMessage,
    stopGeneration,
    selectConversation,
    startNewConversation,
    removeConversation,
    clearAll,
    updateSettings,
    checkHealth,
  } = useChat();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Manage Dark / Light / System Theme on <html>
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const listener = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar with history and status */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={selectConversation}
        onNewChat={startNewConversation}
        onDeleteConversation={removeConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        connectionStatus={connectionStatus}
        onRefreshHealth={() => checkHealth()}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        maxConversations={5}
      />

      {/* Main Chat Interface */}
      <ChatWindow
        messages={messages}
        activeTitle={activeConversation?.title}
        isGenerating={isGenerating}
        error={error}
        connectionStatus={connectionStatus}
        onSendMessage={sendMessage}
        onStopGeneration={stopGeneration}
        onNewChat={startNewConversation}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onRefreshHealth={() => checkHealth()}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        availableModels={connectionStatus.availableModels}
        onSave={(updated) => {
          updateSettings(updated);
          if (updated.model && updated.model !== settings.model) {
            checkHealth(updated.model);
          }
        }}
        onClearAllConversations={clearAll}
      />
    </div>
  );
};

export default App;
