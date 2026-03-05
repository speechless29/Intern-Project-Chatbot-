import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function* sendMessageStream(message: string, history: { role: "user" | "model", parts: { text: string }[] }[]) {
  const model = "gemini-2.5-flash";
  
  const contents = [
    ...history,
    { role: "user" as const, parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: "You are a helpful, concise AI assistant. You provide clear and accurate information.",
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const response = await ai.models.generateContent({
     model: "gemini-2.5-flash",
     contents: `Generate a very short (max 5 words) title for a chat conversation that starts with: "${firstMessage}". Return only the title text.`
  });
  return response.text?.trim() || "New Chat";
}
