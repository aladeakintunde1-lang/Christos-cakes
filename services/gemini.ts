
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // We use these specific strings so Vite's 'define' can replace them at build time
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
                   
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined. Please ensure it is set in your environment variables (Vercel/Local).");
      throw new Error("GEMINI_API_KEY is missing");
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

export const getDistanceBetweenPostcodes = async (from: string, to: string) => {
  if (!from || !to) return 0;
  
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calculate the estimated driving distance in miles between these two UK postcodes:
      From: "${from}"
      To: "${to}"
      
      Use Google Search to find the most accurate driving distance if needed.
      Return the result as a JSON object with a single field "miles" which is a number.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            miles: { 
              type: Type.NUMBER, 
              description: "The estimated driving distance in miles as a number" 
            }
          },
          required: ["miles"]
        }
      }
    });

    if (!response.text) {
      console.warn("Gemini returned an empty response for distance calculation.");
      return 0;
    }

    // Sometimes Gemini might return JSON wrapped in markdown even with responseMimeType
    const text = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(text);
    return typeof data.miles === 'number' ? data.miles : 0;
  } catch (error) {
    console.error("Distance Calculation Error:", error);
    return 0;
  }
};
