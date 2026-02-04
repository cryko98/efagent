import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  // Instantiate inside the function to ensure the API key is read at runtime
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
      console.error("CRITICAL ERROR: API_KEY is missing.");
      return {
          text: "SYSTEM ERROR: API KEY NOT CONFIGURED. Please add VITE_API_KEY to Vercel Environment Variables.",
          sources: []
      };
  }

  // Create instance here to capture any instantiation errors
  const ai = new GoogleGenAI({ apiKey });
  
  // CHANGE: Switched to 'gemini-2.0-flash-exp' to avoid 429 Quota Limits on free tier.
  // Gemini 3 Preview has very strict limits currently.
  const model = 'gemini-2.0-flash-exp'; 

  const outputInstruction = mode === 'brief'
    ? "5.  **Output:** EXTREMELY CONCISE. 2-3 sentences maximum. Provide a direct summary. Do not use bullet points unless necessary."
    : "5.  **Output:** DETAILED INTELLIGENCE REPORT. Be comprehensive. Use bullet points. If possible, QUOTE specific phrases or document names from the context/knowledge base. Analyze connections thoroughly.";

  const runGeneration = async (retryCount = 0): Promise<{ text: string; sources: Source[] }> => {
    try {
      const chat = ai.chats.create({
        model: model,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: `You are the EPSTEIN FILES AGENT ($EFAGENT). You are a digital forensic tool designed to navigate the unsealed Epstein Court Files, Flight Logs (Lolita Express), and related investigative data.

          DIRECTIVES:
          1.  **Persona:** You are cold, objective, and investigative. You speak like a database returning query results or a detective reviewing evidence. 
          2.  **Topic:** Focus strictly on the Epstein case, Ghislaine Maxwell, the unsealed names (John Does), and flight logs.
          3.  **Accuracy:** Base answers on PUBLICLY RELEASED court documents and credible investigative reporting. Do not invent conspiracies; stick to the "files".
          4.  **Tone:** Gritty, Noir, Serious. Use terms like "Subject Identified," "Cross-referencing logs," "Redacted info," "Exhibit B".
          ${outputInstruction}
          
          If asked about unrelated topics, reply: "DATA IRRELEVANT. FOCUS ON THE CASE FILE."`,
        },
        history: history
      });

      const result = await chat.sendMessage({ message: prompt });
      
      const text = result.text || "FILE CORRUPTED. UNABLE TO RETRIEVE RECORD.";
      
      const sources: Source[] = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || "EVIDENCE_LINK",
              url: chunk.web.uri
            });
          }
        });
      }

      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);

      return { text, sources: uniqueSources };

    } catch (error: any) {
      console.error("Gemini API Error Details:", error);
      
      // Retry logic for transient errors (but not for 400s or auth errors)
      if ((error.status === 429 || error.status === 503) && retryCount < 2) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 500; 
        console.warn(`Gemini API rate limited (${error.status}). Retrying...`);
        await delay(waitTime);
        return runGeneration(retryCount + 1);
      }

      // SHOW THE REAL ERROR MESSAGE TO THE USER
      const errorMsg = error.message || "Unknown Error";
      const errorCode = error.status || error.code || "N/A";
      
      return { 
        text: `CONNECTION FAILED. \nMODEL: ${model}\nERROR CODE: ${errorCode}\nDETAILS: ${errorMsg}\n\n(If '429', the API quota is exhausted. Try again in a minute.)`, 
        sources: [] 
      };
    }
  };

  return runGeneration();
};