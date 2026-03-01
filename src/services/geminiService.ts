import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function* sendMessageStream(message: string, history: { role: "user" | "model", parts: { text: string }[] }[]) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "You are a helpful, concise AI assistant. You provide clear and accurate information.",
    },
    history: history,
  });

  const result = await chat.sendMessageStream({ message });

  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a very short (max 5 words) title for a chat conversation that starts with: "${firstMessage}". Return only the title text.`,
  });
  return response.text?.trim() || "New Chat";
}
