
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const formatText = (text: string) => {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const language = match?.[1] || 'code';
      const code = match?.[2] || part.slice(3, -3);
      
      return (
        <div key={index} className="my-6 rounded-2xl overflow-hidden border border-[#333537] bg-[#0d0d0d] shadow-2xl group/code">
          <div className="bg-[#1e1f20] px-5 py-2.5 text-[11px] uppercase font-bold text-[#8e918f] border-b border-[#333537] flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4285f4]" />
              {language}
            </span>
            <button 
              onClick={() => navigator.clipboard.writeText(code.trim())} 
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              Copy
            </button>
          </div>
          <pre className="p-6 overflow-x-auto text-[14px] font-mono leading-relaxed text-[#c4c7c5]">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    const lines = part.split('\n').map((line, lIdx) => {
      // Bold text processing
      const segments = line.split(/(\*\*.*?\*\*)/g).map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx} className="text-white font-bold">{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });

      // Headers
      if (line.startsWith('### ')) return <h3 key={lIdx} className="text-xl font-bold text-white mt-6 mb-3">{segments.slice(1)}</h3>;
      if (line.startsWith('## ')) return <h2 key={lIdx} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-[#333537] pb-2">{segments.slice(1)}</h2>;

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={lIdx} className="flex gap-4 ml-2 my-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4285f4] mt-2.5 shrink-0" />
            <span className="text-[#e3e3e3] text-[16px] leading-[1.7]">{segments}</span>
          </div>
        );
      }

      // Paragraphs
      return line.trim() === '' ? <div key={lIdx} className="h-4" /> : <p key={lIdx} className="mb-4 text-[#e3e3e3] text-[16px] leading-[1.7]">{segments}</p>;
    });

    return <div key={index}>{lines}</div>;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-6 group animate-in slide-in-from-bottom-2 duration-500 fill-mode-both ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border border-[#333537] shadow-lg ${isUser ? 'order-last bg-[#2f2f2f]' : 'bg-gradient-to-br from-[#4285f4] to-[#9b72cb]'}`}>
        {isUser ? (
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.id}`} alt="U" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        )}
      </div>

      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.parts.map((part, i) => (
          <React.Fragment key={i}>
            {part.image && (
              <div className={`mb-4 rounded-2xl overflow-hidden border border-[#333537] shadow-xl ${isUser ? 'ml-auto' : ''}`}>
                <img src={part.image} alt="Content" className="max-w-md w-full" />
              </div>
            )}
            {part.text && (
              <div 
                className={`w-full ${
                  isUser 
                    ? 'bg-[#2f2f2f] text-white px-6 py-3.5 rounded-[28px] rounded-tr-none shadow-md border border-[#444746]' 
                    : 'text-[#e3e3e3] px-2'
                }`}
              >
                {formatText(part.text)}
              </div>
            )}
          </React.Fragment>
        ))}

        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-8 w-full bg-[#1e1f20]/50 backdrop-blur-md p-6 rounded-[24px] border border-[#333537]">
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e918f" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span className="text-[10px] font-bold text-[#8e918f] uppercase tracking-widest">Sources</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#131314] hover:bg-[#282a2c] px-4 py-3 rounded-xl text-[12px] text-[#4285f4] border border-[#333537] transition-all flex items-center justify-between group/link"
                >
                  <span className="truncate pr-2">{source.title}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {['👍', '👎', '📋', '🔄'].map((emoji, idx) => (
              <button key={idx} className="p-2 hover:bg-[#282a2c] rounded-xl text-[#8e918f] hover:text-white transition-colors">{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
