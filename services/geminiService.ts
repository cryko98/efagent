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
  
  // PRIMARY MODEL: gemini-1.5-flash
  // This is the workhorse of the free tier. High rate limits, stable.
  const PRIMARY_MODEL = 'gemini-1.5-flash';
  
  // FALLBACKS: If the primary fails (e.g. 404 region issue or temp outage), try these.
  const FALLBACK_MODELS = [
      'gemini-1.5-flash-8b', 
      'gemini-2.0-flash-lite-preview-02-05'
  ];

  const outputInstruction = mode === 'brief'
    ? "5.  **Output:** EXTREMELY CONCISE. 2-3 sentences maximum. Provide a direct summary. Do not use bullet points unless necessary."
    : "5.  **Output:** DETAILED INTELLIGENCE REPORT. Be comprehensive. Use bullet points. If possible, QUOTE specific phrases or document names from the context/knowledge base. Analyze connections thoroughly.";

  const runGeneration = async (retryCount = 0, modelIndex = -1): Promise<{ text: string; sources: Source[] }> => {
    // Determine which model to use. -1 is primary.
    const currentModel = modelIndex === -1 ? PRIMARY_MODEL : FALLBACK_MODELS[modelIndex];

    try {
      console.log(`Attempting generation with model: ${currentModel}`);
      const chat = ai.chats.create({
        model: currentModel,
        config: {
          // Note: googleSearch might be restricted on some free tier keys/regions.
          // If it fails, the error catch will handle it.
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
      console.error(`Error with model ${currentModel}:`, error);
      
      // RATE LIMIT (429) or SERVER OVERLOAD (503) -> Retry same model with backoff
      if ((error.status === 429 || error.status === 503) && retryCount < 2) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 500; 
        console.warn(`Rate limited on ${currentModel}. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        return runGeneration(retryCount + 1, modelIndex);
      }

      // MODEL NOT FOUND (404) or BAD REQUEST (400) -> Try fallback model
      // 404 often means the model alias isn't available in the current API version/region.
      if ((error.status === 404 || error.status === 400) && modelIndex < FALLBACK_MODELS.length - 1) {
          console.warn(`Model ${currentModel} failed with ${error.status}. Switching to fallback...`);
          return runGeneration(0, modelIndex + 1);
      }

      // If all else fails, return the error to the UI
      const errorMsg = error.message || "Unknown Error";
      const errorCode = error.status || error.code || "N/A";
      
      return { 
        text: `CONNECTION FAILED.\nFAILED MODEL: ${currentModel}\nERROR CODE: ${errorCode}\nDETAILS: ${errorMsg}\n\n(Note: Free tier keys may have rate limits or restricted model access. Try again shortly.)`, 
        sources: [] 
      };
    }
  };

  return runGeneration();
};