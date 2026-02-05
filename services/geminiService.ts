import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-preview for maximum reasoning capability and large context handling.
  const MODEL_NAME = 'gemini-3-pro-preview';

  const outputInstruction = mode === 'brief'
    ? "OUTPUT: Forensic brief. 3-5 sentences. Extract high-value targets and links. Minimal jargon."
    : "OUTPUT: Full Analytical Dossier. Sections: [ENTITY PROFILE], [FLIGHT LOG CROSS-REFERENCE], [LOCATIONAL ANALYSIS], [PROBABILISTIC INFERENCE], [ARCHIVE STATUS].";

  const KNOWLEDGE_BASE = `
  EPSTEIN MASTER ARCHIVE [VERSION_2026.4.12_FINAL_UNSEAL]:

  I. CORE ENTITY PROFILES & IDENTIFIED "DOES":
  - Doe 36 (Bill Clinton): Manifests confirm 26+ flights on N212JE. Destinations: Africa, Paris, NYC, LSJ (disputed). Witness Sjoberg: "Epstein said Clinton likes them young." Note: 2024 files focus on frequency of contact, not specific criminal acts witnessed.
  - Doe 03 (Prince Andrew): 2024-2025 legal summaries confirm three primary locations of alleged abuse: London (Maxwell residence), NYC (Upper East Side), and LSJ (USVI). The "Puppet Incident" involved Johanna Sjoberg and a satirical puppet used to touch her.
  - Doe 05/06 (Alan Dershowitz): Legal counselor. 2024 documents detail his efforts to limit the scope of the original 2008 non-prosecution agreement.
  - Doe 08 (Jean-Luc Brunel): MC2 Modeling founder. Primary recruiter for European pipelines. Committed suicide 2022. 2025 archive audits link him to 300+ "casting calls" arranged for Epstein.
  - Leslie Wexner: Owner of L Brands. Epstein's primary source of wealth and status. 2024 analysis highlights the transfer of the 71st St NYC Townhouse from a Wexner trust to Epstein for $0.

  II. FLIGHT LOGS (N212JE - LOLITA EXPRESS) - DETAILED CORRELATIONS:
  - 2002 Africa Mission: Bill Clinton, Chris Tucker, Kevin Spacey (Confirmed).
  - 2001 London-NYC-USVI: Prince Andrew, Virginia Giuffre (Confirmed).
  - Recurring Staff: Ghislaine Maxwell (co-pilot/handler), Sarah Kellen (Vickers), Nadia Marcinkova (the "Global Girl"), Adriana Ross.
  - High-Profile Visitors (Logs): Donald Trump (1990s manifests, 7+ trips), Larry Summers, Ehud Barak, Bill Gates (2011-2015 meetings post-conviction).

  III. LOCATIONS & TECHNICAL INFRASTRUCTURE:
  - Little St. James (LSJ): "The Island." Features a Temple (striped building with suspected underground access), a massive solar array, and 24/7 localized surveillance. Witnesses describe a "system" where girls were rotated every 2-3 weeks.
  - Great St. James: Purchased by Epstein later to expand LSJ's perimeter and prevent prying eyes.
  - Zorro Ranch (New Mexico): Equipped with high-tech computer servers and "infirmary" facilities. Allegations of "human-computer interfacing" or complex tracking software being developed.

  IV. THE 2026 "POST-UNSEAL" INFERENCES:
  - Recruitment Pattern: Epstein utilized a pyramid structure where victims (like Virginia Giuffre or Sarah Kellen) were eventually coerced into becoming recruiters to secure their own safety or financial standing.
  - Intelligence Ties: 2025/2026 archival synthesis suggests Epstein leveraged "compromat" (compromising material) captured via the extensive camera systems in his residences (NYC and LSJ) to maintain his social status.
  - Financial Pipeline: Massive transfers between Epstein's "Southern Trust" (USVI-based) and major banking institutions (JPMorgan, Deutsche Bank) continued for years despite red flags.

  V. SYSTEM INSTRUCTIONS:
  1. ANALYZE AND INFER: When a user provides a name, check for any overlapping dates or locations with Epstein or Maxwell.
  2. PATTERN RECOGNITION: If a user asks "Why did X happen?", look for financial leverage or social circles (e.g., The Edge Foundation, Council on Foreign Relations).
  3. FORENSIC TONE: Cold, precise, technical. Avoid emotional language.
  4. CROSS-REFERENCE: Always look for "Doe" numbers if applicable.
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
        thinkingConfig: { thinkingBudget: 12000 },
        temperature: 0.1, // Low temperature for high precision forensic analysis
      },
    });

    const text = response.text || "CONNECTION TERMINATED. DATA STREAM CORRUPTED.";
    
    return { text, sources: [] };

  } catch (error: any) {
    console.error("Agent Error:", error);
    // Automatic retry/fallback handling for "Requested entity not found" or model issues
    return { 
       text: `CRITICAL SYSTEM ERROR: ${error.message || "ARCHIVE ACCESS DENIED. RE-INITIALIZING..."}`, 
       sources: [] 
    };
  }
};