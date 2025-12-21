
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

export const generateResponse = async (
  prompt: string,
  history: Message[],
  model: ModelType = ModelType.FLASH,
  useSearch: boolean = false
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // If it's an image generation request
  if (prompt.toLowerCase().includes("generate an image of") || prompt.toLowerCase().includes("create an image")) {
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

    const text = response.text || "";
    const groundingSources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri || "Source",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return { text, groundingSources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    return { text: text || "Here is your generated image:", imageUrl };
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const analyzeImage = async (imageB64: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
    return response.text || "";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
