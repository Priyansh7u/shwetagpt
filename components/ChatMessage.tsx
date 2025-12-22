
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const formatText = (text: string) => {
  if (!text) return null;

  // Split into paragraphs and code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const language = match?.[1] || 'code';
      const code = match?.[2] || part.slice(3, -3);
      
      return (
        <div key={index} className="my-6 rounded-xl overflow-hidden border border-[#333537] bg-[#0d0d0d] shadow-2xl">
          <div className="bg-[#1e1f20] px-4 py-2 text-[10px] uppercase font-bold text-[#8e918f] border-b border-[#333537] flex justify-between items-center">
            <span>{language}</span>
            <button onClick={() => navigator.clipboard.writeText(code.trim())} className="hover:text-white transition-colors">Copy</button>
          </div>
          <pre className="p-5 overflow-x-auto text-sm font-mono text-blue-200/90 leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    // Process inline formatting
    const lines = part.split('\n').map((line, lIdx) => {
      // Bold text
      const segments = line.split(/(\*\*.*?\*\*)/g).map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx} className="text-white font-bold">{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });

      // Headers
      if (line.startsWith('### ')) return <h3 key={lIdx} className="text-lg font-bold text-white mt-6 mb-2">{segments.slice(1)}</h3>;
      if (line.startsWith('## ')) return <h2 key={lIdx} className="text-xl font-bold text-white mt-8 mb-4 border-b border-[#333537] pb-2">{segments.slice(1)}</h2>;

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={lIdx} className="flex gap-3 ml-2 my-2 items-start">
            <span className="text-[#4285f4] mt-1 text-lg">•</span>
            <span className="text-[#e3e3e3]">{segments}</span>
          </div>
        );
      }

      return <p key={lIdx} className="min-h-[1.5rem] mb-2 text-[#e3e3e3] leading-relaxed">{segments}</p>;
    });

    return <div key={index}>{lines}</div>;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-5 group animate-in slide-in-from-bottom-4 duration-500 fill-mode-both ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-[#333537] shadow-lg ${isUser ? 'order-last' : 'bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#ea4335]'}`}>
        {isUser ? (
          <img src="https://picsum.photos/seed/user123/40/40" alt="U" className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.parts.map((part, i) => (
          <React.Fragment key={i}>
            {part.image && (
              <div className={`mb-4 ${isUser ? 'ml-auto' : ''}`}>
                <img 
                  src={part.image} 
                  alt="Content" 
                  className="rounded-2xl max-w-md w-full border border-[#333537] shadow-2xl hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
            )}
            {part.text && (
              <div 
                className={`text-[16px] w-full ${
                  isUser 
                    ? 'bg-[#2f2f2f] text-white px-5 py-3 rounded-3xl rounded-tr-none shadow-md' 
                    : 'text-[#e3e3e3] whitespace-pre-wrap'
                }`}
              >
                {formatText(part.text)}
              </div>
            )}
          </React.Fragment>
        ))}

        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-8 w-full bg-[#1e1f20]/30 p-4 rounded-2xl border border-[#333537]">
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e918f" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span className="text-[10px] font-bold text-[#8e918f] uppercase tracking-widest">Verified Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#131314] hover:bg-[#282a2c] px-3 py-1.5 rounded-lg text-[11px] text-[#4285f4] border border-[#333537] transition-all flex items-center gap-2"
                >
                  <span className="truncate max-w-[200px]">{source.title}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {['👍', '👎', '📋', '🔄'].map((emoji, idx) => (
              <button key={idx} className="p-2 hover:bg-[#282a2c] rounded-lg text-[#c4c7c5] transition-colors text-sm">{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
