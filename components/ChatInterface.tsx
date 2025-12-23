
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
  const [useSearch, setUseSearch] = useState(true); // Defaulting to search for higher quality "normal" answers
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.PRO);
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
        parts: [{ text: `I encountered a problem: ${err.message || "Please check your network connection and API configuration."}` }],
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
        className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-40 py-12 space-y-16 scroll-smooth"
      >
        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-16 max-w-5xl mx-auto">
            <div className="text-center animate-in fade-in zoom-in duration-1000">
              <h2 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-8 tracking-tighter">
                ShwetaGPT
              </h2>
              <p className="text-[#8e918f] text-2xl font-medium tracking-tight opacity-90">What can we build together today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {[
                { title: "Deep Research", desc: "Analyze the current state of Quantum Computing", icon: "⚛️" },
                { title: "Creative Writing", desc: "A narrative about a city built in the clouds", icon: "☁️" },
                { title: "Expert Coding", desc: "Build a high-performance Rust web server", icon: "🦀" },
                { title: "Data Insight", desc: "Trends for global markets in late 2025", icon: "📈" }
              ].map((card, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(card.desc)}
                  className="p-10 bg-[#1e1f20]/40 backdrop-blur-2xl hover:bg-[#282a2c]/60 rounded-[40px] text-left border border-[#333537] transition-all group flex items-center justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white">{card.title}</p>
                    <p className="text-sm text-[#c4c7c5] font-medium opacity-70">{card.desc}</p>
                  </div>
                  <span className="text-4xl transition-transform group-hover:scale-125 duration-500">{card.icon}</span>
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
          <div className="flex gap-6 px-4 md:px-0 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
            <div className="w-10 h-10 rounded-2xl bg-[#1e1f20] border border-[#333537] shrink-0 flex items-center justify-center shadow-lg">
               <div className="w-5 h-5 border-2 border-[#4285f4] border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-4 flex-1 pt-2">
              <div className="h-2.5 bg-[#282a2c] rounded-full w-[100%] animate-pulse" />
              <div className="h-2.5 bg-[#282a2c] rounded-full w-[85%] animate-pulse" />
              <div className="h-2.5 bg-[#282a2c] rounded-full w-[65%] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 md:px-12 lg:px-40 pb-10 shrink-0">
        <div className="max-w-5xl mx-auto relative bg-[#1e1f20]/80 backdrop-blur-[32px] rounded-[40px] border border-[#333537] shadow-2xl focus-within:ring-2 focus-within:ring-[#4285f4]/30 transition-all duration-500">
          {pendingImage && (
            <div className="px-6 pt-6 relative flex gap-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative group">
                <img src={pendingImage} alt="Pending" className="w-24 h-24 object-cover rounded-3xl border border-[#4285f4] shadow-2xl" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-2xl hover:scale-110 active:scale-90 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end p-6 gap-4">
            <div className="flex items-center gap-1.5 shrink-0 pb-1">
              <label className="cursor-pointer p-4 hover:bg-[#333537] rounded-full transition-all text-[#c4c7c5] hover:text-white active:scale-90">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
              </label>
              
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-4 rounded-full transition-all active:scale-90 ${useSearch ? 'text-[#4285f4] bg-[#4285f4]/15' : 'text-[#c4c7c5] hover:bg-[#333537]'}`}
                title="Verified Search"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              <div className="h-7 w-[1.5px] bg-[#333537] mx-2"></div>

              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-[11px] font-black text-[#8e918f] px-2 py-1 outline-none cursor-pointer hover:text-white transition-colors uppercase tracking-[0.15em]"
              >
                <option value={ModelType.PRO}>Pro Core</option>
                <option value={ModelType.FLASH}>Flash Lite</option>
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
              placeholder="Query ShwetaGPT..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 text-[#e3e3e3] placeholder-[#8e918f] text-[18px] font-medium"
            />

            <button 
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className={`p-4.5 rounded-full transition-all active:scale-95 shadow-2xl ${
                (input.trim() || pendingImage) && !isLoading 
                  ? 'bg-[#4285f4] text-white shadow-[#4285f4]/30' 
                  : 'text-[#444746] bg-[#1a1a1b]'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-center items-center gap-8 opacity-40">
           <span className="text-[10px] text-[#8e918f] uppercase tracking-[0.4em] font-bold">Encrypted End-to-End</span>
           <div className="w-1.5 h-1.5 rounded-full bg-[#333537]" />
           <span className="text-[10px] text-[#8e918f] uppercase tracking-[0.4em] font-bold">ShwetaGPT Enterprise</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
