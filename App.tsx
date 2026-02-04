import React, { useState } from 'react';
import ChatBox from './components/ChatBox';
import MatrixBackground from './components/MatrixBackground';
import RobotFace from './components/RobotFace';
import { generateResponse } from './services/geminiService';
import { Message, ResponseMode, BotMood } from './types';

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
      setIsThinking(false);
    }
  };

  // Determine Mood
  const currentMood = isThinking ? BotMood.THINKING : (isTyping ? BotMood.LISTENING : BotMood.NEUTRAL);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans relative overflow-hidden flex flex-col items-center">
      
      {/* Background Data Stream */}
      <MatrixBackground />
      
      {/* Main Container */}
      <main className="relative z-20 w-full max-w-5xl h-screen flex flex-col py-4 px-4">
        
        {/* Top: Robot Face & Header */}
        <div className="flex-none flex flex-col items-center justify-center min-h-[30vh] pb-4 relative">
            
            {/* The Agent Face */}
            <div className="w-64 h-64 mb-4 relative">
                <RobotFace mood={currentMood} isUserTyping={isTyping} />
            </div>

            {/* Title Stamp */}
            <div className="border-2 border-evidence-red px-6 py-3 transform -rotate-1 bg-black/50 backdrop-blur-sm z-20">
                <h1 className="text-2xl font-stamped text-evidence-red tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(255,31,31,0.4)]">
                    EPSTEIN FILES AGENT ($EFAGENT)
                </h1>
            </div>
        </div>

        {/* Bottom: Chat Interface */}
        <div className="flex-1 w-full mx-auto pb-4 overflow-hidden">
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