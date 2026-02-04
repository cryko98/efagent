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

export enum BotMood {
  NEUTRAL = 'neutral',
  THINKING = 'thinking',
  TALKING = 'talking',
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean; // Is the AI thinking/typing?
  userInput: string;
}