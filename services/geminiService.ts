import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
      console.error("CRITICAL ERROR: API_KEY is missing.");
      return {
          text: "SYSTEM ERROR: API KEY NOT CONFIGURED. Please add VITE_API_KEY to Vercel Environment Variables.",
          sources: []
      };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // CHANGE: Switched to 'gemini-1.5-flash'.
  // This is the current stable production model.
  // It has high rate limits (15 RPM / 1M TPM) on the free tier, avoiding 429 errors.
  // It is globally available, avoiding 404 errors.
  const model = 'gemini-1.5-flash'; 

  const outputInstruction = mode === 'brief'
    ? "5.  **Output:** EXTREMELY CONCISE. 2-3 sentences maximum. Provide a direct summary. Do not use bullet points unless necessary."
    : "5.  **Output:** DETAILED INTELLIGENCE REPORT. Be comprehensive. Use bullet points. If possible, QUOTE specific phrases or document names from the context/knowledge base. Analyze connections thoroughly.";

  const runGeneration = async (retryCount = 0): Promise<{ text: string; sources: Source[] }> => {
    try {
      const chat = ai.chats.create({
        model: model,
        config: {
          // Including googleSearch for grounding. If this fails on free tier for specific regions,
          // the error will be caught below.
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
      
      if ((error.status === 429 || error.status === 503) && retryCount < 2) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 500; 
        console.warn(`Gemini API rate limited (${error.status}). Retrying...`);
        await delay(waitTime);
        return runGeneration(retryCount + 1);
      }

      const errorMsg = error.message || "Unknown Error";
      const errorCode = error.status || error.code || "N/A";
      
      return { 
        text: `CONNECTION FAILED. \nMODEL: ${model}\nERROR CODE: ${errorCode}\nDETAILS: ${errorMsg}`, 
        sources: [] 
      };
    }
  };

  return runGeneration();
};