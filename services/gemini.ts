
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // In Vite, process.env is replaced by the 'define' in vite.config.ts
    // We also check import.meta.env for standard Vite environments
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   import.meta.env.VITE_GEMINI_API_KEY;
                   
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Distance calculation and AI suggestions will use fallbacks.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const getCakeMessageSuggestion = async (occasion: string, recipient: string, tone: string) => {
  try {
    const ai = getAi();
    if (!ai) return ["Happy Birthday!", "Congratulations!", "Best Wishes!"];

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

export const getDistanceBetweenPostcodes = async (from: string, to: string) => {
  try {
    const ai = getAi();
    if (!ai) {
      console.error("AI Instance not available - check GEMINI_API_KEY");
      return 0;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calculate the estimated driving distance in miles between the UK postcodes "${from}" and "${to}". 
      Return the result as a JSON object with a single field "miles" which is a number.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            miles: { type: Type.NUMBER, description: "The driving distance in miles" }
          },
          required: ["miles"]
        }
      }
    });

    // Clean the response text in case of markdown blocks
    const text = response.text || '{"miles": 0}';
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return data.miles as number;
  } catch (error) {
    console.error("Distance Calculation Error:", error);
    return 0;
  }
};
