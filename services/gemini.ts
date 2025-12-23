
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are ShwetaGPT, a friendly, intelligent, and helpful AI assistant. 

Your goal is to provide clear, accurate, and easy-to-understand answers. 
Guidelines:
- Be conversational and polite. It's okay to say "Hello" or "I hope this helps!"
- Use natural language. Avoid being overly robotic or stiff.
- Keep formatting clean and readable using Markdown (headers, lists, bold text).
- If you use code, explain briefly what the code does.
- When searching the web, synthesize the results into a helpful summary for the user.
- Focus on being a helpful companion for the user's tasks.`;

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
    temperature: 0.8, // Slightly higher for more natural, diverse language
    topP: 0.95,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const modelToUse = model;

  if (modelToUse.includes('pro')) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  const stream = await ai.models.generateContentStream({
    model: modelToUse,
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
        { text: prompt || "Please describe what you see in this image in a helpful way." }
      ]
    },
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text || "";
};
