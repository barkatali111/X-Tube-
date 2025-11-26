import { GoogleGenAI } from "@google/genai";

export const generateVideoMetadata = async (prompt: string): Promise<{ title: string; description: string; tags: string[] }> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      You are an expert YouTube-like algorithm optimizer. 
      Given a short topic or rough idea, generate a viral, professional video title, a compelling description (2 sentences max), and 5 relevant tags.
      Return ONLY valid JSON in this format:
      {
        "title": "string",
        "description": "string",
        "tags": ["string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { title: "", description: "", tags: [] };
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Fallback if API fails or key is missing
    return {
      title: "Generated Title: " + prompt,
      description: "Auto-generated description based on your input.",
      tags: ["video", "tubex", "new"]
    };
  }
};
          
