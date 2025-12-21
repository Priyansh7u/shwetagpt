
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

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
                className={`prose prose-invert max-w-none text-base leading-relaxed ${
                  isUser ? 'bg-[#282a2c] text-[#e3e3e3] p-4 rounded-2xl rounded-tr-none' : 'text-[#e3e3e3]'
                }`}
              >
                {/* Simplified markdown-like rendering */}
                <p className="whitespace-pre-wrap">{part.text}</p>
              </div>
            )}
          </React.Fragment>
        ))}

        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-xs font-semibold text-[#c4c7c5] mb-2">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#282a2c] hover:bg-[#333537] px-3 py-1.5 rounded-full text-[11px] text-[#448aff] border border-[#333537] transition-all flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button>
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg></button>
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>
            <button className="p-2 hover:bg-[#282a2c] rounded-full text-[#c4c7c5] transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
