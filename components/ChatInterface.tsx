
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Message, Role, ModelType, GroundingSource } from '../types';
import { generateStreamingResponse, analyzeImage } from '../services/gemini';
import ChatMessage from './ChatMessage';

interface ChatInterfaceProps {
  session: ChatSession;
  updateMessages: (messages: Message[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, updateMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false); // Defaulting search to off for a faster "normal" chat experience
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [session.messages, isLoading]);

  const handleSendMessage = async (customInput?: string) => {
    const messageText = customInput || input;
    if (!messageText.trim() && !pendingImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      parts: [
        ...(messageText.trim() ? [{ text: messageText.trim() }] : []),
        ...(pendingImage ? [{ image: pendingImage }] : [])
      ],
      timestamp: Date.now()
    };

    const updatedHistory = [...session.messages, userMessage];
    updateMessages(updatedHistory);
    
    const currentInput = messageText;
    const currentImg = pendingImage;
    
    setInput('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      if (currentImg && !currentInput.trim()) {
        const analysis = await analyzeImage(currentImg, "What's in this image?");
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: Role.ASSISTANT,
          parts: [{ text: analysis }],
          timestamp: Date.now()
        };
        updateMessages([...updatedHistory, assistantMessage]);
      } else {
        const assistantId = (Date.now() + 1).toString();
        let streamingText = "";
        let sources: GroundingSource[] = [];

        const stream = generateStreamingResponse(currentInput, updatedHistory, selectedModel, useSearch);
        
        let firstChunk = true;
        for await (const chunk of stream) {
          if (firstChunk) {
            setIsLoading(false);
            firstChunk = false;
          }
          
          streamingText += chunk.text;
          if (chunk.sources.length > 0) {
            sources = [...new Set([...sources, ...chunk.sources])];
          }

          const updatedAssistantMsg: Message = {
            id: assistantId,
            role: Role.ASSISTANT,
            parts: [{ text: streamingText }],
            groundingSources: sources,
            timestamp: Date.now()
          };

          updateMessages([...updatedHistory, updatedAssistantMsg]);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        parts: [{ text: `Oops, I ran into a bit of trouble: ${err.message || "Something went wrong."}` }],
        timestamp: Date.now()
      };
      updateMessages([...updatedHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPendingImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 240)}px`;
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#131314]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-32 py-10 space-y-14 scroll-smooth"
      >
        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-14 max-w-5xl mx-auto">
            <div className="text-center animate-in fade-in zoom-in duration-700">
              <h2 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-6 tracking-tight">
                ShwetaGPT
              </h2>
              <p className="text-[#8e918f] text-2xl font-medium tracking-wide">Hi! How can I help you today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              {[
                { title: "Plan a trip", desc: "Best spots for a weekend in Paris", icon: "✈️" },
                { title: "Get creative", desc: "Write a short story about a time traveler", icon: "🎭" },
                { title: "Help me code", desc: "Explain how to use React hooks", icon: "💻" },
                { title: "Image Search", desc: "Describe this image for me", icon: "📸" }
              ].map((card, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(card.desc)}
                  className="p-8 bg-[#1e1f20]/60 backdrop-blur-xl hover:bg-[#282a2c] rounded-[32px] text-left border border-[#333537] transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-white">{card.title}</p>
                    <p className="text-sm text-[#c4c7c5]">{card.desc}</p>
                  </div>
                  <span className="text-3xl transition-transform group-hover:scale-110">{card.icon}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          session.messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        {isLoading && (
          <div className="flex gap-6 px-4 md:px-0 max-w-4xl mx-auto w-full">
            <div className="w-10 h-10 rounded-2xl bg-[#1e1f20] border border-[#333537] shrink-0 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-[#4285f4] border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-3 flex-1 pt-2">
              <div className="h-2 bg-[#282a2c] rounded-full w-[100%] animate-pulse" />
              <div className="h-2 bg-[#282a2c] rounded-full w-[80%] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 md:px-12 lg:px-32 pb-10 shrink-0">
        <div className="max-w-5xl mx-auto relative bg-[#1e1f20]/90 backdrop-blur-[20px] rounded-[32px] border border-[#333537] shadow-2xl focus-within:border-[#4285f4]/50 transition-all duration-300">
          {pendingImage && (
            <div className="px-6 pt-6 relative flex gap-4">
              <div className="relative group">
                <img src={pendingImage} alt="Pending" className="w-20 h-20 object-cover rounded-2xl border border-[#4285f4]" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-[#131314] text-white rounded-full p-1.5 shadow-xl border border-[#333537] hover:bg-[#282a2c] transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end p-5 gap-3">
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <label className="cursor-pointer p-3 hover:bg-[#333537] rounded-full transition-all text-[#c4c7c5] hover:text-white">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
              </label>
              
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-3 rounded-full transition-all ${useSearch ? 'text-[#4285f4] bg-[#4285f4]/10' : 'text-[#c4c7c5] hover:bg-[#333537]'}`}
                title="Search grounding"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              <div className="h-6 w-[1px] bg-[#333537] mx-1"></div>

              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-[11px] font-bold text-[#8e918f] px-2 py-1 outline-none cursor-pointer hover:text-white transition-colors uppercase tracking-widest"
              >
                <option value={ModelType.FLASH}>Flash</option>
                <option value={ModelType.PRO}>Pro</option>
              </select>
            </div>

            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-[#e3e3e3] placeholder-[#8e918f] text-[17px]"
            />

            <button 
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className={`p-3.5 rounded-full transition-all ${
                (input.trim() || pendingImage) && !isLoading 
                  ? 'bg-[#4285f4] text-white shadow-xl shadow-[#4285f4]/20' 
                  : 'text-[#444746] bg-[#1a1a1b]'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[#8e918f] text-center mt-5 opacity-50">
          ShwetaGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
