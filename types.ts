export interface Source {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  sources?: Source[];
}

export type ResponseMode = 'brief' | 'detailed';

export interface ChatState {
  messages: Message[];
  isTyping: boolean; // Is the AI thinking/typing?
  userInput: string;
}

export enum BotMood {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  THINKING = 'thinking',
  TALKING = 'talking',
  LISTENING = 'listening'
}