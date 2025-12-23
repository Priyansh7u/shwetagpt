
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, currentId, onSelect, onNew, onDelete, isOpen, toggleSidebar 
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-[320px] bg-[#1e1f20]/95 backdrop-blur-2xl flex flex-col h-full shrink-0 border-r border-[#282a2c] z-20 transition-all duration-300">
      <div className="p-6 flex flex-col h-full">
        <button 
          onClick={toggleSidebar}
          className="p-3 self-start mb-8 hover:bg-[#333537] rounded-2xl transition-all active:scale-90 text-[#c4c7c5]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>

        <button 
          onClick={onNew}
          className="flex items-center gap-4 bg-[#282a2c] hover:bg-[#333537] text-sm font-bold p-4 px-6 rounded-3xl transition-all mb-10 shadow-lg border border-[#333537] active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Analysis
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          <h3 className="text-[10px] font-black text-[#8e918f] px-5 py-3 uppercase tracking-[0.2em] opacity-60">History</h3>
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all text-[13px] font-medium border ${
                currentId === session.id 
                  ? 'bg-[#333537] text-white border-[#444746] shadow-md' 
                  : 'hover:bg-[#282a2c] text-[#c4c7c5] border-transparent hover:border-[#333537]'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-center gap-3 truncate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 ${currentId === session.id ? 'text-[#4285f4]' : 'text-[#8e918f]'}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="truncate max-w-[170px]">{session.title}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[#282a2c] mt-auto space-y-2">
          <button className="flex items-center gap-4 p-4 rounded-2xl text-[13px] font-semibold hover:bg-[#282a2c] w-full text-[#c4c7c5] transition-colors">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
             Help Center
          </button>
          <button className="flex items-center gap-4 p-4 rounded-2xl text-[13px] font-semibold hover:bg-[#282a2c] w-full text-[#c4c7c5] transition-colors">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
             Configuration
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
