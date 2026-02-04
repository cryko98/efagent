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
      text: "ACCESS GRANTED. \n\nI am the Epstein Files Agent ($EFAGENT). I have access to the unsealed court documents, flight logs, and witness testimonies.\n\nAsk for a name, a date, or a flight record.",
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
         text: "CONNECTION INTERRUPTED. RETRY.",
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-gray-200 font-sans overflow-hidden flex flex-col items-center">
      
      {/* Background Data Stream - Fixed at z-0 */}
      <MatrixBackground />
      
      {/* Main Container - z-30 to sit above background and noise layers */}
      <main className="relative z-30 w-full max-w-5xl h-screen flex flex-col py-4 px-4">
        
        {/* Top: Header */}
        <div className="flex-none flex flex-col items-center justify-center py-6 relative">
            
            {/* Title Stamp */}
            <div className="border-2 border-evidence-red px-4 md:px-6 py-2 md:py-3 transform -rotate-1 bg-black/80 backdrop-blur-md shadow-[0_0_20px_rgba(255,31,31,0.2)]">
                <h1 className="text-xl md:text-2xl font-stamped text-evidence-red tracking-[0.2em] uppercase text-center">
                    EPSTEIN FILES AGENT
                </h1>
                <div className="text-[10px] text-center font-typewriter text-gray-500 mt-1 tracking-widest">
                    CLASSIFIED ARCHIVE ACCESS // $EFAGENT
                </div>
            </div>
        </div>

        {/* Bottom: Chat Interface */}
        <div className="flex-1 w-full mx-auto pb-2 md:pb-4 overflow-hidden min-h-0">
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