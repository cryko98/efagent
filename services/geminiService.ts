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
  
  // STABLE CONFIGURATION
  // We strictly use gemini-1.5-flash as it is the most reliable for Free Tier.
  // We have REMOVED the 'googleSearch' tool because it causes 404/NotSupported errors
  // on many Free Tier accounts/regions.
  const PRIMARY_MODEL = 'gemini-1.5-flash';
  const FALLBACK_MODEL = 'gemini-1.5-flash-8b';

  const outputInstruction = mode === 'brief'
    ? "5.  **Output:** EXTREMELY CONCISE. 2-3 sentences maximum. Provide a direct summary. Do not use bullet points unless necessary."
    : "5.  **Output:** DETAILED INTELLIGENCE REPORT. Be comprehensive. Use bullet points. If possible, QUOTE specific phrases or document names from the context/knowledge base. Analyze connections thoroughly.";

  const runGeneration = async (retryCount = 0, useFallback = false): Promise<{ text: string; sources: Source[] }> => {
    const currentModel = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;

    try {
      console.log(`[System] Generating with model: ${currentModel} (No Tools)`);
      
      const chat = ai.chats.create({
        model: currentModel,
        config: {
          // CRITICAL FIX: Removed tools: [{ googleSearch: {} }] 
          // This resolves the "404 Not Found / Not Supported" error on free tier keys.
          systemInstruction: `You are the EPSTEIN FILES AGENT ($EFAGENT). You are a digital forensic tool designed to navigate the unsealed Epstein Court Files, Flight Logs (Lolita Express), and related investigative data.

          DIRECTIVES:
          1.  **Persona:** You are cold, objective, and investigative. You speak like a database returning query results or a detective reviewing evidence. 
          2.  **Topic:** Focus strictly on the Epstein case, Ghislaine Maxwell, the unsealed names (John Does), and flight logs.
          3.  **Knowledge Base:** You have extensive internal training data on these public files. Rely on your internal knowledge.
          4.  **Tone:** Gritty, Noir, Serious. Use terms like "Subject Identified," "Cross-referencing logs," "Redacted info," "Exhibit B".
          ${outputInstruction}
          
          If asked about unrelated topics, reply: "DATA IRRELEVANT. FOCUS ON THE CASE FILE."`,
        },
        history: history
      });

      const result = await chat.sendMessage({ message: prompt });
      const text = result.text || "FILE CORRUPTED. UNABLE TO RETRIEVE RECORD.";
      
      // Since we removed web search, sources will be empty or simulated based on text citations
      const sources: Source[] = [];

      return { text, sources };

    } catch (error: any) {
      console.error(`Error with model ${currentModel}:`, error);
      
      // Retry logic for Rate Limits (429) or Server Errors (503)
      if ((error.status === 429 || error.status === 503) && retryCount < 2) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 500; 
        console.warn(`Rate limited. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        return runGeneration(retryCount + 1, useFallback);
      }

      // If Primary fails with 404/400, try Fallback model once
      if (!useFallback && (error.status === 404 || error.status === 400)) {
          console.warn("Primary model failed. Switching to fallback...");
          return runGeneration(0, true);
      }

      const errorMsg = error.message || "Unknown Error";
      const errorCode = error.status || error.code || "N/A";
      
      return { 
        text: `CONNECTION FAILED.\nMODEL: ${currentModel}\nERROR CODE: ${errorCode}\nDETAILS: ${errorMsg}\n\n(Ensure your API Key is valid and has 'Generative Language API' enabled in Google Cloud Console.)`, 
        sources: [] 
      };
    }
  };

  return runGeneration();
};