
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const formatText = (text: string) => {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const codeMatch = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const language = codeMatch?.[1] || '';
      const code = codeMatch?.[2] || part.slice(3, -3);
      return (
        <div key={index} className="my-4 rounded-lg overflow-hidden border border-[#333537] bg-[#0d0d0d]">
          {language && (
            <div className="bg-[#282a2c] px-4 py-1.5 text-[10px] uppercase font-bold text-[#8e918f] border-b border-[#333537]">
              {language}
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-300">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    // Process inline formatting (bolding, lists)
    let formatted = part;
    
    // Process bolding
    const lines = formatted.split('\n').map((line, lIdx) => {
      // Basic bolding **text**
      const segments = line.split(/(\*\*.*?\*\*)/g).map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={sIdx} className="text-white font-bold">{seg.slice(2, -2)}</strong>;
        }
        return seg;
      });

      // Simple List Check
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <div key={lIdx} className="flex gap-2 ml-2 my-1">
          <span className="text-blue-400">•</span>
          <span>{segments}</span>
        </div>;
      }

      return <p key={lIdx} className="min-h-[1.5rem]">{segments}</p>;
    });

    return <div key={index}>{lines}</div>;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-4 group ${isUser ? 'flex-row-reverse items-start' : 'flex-row items-start'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-[#333537] ${isUser ? 'order-last' : ''}`}>
        {isUser ? (
          <img src="https://picsum.photos/seed/user123/32/32" alt="U" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#ea4335] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </div>
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.parts.map((part, i) => (
          <React.Fragment key={i}>
            {part.image && (
              <div className={`mb-3 ${isUser ? 'ml-auto' : ''}`}>
                <img 
                  src={part.image} 
                  alt="Message content" 
                  className={`rounded-2xl max-w-sm w-full border border-[#333537] shadow-lg ${part.isImagePrompt ? 'aspect-square object-cover' : 'object-contain'}`}
                />
              </div>
            )}
            {part.text && (
              <div 
                className={`max-w-none text-[15px] leading-relaxed tracking-wide ${
                  isUser ? 'bg-[#2f2f2f] text-[#e3e3e3] p-4 rounded-2xl rounded-tr-none' : 'text-[#e3e3e3] space-y-1'
                }`}
              >
                {formatText(part.text)}
              </div>
            )}
          </React.Fragment>
        ))}

        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px bg-[#333537] flex-1"></div>
              <span className="text-[10px] font-bold text-[#8e918f] uppercase tracking-widest px-2">Grounding Sources</span>
              <div className="h-px bg-[#333537] flex-1"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e1f20] hover:bg-[#282a2c] px-4 py-2 rounded-xl text-[11px] text-[#448aff] border border-[#333537] transition-all flex items-center gap-2 shadow-sm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  <span className="truncate max-w-[150px]">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button>
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg></button>
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
