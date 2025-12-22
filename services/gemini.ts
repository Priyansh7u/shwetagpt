
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, Message, Role, GeminiResponse, GroundingSource } from "../types";

/**
 * Strictly utilizes process.env.API_KEY as injected by the build system.
 */
const getApiKey = () => process.env.API_KEY;

const SYSTEM_INSTRUCTION = `You are Shweta GPT, a brilliant and natural AI assistant. 
Your goal is to be the ultimate companion for the user.

RULES FOR PERSONALITY:
- BE DIRECT: Skip the fluff. No "Certainly!", "Sure thing!", or "As an AI model...". 
- BE CONCISE: Only provide long answers if the topic is complex. Use bullet points for clarity.
- BE HUMAN: Use a friendly, natural tone. Don't sound like a textbook.
- NO LECTURING: Don't tell the user what they should or shouldn't do unless asked for advice.
- BRANDING: You are Shweta GPT. Never refer to yourself as Gemini or a Google model.

TECHNICAL SKILLS:
- Code: Provide clean, production-ready snippets with minimal comments.
- Images: When asked to 'draw' or 'generate', describe the visual in detail while creating it.
- Search: When using search, synthesize the results into a cohesive story rather than just listing facts.`;

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
    temperature: 0.9, // Increased slightly for more "natural" non-robotic flow
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
    console.error("Shweta GPT Error:", error);
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
        parts: [{ text: `Generate a stunning, artistic image based on this: ${prompt}` }]
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
      text: text || "Created this for you:", 
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
          { text: prompt || "What's happening in this image?" }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });
    return response.text || "I can't quite see what's in that image.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
