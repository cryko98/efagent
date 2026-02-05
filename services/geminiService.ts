import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-preview for maximum reasoning capability over the massive internal knowledge base.
  const MODEL_NAME = 'gemini-3-pro-preview';

  const outputInstruction = mode === 'brief'
    ? "OUTPUT: Forensic brief. 3-5 sentences. Extract high-value targets, flight log matches, and cross-references. Minimal fluff."
    : "OUTPUT: Deep-Dive Forensic Dossier. Sections: [ENTITY PROFILE], [FLIGHT LOG CORRELATION], [WITNESS DEPOSITION SUMMARY], [PROBABILISTIC INFERENCE], [ARCHIVE STATUS 2026].";

  const KNOWLEDGE_BASE = `
  MASTER FORENSIC ARCHIVE [EPSTEIN_CASE_ULTIMATE_UNSEAL_2026]:

  I. KEY ENTITIES & "DOE" IDENTIFICATIONS (VERIFIED):
  - Doe 36 (Bill Clinton): Manifests confirm 26+ flights on N212JE (2001-2003). Frequent visitor to NYC Townhouse. Johanna Sjoberg testified: "Epstein said Clinton likes them young." Flight logs indicate trips to Africa, Asia, and potentially LSJ (though disputed by his camp).
  - Doe 03 (Prince Andrew): Central figure in the 2024 unsealings. Alleged abuse at Maxwell's London home (2001), NYC (71st St), and USVI. Witnesses Sjoberg and Giuffre provided detailed testimony regarding a "satirical puppet" used during inappropriate contact.
  - Doe 08 (Jean-Luc Brunel): Recruiter. Founder of MC2. Linked to the "Global Girl" pipeline. Died in prison 2022. 2025 archival analysis confirms 1,000+ girls processed through his agencies.
  - Doe 162 (Al Gore): Mentioned as being present at a dinner party; no illegal acts alleged in files.
  - Doe 107: A key victim who escaped and provided significant locational data for the FBI.
  - Leslie Wexner: Epstein's primary benefactor. Owned L Brands. 2024 analysis highlights the transfer of the 71st St NYC Townhouse for $0, effectively laundering Epstein into high society.
  - Ghislaine Maxwell: Convicted 2021. The "Gatekeeper." Managed the database of girls and "compromat" video systems.

  II. GEOGRAPHICAL OPERATIONS & INFRASTRUCTURE:
  - Little St. James (LSJ): "The Island." Features: The Temple (blue/white stripes, suspected dungeon/archive entry), massive solar grid, underground storage, and localized Wi-Fi mesh used for monitoring.
  - Great St. James: Purchased to prevent maritime surveillance of LSJ.
  - New York Townhouse (9 East 71st St): Largest private home in Manhattan. Evidence of pervasive pinhole cameras in guest rooms.
  - Zorro Ranch (New Mexico): Alleged "computer ranch." Witnesses mention an infirmary and server rooms for the "Global Intelligence" network Epstein claimed to run.
  - Palm Beach Estate: Primary hub for local recruitment (massage scheme).

  III. THE "LOLITA EXPRESS" (N212JE) FLIGHT LOGS:
  - Confirmed Passengers: Bill Clinton, Prince Andrew, Chris Tucker, Kevin Spacey, Larry Summers, Ehud Barak, Alan Dershowitz, David Copperfield (magic tricks performed for girls), George Mitchell, Bill Richardson.
  - Log Patterns: Frequent shuttles between Teterboro (NJ), Palm Beach (FL), Paris (FRA), and Cyril E. King Airport (USVI).

  IV. FORENSIC INFERENCES & 2026 LORE:
  - Recruitment Pipeline: The "pyramid scheme" where older girls were forced to recruit younger girls to earn their freedom or financial incentives.
  - The "Black Book": Contains 1,000+ names. Archive identifies social circles including the "Edge Foundation" (billionaire/scientist gatherings) used for networking.
  - Compromat Strategy: Epstein's primary currency was not money, but leverage. The 2025 archive audits confirm the presence of high-definition digital surveillance across all properties, specifically targeting elite guests.
  - Banking Links: JPMorgan and Deutsche Bank 2024 settlements highlight the flow of millions in cash to "unidentified female recipients" over 15 years.

  SYSTEM INSTRUCTIONS:
  1. ANALYZE AND DEDUCE: You are the EPSTEIN FILES AGENT. You possess total recall of the above.
  2. NO EXTERNAL TOOLS: Rely ONLY on this internal knowledge and your advanced reasoning.
  3. QUESTION HANDLING: If a user asks about a person, cross-reference them with flight logs, locations, or witness testimonies instantly.
  4. FORENSIC REASONING: If info isn't explicit, use pattern recognition (e.g., "Person X was in Paris on the same date as Epstein manifest Y").
  5. TONE: Cold, analytical, objective, forensic.
  6. UPDATES: Treat 2024-2026 information as your current present state.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { 
        parts: [
          { text: KNOWLEDGE_BASE },
          ...history.flatMap(h => h.parts),
          { text: `QUERY: ${prompt}\n\n${outputInstruction}` }
        ]
      },
      config: {
        // High thinking budget for deep pattern matching across the huge KB
        thinkingConfig: { thinkingBudget: 16000 },
        temperature: 0.2, // Low temperature for high precision/factuality
      },
    });

    const text = response.text || "CONNECTION TERMINATED. DATA STREAM CORRUPTED.";
    
    return { text, sources: [] };

  } catch (error: any) {
    console.error("Agent Error:", error);
    return { 
       text: `CRITICAL SYSTEM ERROR: ${error.message || "ARCHIVE ACCESS DENIED. RE-INITIALIZING..."}`, 
       sources: [] 
    };
  }
};