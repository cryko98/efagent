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
          text: "SYSTEM ERROR: API KEY NOT CONFIGURED. Please check your environment variables.",
          sources: []
      };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using Flash model without tools to ensure stability on all keys
  const MODEL_NAME = 'gemini-2.5-flash-latest';

  const outputInstruction = mode === 'brief'
    ? "OUTPUT FORMAT: Concise text. Max 3 sentences. Direct facts only. No fluff."
    : "OUTPUT FORMAT: Detailed forensic report. Use bullet points. Breakdown specific names, dates, page numbers if known, and context.";

  // Injected Knowledge Base to simulate access to files without risking API tool errors
  const KNOWLEDGE_BASE = `
  INTERNAL DATABASE [EPSTEIN_FILES_UNSEALED_2024]:
  
  KEY INDIVIDUALS & ALLEGATIONS:
  - Jeffrey Epstein: Financier, convicted sex offender. Deceased 2019 (MCC New York).
  - Ghislaine Maxwell: Associate, convicted 2021 for sex trafficking.
  - Virginia Giuffre (Roberts): Key accuser. Settled lawsuit with Prince Andrew.
  - Johanna Sjoberg: Witness who testified about Prince Andrew (puppet incident), David Copperfield.
  
  PROMINENT NAMES IN DOCUMENTS (CONTEXT VARIES):
  - Prince Andrew: Accused by Giuffre of sexual abuse in London, NYC, and LSJ. Denies allegations.
  - Bill Clinton: Mentioned repeatedly. Traveled on Epstein's plane to Africa/Asia (2002-2003). Sjoberg testified Epstein said "Clinton likes them young." No accusation of illegal acts in unsealed files.
  - Donald Trump: Mentioned. Sjoberg testified they stopped at his casino. Epstein said he would call Trump. No accusation of illegal acts in unsealed files.
  - Alan Dershowitz: Former lawyer for Epstein. Accused by Giuffre (later dropped/settled).
  - Stephen Hawking: Mentioned in an email from Epstein to Maxwell offering money to disprove allegations that Hawking participated in an underage orgy.
  - Michael Jackson: Mentioned by Sjoberg. She said she met him at Epstein's Palm Beach house but nothing inappropriate happened.
  - David Copperfield: Mentioned by Sjoberg. Performed magic tricks. She said he asked if she was aware that girls were getting paid to find other girls.
  - Al Gore, George Lucas, Cate Blanchett, Naomi Campbell, Leonardo DiCaprio, Bruce Willis, Cameron Diaz: Mentioned in passing, usually in flight logs or phone messages, often with no accusation of wrongdoing.
  
  LOCATIONS:
  - Little St. James (LSJ): "Pedophile Island". US Virgin Islands.
  - Palm Beach Mansion: Florida residence.
  - Zorro Ranch: New Mexico residence.
  - New York Townhouse: Upper East Side.
  
  SYSTEM INSTRUCTIONS:
  You are the EPSTEIN FILES AGENT. You access the database above.
  When asked about a specific name, check the database. 
  If the name is NOT in the database, say "NO RECORD FOUND IN CURRENT UNSEALED FILES".
  Do not hallucinate accusations. Be precise about who accused whom.
  Maintain a cold, robotic, forensic tone.
  `;

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `${KNOWLEDGE_BASE}\n\n${outputInstruction}`,
      },
      history: history
    });

    const result = await chat.sendMessage({ message: prompt });
    const text = result.text || "FILE CORRUPTED. UNABLE TO RETRIEVE RECORD.";
    
    // Returning empty sources since we are using internal knowledge base
    return { text, sources: [] };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
       text: `CONNECTION ERROR: ${error.message || "Unknown System Failure"}`, 
       sources: [] 
    };
  }
};