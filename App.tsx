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
      text: "ACCESS GRANTED. \n\nI am the Epstein Files Agent ($EFAGENT). I contain the archived unsealed court documents, flight logs (Lolita Express), and witness testimonies.\n\nAsk for a name (e.g., 'Prince Andrew', 'Doe 36'), a date, or a location.",
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
         text: "ERROR: DATA STREAM DISRUPTED. RETRY.",
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
      <main className="relative z-30 w-full max-w-4xl h-screen flex flex-col py-6 px-4">
        
        {/* Header */}
        <div className="flex-none flex flex-col items-center justify-center mb-6">
            <div className="border border-evidence-red/50 bg-black/80 backdrop-blur px-8 py-4 shadow-[0_0_30px_rgba(255,31,31,0.15)] relative">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-evidence-red"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-evidence-red"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-evidence-red"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-evidence-red"></div>

                <h1 className="text-3xl md:text-4xl font-stamped text-evidence-red tracking-[0.15em] uppercase text-center drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
                    EPSTEIN FILES AGENT
                </h1>
                <div className="flex justify-between items-center mt-2 border-t border-[#333] pt-1">
                    <span className="text-[10px] font-typewriter text-gray-500 tracking-widest">CASE: 09-CR-332</span>
                    <span className="text-[10px] font-typewriter text-evidence-red animate-pulse">STATUS: UNSEALED</span>
                </div>
            </div>
        </div>

        {/* Chat Interface - Takes up remaining space */}
        <div className="flex-1 w-full min-h-0 flex flex-col shadow-2xl shadow-black/50">
             <ChatBox 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                onInputFocus={setIsTyping}
                isThinking={isThinking}
             />
        </div>

      </main>
    </div>
  );
}