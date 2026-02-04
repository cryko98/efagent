import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

// As per guidelines, use process.env.API_KEY directly.
// We assume it is pre-configured and valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  if (!process.env.API_KEY) {
      console.error("CRITICAL ERROR: API_KEY is missing.");
      return {
          text: "SYSTEM ERROR: API KEY NOT CONFIGURED. ACCESS DENIED.",
          sources: []
      };
  }

  const model = 'gemini-3-flash-preview'; 
  
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
      const statusCode = error.status || error.code || 500;
      console.error("Gemini API Error Details:", error); // Log full error to console
      
      if ((statusCode === 429 || statusCode === 503) && retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 500; 
        console.warn(`Gemini API rate limited (${statusCode}). Retrying...`);
        await delay(waitTime);
        return runGeneration(retryCount + 1);
      }
      
      // Check for specific Google AI Studio errors
      let errorMessage = "ACCESS DENIED. SERVER UNREACHABLE.";
      if (error.message && error.message.includes("API key not valid")) {
          errorMessage = "ACCESS DENIED. INVALID API KEY.";
      }
      
      return { 
        text: errorMessage, 
        sources: [] 
      };
    }
  };

  return runGeneration();
};