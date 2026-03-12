
import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const errorMsg = "GEMINI_API_KEY is not defined. If you are seeing this on Vercel, ensure you have added GEMINI_API_KEY to your Environment Variables in the Vercel Dashboard.";
      console.error(errorMsg);
      throw new Error(errorMsg);
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
    
    const text = response.text?.trim() || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Happy Birthday!", "Congratulations!", "Best Wishes!"];
  }
};

export const getDistanceBetweenPostcodes = async (from: string, to: string) => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Calculate the estimated driving distance in miles between the UK postcodes "${from}" and "${to}". 
      Return the result as a JSON object with a single field "miles" which is a number. 
      If you are unsure, provide your best estimate based on the distance between these areas.`,
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

    const text = response.text?.trim();
    if (!text) return 0;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    const data = JSON.parse(jsonStr);
    return Number(data.miles) || 0;
  } catch (error) {
    console.error("Distance Calculation Error:", error);
    return 0;
  }
};
