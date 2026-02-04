import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
      console.error("CRITICAL ERROR: API_KEY is missing.");
      return {
          text: "SYSTEM ERROR: API KEY NOT CONFIGURED.",
          sources: []
      };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // USE GEMINI 2.5 FLASH (Most capable free model)
  const MODEL_NAME = 'gemini-2.5-flash-latest';

  const outputInstruction = mode === 'brief'
    ? "OUTPUT FORMAT: Concise, direct text. Max 3 sentences. No markdown formatting like bolding unless critical."
    : "OUTPUT FORMAT: Detailed forensic report. Use bullet points. Breakdown names, dates, and locations.";

  // KNOWLEDGE BASE INJECTION
  // This replaces external search with hardcoded facts from the unsealed files.
  const KNOWLEDGE_BASE = `
  INTERNAL DATABASE [EPSTEIN_FILES_UNSEALED_2024]:
  
  1