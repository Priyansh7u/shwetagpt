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

  const handleSendMessage = async () => {
    if (!input.trim() && !pendingImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      parts: [
        { text: input },
        ...(pendingImage ? [{ image: pendingImage }] : [])
      ],
      timestamp: Date.now()
    };

    const newMessages = [...session.messages, userMessage];
    updateMessages(newMessages);
    const currentInput = input;
    const currentImg = pendingImage;
    
    setInput('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      let aiResponse: GeminiResponse;
      if (currentImg && !currentInput) {
        const analysis = await analyzeImage(currentImg, "Describe this image.");
        aiResponse = { text: analysis, groundingSources: [], imageUrl: undefined };
      } else {
        aiResponse = await generateResponse(currentInput, newMessages, selectedModel, useSearch);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        parts: [
          ...(aiResponse.text ? [{ text: aiResponse.text }] : []),
          ...(aiResponse.imageUrl ? [{ image: aiResponse.imageUrl, isImagePrompt: true }] : [])
        ],
        groundingSources: aiResponse.groundingSources || [],
        timestamp: Date.now()
      };

      updateMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      let errorText = "An error occurred while connecting to Gemini. Please check your environment configuration.";
      
      if (err.message === "API_KEY_MISSING") {
        errorText = "Missing Gemini API Key. Please add 'API_KEY' to your Vercel project environment variables.";
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
          <div className="h-full flex flex-col items-center justify-center space-y-8 mt-20">
            <h2 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-blue-400 via-purple-500 to-red-400 bg-clip-text text-transparent text-center">
              Gemini Hackathon Project
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
              {[
                { title: "Debug Code", desc: "Help me find the bug in this React component", icon: "💻" },
                { title: "Generate Image", desc: "Create an image of a neon cyberpunk city", icon: "🎨" },
                { title: "Analyze Docs", desc: "Summarize the key points of this documentation", icon: "📚" },
                { title: "Logic Puzzle", desc: "Solve this complex reasoning problem", icon: "🧩" }
              ].map((card, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(card.desc)}
                  className="p-5 bg-[#1e1f20] hover:bg-[#282a2c] rounded-xl text-left border border-[#333537] transition-all group"
                >
                  <p className="text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-xs text-[#c4c7c5] line-clamp-2">{card.desc}</p>
                  <span className="block mt-4 text-xl opacity-0 group-hover:opacity-100 transition-opacity">{card.icon}</span>
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
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-600 shrink-0" />
            <div className="space-y-2 flex-1 max-w-[80%]">
              <div className="h-4 bg-[#282a2c] rounded w-[90%]" />
              <div className="h-4 bg-[#282a2c] rounded w-[70%]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:px-8 lg:px-24 pb-8 shrink-0">
        <div className="max-w-4xl mx-auto relative bg-[#1e1f20] rounded-[2rem] border border-[#333537] shadow-xl">
          {pendingImage && (
            <div className="px-4 pt-4 relative">
              <div className="relative inline-block">
                <img src={pendingImage} alt="Pending" className="w-20 h-20 object-cover rounded-lg border border-[#333537]" />
                <button 
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 bg-[#131314] text-white rounded-full p-1 border border-[#333537] hover:bg-red-900"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end p-4 gap-2">
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <label className="cursor-pointer p-2 hover:bg-[#282a2c] rounded-full transition-colors group relative">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#c4c7c5]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#282a2c] text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Upload Image</span>
              </label>
              
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-2 rounded-full transition-colors group relative ${useSearch ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-[#282a2c] text-[#c4c7c5]'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#282a2c] text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Search Grounding</span>
              </button>

              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-transparent text-xs text-[#c4c7c5] hover:bg-[#282a2c] p-1.5 rounded-lg outline-none cursor-pointer"
              >
                <option value={ModelType.FLASH} className="bg-[#1e1f20]">Flash 3.0</option>
                <option value={ModelType.PRO} className="bg-[#1e1f20]">Pro 3.0</option>
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
              placeholder="Ask Gemini anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-[#e3e3e3] placeholder-[#8e918f] text-base"
            />

            <button 
              onClick={handleSendMessage}
              disabled={(!input.trim() && !pendingImage) || isLoading}
              className={`p-2 rounded-full transition-all shrink-0 pb-1 ${
                (input.trim() || pendingImage) && !isLoading 
                  ? 'text-blue-400 hover:bg-blue-400/10' 
                  : 'text-[#444746] cursor-not-allowed'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[#8e918f] text-center mt-3">
          Gemini can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;