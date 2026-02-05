import React, { useState, useEffect, useRef } from 'react';
import { Message, ResponseMode } from '../types';

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (text: string, mode: ResponseMode) => void;
  onInputFocus: (focused: boolean) => void;
  isThinking: boolean;
}

const SUGGESTIONS = [
    "Identify Doe 36 in documents",
    "Prince Andrew puppet testimony details",
    "Flight log entries for Feb 2002",
    "Johanna Sjoberg deposition summary",
    "Zorro Ranch allegations (Farmer)",
    "List of properties used for recruitment",
];

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, onInputFocus, isThinking }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSend('brief');
  };

  const triggerSend = (mode: ResponseMode) => {
      if (input.trim()) {
        onSendMessage(input, mode);
        setInput('');
      }
  };

  const handleSuggestion = (text: string) => {
      if (text.trim()) {
        onSendMessage(text, 'detailed'); 
      }
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full max-w-4xl mx-auto relative">
        <div className="absolute -top-6 left-0 bg-[#1a1a1a] text-[#888] px-6 py-1 rounded-t-md font-typewriter text-xs border-t border-l border-r border-[#333]">
            $EFAGENT_TERMINAL_v4.2
        </div>

        <div className="flex flex-col h-full bg-[#121212] border border-[#333] shadow-lg rounded-tr-md rounded-b-md relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#333] z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border border-red-900 ${isThinking ? 'bg-red-500 animate-blink-red' : 'bg-green-900'}`}></div>
                        <span className="text-xs font-typewriter tracking-widest text-evidence-red whitespace-nowrap uppercase">
                            {isThinking ? 'ANALYZING RECORDS...' : 'DATABASE SYNCED'}
                        </span>
                    </div>
                    <span className="text-[#333] hidden sm:inline">|</span>
                    <span className="text-[10px] font-mono text-[#666] hidden sm:inline tracking-wider">
                        UNSEALED_FILES_2024_LOADED
                    </span>
                </div>
                <div className="text-[10px] font-typewriter text-[#444] uppercase hidden md:block">
                   FORENSIC ACCESS GRANTED
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-typewriter text-sm scrollbar-thin scrollbar-thumb-red-900/30 scrollbar-track-transparent">
                {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${msg.role === 'user' ? 'animate-fade-in-up' : 'opacity-100'}`}
                >
                    <div className="max-w-[90%]">
                        <div className={`p-4 text-sm relative border whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-[#1a1a1a] text-gray-400 border-[#333] font-mono' 
                            : 'bg-[#080505] text-gray-300 border-red-900/40 border-l-2 shadow-[0_0_15px_rgba(255,0,0,0.05)] font-typewriter'
                        }`}>
                             {msg.role === 'assistant' && (
                                 <div className="absolute top-0 left-0 w-full h-[1px] bg-red-900/20"></div>
                             )}
                             {msg.text}
                        </div>
                    </div>
                </div>
                ))}
                {isThinking && (
                <div className="flex justify-start pl-0 animate-pulse">
                    <span className="text-xs text-evidence-red font-mono bg-black px-2 py-1">
                        {'>'} CROSS-REFERENCING DEPOSITIONS...
                    </span>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="px-4 pb-2 bg-[#0f0f0f] border-t border-[#333] flex gap-2 overflow-x-auto no-scrollbar pt-2">
                {SUGGESTIONS.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        disabled={isThinking}
                        className="whitespace-nowrap px-3 py-1 bg-[#151515] border border-[#333] text-[#666] text-[10px] font-typewriter hover:bg-[#222] hover:text-evidence-red hover:border-red-900 transition-colors uppercase"
                    >
                        {s}
                    </button>
                ))}
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 bg-[#080808] flex items-center gap-3 relative border-t border-[#333]">
                <div className="flex-1 relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-evidence-red font-mono mr-2">{'>'}</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => onInputFocus(true)}
                        onBlur={() => onInputFocus(false)}
                        placeholder={"SEARCH FILES (NAME, DATE, DOE #)..."}
                        className="w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-700 font-typewriter text-sm tracking-wide pl-4 caret-red-500"
                        autoComplete="off"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => triggerSend('brief')}
                        disabled={!input.trim() || isThinking}
                        className="px-4 py-2 text-[10px] font-stamped text-gray-400 border border-[#333] bg-[#111] hover:bg-[#222] hover:text-white disabled:opacity-30 transition-colors uppercase tracking-wider"
                    >
                        SCAN
                    </button>

                    <button
                        type="button"
                        onClick={() => triggerSend('detailed')}
                        disabled={!input.trim() || isThinking}
                        className="px-4 py-2 text-[10px] font-stamped text-black bg-evidence-red hover:bg-red-600 disabled:opacity-30 transition-colors uppercase tracking-wider font-bold"
                    >
                        REPORT
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default ChatBox;