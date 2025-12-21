
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

const getApiKey = () => {
  // Try to get key from process.env (injected by Vite or external environment)
  const key = process.env.API_KEY;
  return key || '';
};

export const generateResponse = async (
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // If it's an image generation request
  const lowercasePrompt = prompt.toLowerCase();
  if (lowercasePrompt.includes("generate an image of") || lowercasePrompt.includes("create an image")) {
    return await generateImage(prompt);
  }

  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: msg.parts.map(p => {
      if (p.text) return { text: p.text };
      if (p.image) return { inlineData: { data: p.image.split(',')[1], mimeType: 'image/png' } };
      return { text: "" };
    })
  }));

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

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini API");
    }

    const text = response.text;
    const groundingSources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { text, groundingSources };
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes("entity was not found")) {
      console.warn("Requested entity was not found. This might be a model availability or API key issue.");
    }
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
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

    let imageUrl = "";
    let text = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    if (!imageUrl && !text) {
      throw new Error("No image or text returned from image generation");
    }

    return { text: text || "Here is your generated image:", imageUrl };
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const analyzeImage = async (imageB64: string, prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: ModelType.FLASH,
      contents: {
        parts: [
          { inlineData: { data: imageB64.split(',')[1], mimeType: 'image/png' } },
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
