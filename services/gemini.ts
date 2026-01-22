
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCakeMessageSuggestion = async (occasion: string, recipient: string, tone: string) => {
  try {
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
