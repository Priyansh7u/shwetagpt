
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export enum ModelType {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-2.5-flash-image'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MessagePart {
  text?: string;
  image?: string; // base64
  isImagePrompt?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  groundingSources?: GroundingSource[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface GeminiResponse {
  text?: string;
  imageUrl?: string;
  groundingSources?: GroundingSource[];
}
