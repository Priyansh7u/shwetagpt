
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

/**
 * Strictly utilizes process.env.API_KEY as injected by the build system.
 */
const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are ShwetaGPT, a highly intelligent, versatile, and friendly AI assistant. 
Your goal is to provide accurate, concise, and helpful information. 
- Be professional yet approachable.
- If asked for code, provide clean, modern, and documented snippets.
- When generating images, be creative and descriptive.
- Always use Markdown for structure (bolding, lists, code blocks).
- If you don't know something, be honest.
- Avoid being overly repetitive or lecturing the user.`;

export const generateResponse = async (
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });

  const lowercasePrompt = prompt.toLowerCase();
  if (lowercasePrompt.startsWith("generate an image") || lowercasePrompt.startsWith("create an image") || lowercasePrompt.startsWith("draw")) {
    return await generateImage(prompt);
  }

  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: msg.parts.map(p => {
      if (p.text) return { text: p.text };
      if (p.image) {
        const base64Data = p.image.includes(',') ? p.image.split(',')[1] : p.image;
        return { inlineData: { data: base64Data, mimeType: 'image/png' } };
      }
      return { text: "" };
    })
  }));

  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const config: any = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents,
      config,
    });

    const text = response.text || "";
    
    const groundingSources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
      if (chunk.web) {
        return {
          title: chunk.web.title || chunk.web.uri || "Source",
          uri: chunk.web.uri
        };
      }
      return null;
    }).filter((s: any): s is GroundingSource => s !== null && !!s.uri) || [];

    return { 
      text, 
      groundingSources,
      imageUrl: undefined 
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ModelType.IMAGE,
      contents: {
        parts: [{ text: `Generate a high-quality, professional image based on this request: ${prompt}` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let imageUrl: string | undefined = undefined;
    let text = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    return { 
      text: text || "Here is the image I generated for you:", 
      imageUrl,
      groundingSources: [] 
    };
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const analyzeImage = async (imageB64: string, prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const base64Data = imageB64.includes(',') ? imageB64.split(',')[1] : imageB64;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ModelType.FLASH,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: prompt || "Please look at this image and describe it with insight and detail." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });
    return response.text || "Unable to analyze the image.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
