
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
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
      const segments = line.split(/(\*\*.*?\*\*)/g).map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx} className="text-white font-semibold">{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });

      if (line.startsWith('### ')) return <h3 key={lIdx} className="text-xl font-bold text-white mt-8 mb-4">{segments.slice(1)}</h3>;
      if (line.startsWith('## ')) return <h2 key={lIdx} className="text-2xl font-bold text-white mt-10 mb-6 border-b border-[#333537] pb-3">{segments.slice(1)}</h2>;

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={lIdx} className="flex gap-4 ml-2 my-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4285f4] mt-2.5 shrink-0" />
            <span className="text-[#e3e3e3] text-[16px] leading-[1.8]">{segments}</span>
          </div>
        );
      }

      return line.trim() === '' ? <div key={lIdx} className="h-4" /> : <p key={lIdx} className="mb-5 text-[#e3e3e3] text-[16px] leading-[1.8]">{segments}</p>;
    });

    return <div key={index}>{lines}</div>;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-6 group animate-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border border-[#333537] shadow-xl ${isUser ? 'order-last bg-[#2f2f2f]' : 'bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#ea4335]'}`}>
        {isUser ? (
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.id}`} alt="U" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.parts.map((part, i) => (
          <React.Fragment key={i}>
            {part.image && (
              <div className={`mb-6 rounded-3xl overflow-hidden border border-[#333537] shadow-2xl transition-all hover:scale-[1.01] ${isUser ? 'ml-auto' : ''}`}>
                <img src={part.image} alt="Content" className="max-w-md w-full" />
              </div>
            )}
            {part.text && (
              <div 
                className={`w-full transition-all duration-300 ${
                  isUser 
                    ? 'bg-[#2f2f2f]/80 backdrop-blur-md text-white px-6 py-4 rounded-3xl rounded-tr-none border border-[#444746] shadow-lg' 
                    : 'text-[#e3e3e3] px-2'
                }`}
              >
                {formatText(part.text)}
              </div>
            )}
          </React.Fragment>
        ))}

        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-8 w-full bg-[#1e1f20]/40 backdrop-blur-xl p-6 rounded-[28px] border border-[#333537] shadow-inner">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-[#4285f4]/10 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <span className="text-[11px] font-bold text-[#8e918f] uppercase tracking-[0.2em]">Verified Sources</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#131314]/80 hover:bg-[#282a2c] px-4 py-3.5 rounded-2xl text-[12px] text-[#4285f4] border border-[#333537] transition-all flex items-center justify-between group/link"
                >
                  <span className="truncate pr-3 font-medium">{source.title}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-2 mt-5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            {['👍', '👎', '📋', '🔄'].map((emoji, idx) => (
              <button key={idx} className="p-2.5 hover:bg-[#282a2c] rounded-xl text-[#8e918f] hover:text-white transition-colors">{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
