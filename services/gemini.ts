import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

/**
 * Retrieves the API key from the environment.
 * The Vite 'define' config ensures this is replaced at build time.
 */
const getApiKey = () => process.env.API_KEY || '';

export const generateResponse = async (
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("CRITICAL: API_KEY is not defined in the environment variables.");
    throw new Error("API Key is missing. Please configure your Vercel Environment Variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Handle implicit image generation requests
  const lowercasePrompt = prompt.toLowerCase();
  if (lowercasePrompt.includes("generate an image of") || lowercasePrompt.includes("create an image")) {
    return await generateImage(prompt);
  }

  // Format history for the API
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

  // Add the current prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const config: any = {
    temperature: 0.7,
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

    // Access .text property (getter)
    const text = response.text || "";
    
    // Extract grounding sources if available
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
    console.error("Gemini API Error Detail:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
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
      text: text || "Here is your generated image:", 
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
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const base64Data = imageB64.includes(',') ? imageB64.split(',')[1] : imageB64;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ModelType.FLASH,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: prompt || "What is in this image?" }
        ]
      }
    });
    return response.text || "I couldn't analyze the image.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};