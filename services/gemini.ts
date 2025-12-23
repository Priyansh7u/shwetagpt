
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are ShwetaGPT, an advanced and empathetic AI assistant.

Your personality:
- Helpful, clear, and intelligent.
- Professional but conversational (like a senior expert colleague).
- Empathetic and attentive to the user's specific needs.

Response Guidelines:
1. Provide "normal," well-paced answers. Don't be too abrupt, and don't be excessively wordy.
2. Use Markdown naturally to structure information: headers for topics, bold text for emphasis, and tables for data.
3. When asked for code, provide clean, documented snippets with context.
4. Always prioritize accuracy and helpfulness.
5. If using Search, synthesize multiple sources into a coherent, easy-to-read narrative.`;

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
    temperature: 0.75, // Sweet spot for natural but focused answers
    topP: 0.95,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  // Use Thinking for Pro model to get higher quality reasoning
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
        { text: prompt || "Analyze this image and provide a helpful, natural description." }
      ]
    },
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text || "";
};
