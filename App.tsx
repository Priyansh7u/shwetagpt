import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { ChatSession, Message } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize with a default session if none exist
  useEffect(() => {
    const saved = localStorage.getItem('gemini_clone_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('gemini_clone_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
    if (sessions.length <= 1) {
      createNewSession();
    }
  };

  const updateSessionMessages = (sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        let newTitle = s.title;
        if (s.messages.length === 0 && messages.length > 0) {
          const firstMsg = messages[0].parts.find(p => p.text)?.text || 'New Chat';
          newTitle = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '');
        }
        return { ...s, messages, title: newTitle };
      }
      return s;
    }));
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#131314] text-[#e3e3e3]">
      <Sidebar 
        sessions={sessions}
        currentId={currentSessionId}
        onSelect={setCurrentSessionId}
        onNew={createNewSession}
        onDelete={deleteSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between p-4 bg-[#131314] h-16 shrink-0 border-b border-[#282a2c]">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-[#282a2c] rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
            )}
            <h1 className="text-xl font-medium text-[#c4c7c5]">ShwetaGPT</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-[#1e1f20] px-3 py-1.5 rounded-full text-xs font-medium text-[#c4c7c5] border border-[#444746]">
               Advanced
             </div>
             <img src="https://picsum.photos/seed/user123/32/32" className="w-8 h-8 rounded-full border border-[#444746]" alt="Profile" />
          </div>
        </header>

        {currentSession ? (
          <ChatInterface 
            session={currentSession}
            updateMessages={(msgs) => updateSessionMessages(currentSession.id, msgs)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#444746]">
            Select or start a new conversation
          </div>
        )}
      </main>
    </div>
  );
};

export default App;