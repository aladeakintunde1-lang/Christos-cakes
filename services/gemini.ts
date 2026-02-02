
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

export const getDistanceBetweenPostcodes = async (from: string, to: string) => {
  try {
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

    const data = JSON.parse(response.text || '{"miles": 0}');
    return data.miles as number;
  } catch (error) {
    console.error("Distance Calculation Error:", error);
    return 0;
  }
};
