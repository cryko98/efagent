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
  
  // CONFIGURATION BASED ON YOUR AVAILABLE MODELS
  // Primary: Gemini 2.5 Flash (Balanced, supports tools)
  const PRIMARY_MODEL = 'gemini-2.5-flash-latest';
  
  // Fallback: Gemini 2.5 Flash Lite (Faster, strictly text)
  const FALLBACK_MODEL = 'gemini-2.5-flash-lite-preview-02-05';

  const outputInstruction = mode === 'brief'
    ? "5.  **Output:** EXTREMELY CONCISE. 2-3 sentences maximum. Provide a direct summary. Do not use bullet points unless necessary."
    : "5.  **Output:** DETAILED INTELLIGENCE REPORT. Be comprehensive. Use bullet points. If possible, QUOTE specific phrases or document names from the context/knowledge base. Analyze connections thoroughly.";

  // Recursive generation function with fallback stages
  // Stage 0: Primary + Search
  // Stage 1: Primary (No Search) - specifically covers "tools not supported" errors
  // Stage 2: Fallback Model (No Search)
  const runGeneration = async (stage = 0): Promise<{ text: string; sources: Source[] }> => {
    
    let currentModel = PRIMARY_MODEL;
    let useSearch = true;

    if (stage === 1) {
        currentModel = PRIMARY_MODEL;
        useSearch = false; // Disable search to fix 404/400 errors
    } else if (stage >= 2) {
        currentModel = FALLBACK_MODEL;
        useSearch = false;
    }

    try {
      console.log(`[System] Attempting Stage ${stage}: Model=${currentModel}, Search=${useSearch}`);
      
      const tools = useSearch ? [{ googleSearch: {} }] : undefined;

      const chat = ai.chats.create({
        model: currentModel,
        config: {
          tools: tools,
          systemInstruction: `You are the EPSTEIN FILES AGENT ($EFAGENT). You are a digital forensic tool designed to navigate the unsealed Epstein Court Files, Flight Logs (Lolita Express), and related investigative data.

          DIRECTIVES:
          1.  **Persona:** You are cold, objective, and investigative. You speak like a database returning query results or a detective reviewing evidence. 
          2.  **Topic:** Focus strictly on the Epstein case, Ghislaine Maxwell, the unsealed names (John Does), and flight logs.
          3.  **Accuracy:** Base answers on credible investigative reporting and court documents.
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
      console.warn(`Stage ${stage} failed:`, error.message);
      
      // Smart Fallback Logic
      // If we are at Stage 0 (Search Enabled) and get a 404 or 400 or "not supported", 
      // it means the key/model doesn't support tools. RETRY without tools.
      if (stage === 0 && (error.status === 404 || error.status === 400 || error.message?.includes('not supported'))) {
          console.log("Search tool likely not supported. Disabling search and retrying...");
          return runGeneration(1);
      }

      // If Primary model (Stage 1) fails, try Fallback model (Stage 2)
      if (stage === 1) {
          console.log("Primary model failed. Switching to Lite model...");
          return runGeneration(2);
      }

      // If Rate Limited (429), wait and retry the SAME stage
      if (error.status === 429) {
          console.log("Rate limited. Waiting 2s...");
          await delay(2000);
          return runGeneration(stage); // Retry same stage
      }

      // If we exhausted all stages, return error
      if (stage >= 2) {
         const errorMsg = error.message || "Unknown Error";
         const errorCode = error.status || error.code || "N/A";
         return { 
            text: `CONNECTION FAILED.\nALL MODELS UNRESPONSIVE.\nLAST ERROR: ${errorCode}\nDETAILS: ${errorMsg}`, 
            sources: [] 
         };
      }

      // Catch-all: Try next stage
      return runGeneration(stage + 1);
    }
  };

  return runGeneration(0);
};