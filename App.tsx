import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import MatrixBackground from './components/MatrixBackground';
import { generateResponse } from './services/geminiService';
import { Message, ResponseMode } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: "ACCESS GRANTED. SYSTEM ONLINE.\n\nI am the EPSTEIN FILES AGENT ($EFAGENT). I have indexed the unsealed 2024 court documents, flight logs, and witness depositions.\n\nTYPE 'HELP' FOR DIRECTORY OR SEARCH A NAME (e.g., 'Doe 36', 'Bill Richardson').",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = async (text: string, mode: ResponseMode) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsThinking(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const { text: responseText, sources } = await generateResponse(text, history, mode);
      
      const newAiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: responseText, 
        timestamp: new Date(),
        sources: sources 
      };

      setMessages(prev => [...prev, newAiMsg]);
      setIsThinking(false);
    } catch (error) {
      console.error(error);
      setIsThinking(false);
      const errorMsg: Message = {
         id: Date.now().toString(),
         role: 'assistant',
         text: "ERROR: DATA STREAM DISRUPTED. ARCHIVE TEMPORARILY OFFLINE.",
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-gray-200 font-sans overflow-hidden flex flex-col items-center">
      
      {/* Background Data Stream */}
      <MatrixBackground />
      
      {/* Main Container */}
      <main className="relative z-30 w-full max-w-5xl h-screen flex flex-col py-6 px-4">
        
        {/* Forensic Header */}
        <div className="flex-none flex flex-col items-center justify-center mb-10">
            <div className="border border-evidence-red/40 bg-black/60 backdrop-blur-sm px-10 py-5 shadow-[0_0_40px_rgba(255,31,31,0.1)] relative">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-evidence-red"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-evidence-red"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-evidence-red"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-evidence-red"></div>

                <div className="flex items-center gap-4 mb-1">
                   <div className="w-2 h-2 bg-evidence-red animate-pulse rounded-full shadow-[0_0_8px_#ff1f1f]"></div>
                   <h1 className="text-4xl md:text-5xl font-stamped text-evidence-red tracking-[0.2em] uppercase text-center">
                       EPSTEIN FILES AGENT
                   </h1>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-evidence-red/20 pt-2">
                    <span className="text-[10px] font-typewriter text-gray-500 tracking-[0.3em]">SECURE ACCESS v4.22</span>
                    <span className="text-[10px] font-typewriter text-evidence-red tracking-widest animate-pulse">SYSTEM: FULL ANALYTICAL MODE</span>
                </div>
            </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 w-full min-h-0 flex flex-col">
             <ChatBox 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                onInputFocus={setIsTyping}
                isThinking={isThinking}
             />
        </div>

        {/* Footer info */}
        <footer className="flex-none mt-4 text-center">
            <p className="text-[9px] font-typewriter text-gray-600 tracking-widest uppercase">
                Warning: Digital Forensic Tool. Unauthorized access is recorded. All data sourced from Case 15-cv-07458 public records.
            </p>
        </footer>
      </main>
    </div>
  );
}