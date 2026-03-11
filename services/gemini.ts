
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please ensure it is set in your environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const getCakeMessageSuggestion = async (occasion: string, recipient: string, tone: string) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 5 short, creative, and aesthetically pleasing "Message on Cake" ideas for a ${occasion} for ${recipient}. The tone should be ${tone}. Keep them brief enough to fit on a cake.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Happy Birthday!", "Congratulations!", "Best Wishes!"];
  }
};
