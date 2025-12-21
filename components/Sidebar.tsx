
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
    <aside className="w-[300px] bg-[#1e1f20] flex flex-col h-full shrink-0 border-r border-[#282a2c] z-20 transition-all duration-300">
      <div className="p-4 flex flex-col h-full">
        <button 
          onClick={toggleSidebar}
          className="p-2 self-start mb-6 hover:bg-[#282a2c] rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>

        <button 
          onClick={onNew}
          className="flex items-center gap-3 bg-[#282a2c] hover:bg-[#333537] text-sm font-medium p-3 px-4 rounded-full transition-all mb-8"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          New chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <h3 className="text-xs font-semibold text-[#c4c7c5] px-4 py-2 uppercase tracking-wider">Recent</h3>
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-full cursor-pointer transition-colors text-sm ${
                currentId === session.id ? 'bg-[#333537] text-white' : 'hover:bg-[#282a2c] text-[#c4c7c5]'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <div className="flex items-center gap-3 truncate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="truncate max-w-[160px]">{session.title}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#444746] rounded-full transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#282a2c] mt-auto space-y-1">
          <button className="flex items-center gap-3 p-3 px-4 rounded-full text-sm font-medium hover:bg-[#282a2c] w-full text-[#c4c7c5]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
             Help
          </button>
          <button className="flex items-center gap-3 p-3 px-4 rounded-full text-sm font-medium hover:bg-[#282a2c] w-full text-[#c4c7c5]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
             Activity
          </button>
          <button className="flex items-center gap-3 p-3 px-4 rounded-full text-sm font-medium hover:bg-[#282a2c] w-full text-[#c4c7c5]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
             Settings
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
