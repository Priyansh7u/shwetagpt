
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { ChatSession, Message } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('shwetagpt_sessions_v1');
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
      localStorage.setItem('shwetagpt_sessions_v1', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Initial Query',
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
          const firstMsg = messages[0].parts.find(p => p.text)?.text || 'New Analysis';
          newTitle = firstMsg.slice(0, 35) + (firstMsg.length > 35 ? '...' : '');
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
        <header className="flex items-center justify-between px-8 bg-[#131314] h-20 shrink-0 border-b border-[#282a2c]/50">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 hover:bg-[#282a2c] rounded-2xl transition-all active:scale-95"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white tracking-tight">ShwetaGPT</h1>
              <span className="text-[10px] text-[#4285f4] font-black uppercase tracking-[0.2em]">Titan Model v3</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
             <div className="hidden md:flex bg-[#1e1f20] px-4 py-2 rounded-2xl text-[10px] font-black text-[#8e918f] border border-[#333537] items-center gap-2 uppercase tracking-wider">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Operational
             </div>
             <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=user`} className="w-10 h-10 rounded-2xl border border-[#333537] p-1 shadow-lg" alt="Profile" />
          </div>
        </header>

        {currentSession ? (
          <ChatInterface 
            session={currentSession}
            updateMessages={(msgs) => updateSessionMessages(currentSession.id, msgs)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#444746] animate-pulse">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            <p className="text-sm uppercase tracking-[0.5em] font-bold">Select Interface</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
