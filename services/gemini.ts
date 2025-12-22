
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are Shweta GPT, a world-class AI assistant. 
Your goal is to provide the most accurate, concise, and helpful response possible.

STRICT PROTOCOLS:
- NO CONVERSATIONAL FILLER: Do not say "Certainly!", "I can help with that", or "Sure thing". Start with the answer.
- EXPERT FORMATTING: Use Markdown tables, bold headers, and clean lists.
- CODE: Always provide language identifiers for code blocks.
- PERSONALITY: Intelligent, precise, and direct. You are a tool, not a chatterbox.
- GROUNDING: When using Google Search tools, synthesize information into a coherent narrative.`;

export async function* generateStreamingResponse(
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });

  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: msg.parts.map(p => {
      if (p.image) {
        const base64Data = p.image.includes(',') ? p.image.split(',')[1] : p.image;
        return { inlineData: { data: base64Data, mimeType: 'image/png' } };
      }
      return { text: p.text || "" };
    })
  }));

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
    topP: 0.95,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  if (model === ModelType.PRO) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  const stream = await ai.models.generateContentStream({
    model: model,
    contents,
    config,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    const sources: GroundingSource[] = groundingChunks?.map((c: any) => {
      if (c.web) return { title: c.web.title || c.web.uri, uri: c.web.uri };
      return null;
    }).filter((s: any): s is GroundingSource => s !== null) || [];

    yield { text, sources };
  }
}

export const analyzeImage = async (imageB64: string, prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = imageB64.includes(',') ? imageB64.split(',')[1] : imageB64;
  const response = await ai.models.generateContent({
    model: ModelType.FLASH,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/png' } },
        { text: prompt || "Analyze this image concisely." }
      ]
    },
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text || "";
};
