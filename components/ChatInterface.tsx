
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
  const [useSearch, setUseSearch] = useState(false);
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
        const analysis = await analyzeImage(currentImg, "Describe this concisely.");
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: Role.ASSISTANT,
          parts: [{ text: analysis }],
          timestamp: Date.now()
        };
        updateMessages([...updatedHistory, assistantMessage]);
      } else {
        // Prepare assistant message for streaming
        const assistantId = (Date.now() + 1).toString();
        let streamingText = "";
        let sources: GroundingSource[] = [];

        // Initial empty message to show the loading bubble
        const initialAssistantMsg: Message = {
          id: assistantId,
          role: Role.ASSISTANT,
          parts: [{ text: "" }],
          timestamp: Date.now()
        };
        
        const stream = generateStreamingResponse(currentInput, updatedHistory, selectedModel, useSearch);
        
        let firstChunk = true;
        for await (const chunk of stream) {
          if (firstChunk) {
            setIsLoading(false); // Stop showing general loader once text starts
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
        parts: [{ text: `Error: ${err.message || "Failed to generate response"}` }],
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#131314]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-24 py-8 space-y-12 scroll-smooth"
      >
        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12">
            <div className="text-center animate-in fade-in zoom-in duration-700">
              <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-6">
                Shweta GPT
              </h2>
              <p className="text-[#8e918f] text-xl font-medium">Powering the next generation of intelligence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {[
                { title: "Quantum Computing", desc: "Explain it in simple terms", icon: "⚛️" },
                { title: "Creative Writing", desc: "Write a poem about neon rain", icon: "✍️" },
                { title: "Bug Hunting", desc: "Refactor this complex React hook", icon: "🐛" },
                { title: "Trip Planner", desc: "7-day itinerary for Kyoto", icon: "🗺️" }
              ].map((card, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(card.desc)}
                  className="p-6 bg-[#1e1f20]/50 backdrop-blur-md hover:bg-[#282a2c] rounded-2xl text-left border border-[#333537] transition-all group flex flex-col justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{card.title}</p>
                    <p className="text-xs text-[#c4c7c5]">{card.desc}</p>
                  </div>
                  <span className="self-end mt-4 text-2xl group-hover:scale-110 transition-transform opacity-50 group-hover:opacity-100">{card.icon}</span>
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
          <div className="flex gap-4 px-4 md:px-0 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] shrink-0 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="h-3 bg-[#282a2c] rounded-full w-[100%] animate-pulse" />
              <div className="h-3 bg-[#282a2c] rounded-full w-[80%] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:px-8 lg:px-24 pb-8 shrink-0">
        <div className="max-w-4xl mx-auto relative bg-[#1e1f20]/80 backdrop-blur-xl rounded-[32px] border border-[#333537] shadow-2xl focus-within:border-[#4285f4]/50 transition-all duration-300">
          {pendingImage && (
            <div className="px-5 pt-5 relative flex gap-3 animate-in fade-in slide-in-from-left-2">
              <div className="relative group">
                <img src={pendingImage} alt="Pending" className="w-20 h-20 object-cover rounded-xl border border-[#4285f4]" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end p-5 gap-2">
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <label className="cursor-pointer p-3 hover:bg-[#333537] rounded-full transition-colors text-[#c4c7c5] hover:text-white">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
              </label>
              
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-3 rounded-full transition-all ${useSearch ? 'bg-[#4285f4]/20 text-[#4285f4]' : 'text-[#c4c7c5] hover:bg-[#333537]'}`}
                title="Google Search Grounding"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              <div className="h-6 w-[1px] bg-[#333537] mx-2"></div>

              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-[10px] font-bold text-[#8e918f] uppercase tracking-tighter outline-none cursor-pointer hover:text-white"
              >
                <option value={ModelType.FLASH}>Flash v3</option>
                <option value={ModelType.PRO}>Pro v3 (Reasoning)</option>
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
              placeholder="Ask Shweta anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-[#e3e3e3] placeholder-[#8e918f] text-base"
            />

            <button 
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className={`p-3 rounded-full transition-all ${
                (input.trim() || pendingImage) && !isLoading 
                  ? 'bg-[#4285f4] text-white shadow-lg shadow-[#4285f4]/20' 
                  : 'text-[#444746]'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[#8e918f] text-center mt-4 uppercase tracking-widest opacity-50">
          Shweta GPT: Advanced Intelligence for Professionals
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
