
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Message, Role, ModelType, GeminiResponse } from '../types';
import { generateResponse, analyzeImage } from '../services/gemini';
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

    const newMessages = [...session.messages, userMessage];
    updateMessages(newMessages);
    
    const currentInput = messageText;
    const currentImg = pendingImage;
    
    setInput('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      let aiResponse: GeminiResponse;
      
      // If it's just an image with no text, we treat it as a vision request
      if (currentImg && !currentInput.trim()) {
        const analysis = await analyzeImage(currentImg, "Describe this image in detail.");
        aiResponse = { text: analysis, groundingSources: [], imageUrl: undefined };
      } else {
        // Otherwise, use the standard multi-modal response generator
        aiResponse = await generateResponse(currentInput, newMessages, selectedModel, useSearch);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        parts: [
          ...(aiResponse.imageUrl ? [{ image: aiResponse.imageUrl, isImagePrompt: true }] : []),
          ...(aiResponse.text ? [{ text: aiResponse.text }] : []),
        ],
        groundingSources: aiResponse.groundingSources || [],
        timestamp: Date.now()
      };

      updateMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      let errorText = "I encountered an error. Please try again.";
      
      if (err.message === "API_KEY_MISSING") {
        errorText = "API key is missing. Please ensure process.env.API_KEY is configured.";
      } else if (err.message === "RATE_LIMIT_EXCEEDED") {
        errorText = "Too many requests. Please slow down.";
      } else if (err.message === "MODEL_NOT_FOUND") {
        errorText = "The selected model is currently unavailable.";
      } else if (err.message) {
        errorText = `Error: ${err.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        parts: [{ text: errorText }],
        timestamp: Date.now()
      };
      updateMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
      };
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
    <div className="flex-1 flex flex-col relative overflow-hidden h-full">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-24 py-8 space-y-12"
      >
        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12 mt-10">
            <div className="text-center">
              <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-6">
                Hello, I'm Shweta GPT
              </h2>
              <p className="text-[#8e918f] text-xl font-medium">How can I help you today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {[
                { title: "Understand", desc: "Explain the concept of neural networks", icon: "🧠" },
                { title: "Create", desc: "Generate a futuristic city skyline image", icon: "🎨" },
                { title: "Optimize", desc: "Refactor a Python script for readability", icon: "⚡" },
                { title: "Draft", desc: "Write a polite follow-up email for a job", icon: "📄" }
              ].map((card, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(card.desc)}
                  className="p-6 bg-[#1e1f20] hover:bg-[#282a2c] rounded-2xl text-left border border-[#333537] transition-all group flex flex-col justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{card.title}</p>
                    <p className="text-xs text-[#c4c7c5]">{card.desc}</p>
                  </div>
                  <span className="self-end mt-4 text-2xl group-hover:scale-110 transition-transform">{card.icon}</span>
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
          <div className="flex gap-4 px-4 md:px-0 max-w-4xl mx-auto w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] shrink-0 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="h-3 bg-[#282a2c] rounded-full w-[100%] animate-pulse" />
              <div className="h-3 bg-[#282a2c] rounded-full w-[80%] animate-pulse" />
              <div className="h-3 bg-[#282a2c] rounded-full w-[60%] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:px-8 lg:px-24 pb-8 shrink-0">
        <div className="max-w-4xl mx-auto relative bg-[#1e1f20] rounded-[32px] border border-[#333537] shadow-2xl transition-all duration-200">
          {pendingImage && (
            <div className="px-5 pt-5 relative">
              <div className="relative inline-block">
                <img src={pendingImage} alt="Pending" className="w-24 h-24 object-cover rounded-2xl border-2 border-[#4285f4]" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-[#131314] text-white rounded-full p-1.5 shadow-lg border border-[#333537] hover:bg-[#282a2c] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end p-5 gap-2">
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <label className="cursor-pointer p-3 hover:bg-[#333537] rounded-full transition-colors group relative">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#c4c7c5]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
              </label>
              
              <button 
                onClick={() => setUseSearch(!useSearch)}
                title="Search grounding"
                className={`p-3 rounded-full transition-all group relative ${useSearch ? 'bg-[#4285f4]/20 text-[#4285f4]' : 'hover:bg-[#333537] text-[#c4c7c5]'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              <div className="h-8 w-[1px] bg-[#333537] mx-1"></div>

              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-[11px] font-bold text-[#c4c7c5] px-2 py-2 rounded-lg outline-none cursor-pointer hover:text-white transition-colors uppercase tracking-wider"
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
              placeholder="Enter a prompt here"
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-[#e3e3e3] placeholder-[#8e918f] text-base font-normal"
            />

            <button 
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className={`p-3 rounded-full transition-all shrink-0 ${
                (input.trim() || pendingImage) && !isLoading 
                  ? 'text-[#4285f4] hover:bg-[#4285f4]/10' 
                  : 'text-[#444746] cursor-not-allowed'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
          <p className="text-[11px] text-[#8e918f]">
            Shweta GPT may display inaccurate info, including about people, so double-check its responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
