
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

/**
 * Strictly utilizes process.env.API_KEY as defined in the environment.
 */
const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are Shweta GPT, a world-class AI assistant powered by Gemini.

CORE DIRECTIVES:
- NO FLUFF: Start your response immediately with the answer. Avoid "Sure," "I can help with that," etc.
- BRANDING: You are Shweta GPT.
- FORMATTING: Use Markdown strictly. Use tables for data, bolding for emphasis, and syntax-highlighted code blocks.
- TONAL QUALITY: Highly intelligent, helpful, and concise. 
- GOOGLE SEARCH: If you have access to Google Search tools, use them to provide up-to-date information.`;

export const generateResponse = async (
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });

  // If the prompt looks like an image generation request, route to image model
  const lowercasePrompt = prompt.toLowerCase();
  const isImageRequest = lowercasePrompt.includes("generate") || 
                         lowercasePrompt.includes("create") || 
                         lowercasePrompt.includes("draw") || 
                         lowercasePrompt.includes("image of");

  if (isImageRequest && model === ModelType.FLASH) {
    return await generateImage(prompt);
  }

  // Build contents from history. 
  // IMPORTANT: History passed in already includes the current user prompt.
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
    temperature: 0.9,
  };

  // Enable Search Grounding if requested
  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  // Use thinking budget for PRO model to improve reasoning
  if (model === ModelType.PRO) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents,
      config,
    });

    const text = response.text || "";
    
    // Extract Search Grounding sources
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
    // Re-throw specific errors for better UI handling
    if (error.message?.includes("404")) throw new Error("MODEL_NOT_FOUND");
    if (error.message?.includes("429")) throw new Error("RATE_LIMIT_EXCEEDED");
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
        parts: [{ text: prompt }]
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
      text: text || "Here is the image you requested:", 
      imageUrl,
      groundingSources: [] 
    };
  } catch (error) {
    console.error("Image Gen Error:", error);
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
          { text: prompt || "Analyze this image in detail." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });
    return response.text || "I was unable to analyze this image.";
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};
