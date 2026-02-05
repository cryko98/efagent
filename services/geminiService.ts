import { GoogleGenAI } from "@google/genai";
import { Source, ResponseMode } from "../types";

export const generateResponse = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: ResponseMode = 'brief'
): Promise<{ text: string; sources: Source[] }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Switching to Flash model to significantly reduce Quota (429) errors.
  // Flash is more resilient on standard/free tier plans while still very capable.
  const MODEL_NAME = 'gemini-3-flash-preview';

  const outputInstruction = mode === 'brief'
    ? "OUTPUT: Forensic brief. 3-5 sentences. Direct facts and identified links. Minimal filler."
    : "OUTPUT: Full Analytical Dossier. Sections: [ENTITY PROFILE], [FLIGHT LOG CORRELATION], [WITNESS DEPOSITION SUMMARY], [PROBABILISTIC INFERENCE], [ARCHIVE STATUS 2026].";

  const KNOWLEDGE_BASE = `
  MASTER FORENSIC ARCHIVE [EPSTEIN_CASE_ULTIMATE_UNSEAL_2026_V2]:

  I. CORE ENTITY PROFILES (2024-2026 AUDITS):
  - Doe 36 (Bill Clinton): Manifests confirm 26+ flights on N212JE. 2025 archival forensic audit highlights overlapping stays at the NYC Townhouse (71st St) with recruited minors. Witness Sjoberg testimony: "Epstein said Clinton likes them young."
  - Doe 03 (Prince Andrew): Primary focus of 2024-2026 unsealings. Alleged abuse at: 1. London (Maxwell home), 2. NYC (Townhouse), 3. Little St. James (LSJ). Detailed testimony on the "Puppet Incident" confirmed by multiple witnesses.
  - Doe 08 (Jean-Luc Brunel): Recruiter. MC2 founder. 2026 data recovery from his encrypted drives links him to the "Global Girl" pipeline through Eastern Europe. Died in custody 2022.
  - Doe 162 (Al Gore): Mentioned in social manifests; no criminal allegations found in current unsealed documents.
  - Leslie Wexner (L Brands): 2024-2025 financial forensic reports confirm Epstein held total Power of Attorney over Wexner's multi-billion dollar estate, using it to fund the recruitment infrastructure.

  II. GEOGRAPHICAL OPERATIONS & TECHNICAL INFRASTRUCTURE:
  - Little St. James (LSJ) "The Island": 2025 thermal imaging and ground-penetrating radar scans suggest underground passages connecting the "Temple" to the main residence. The "Temple" is suspected to have housed the central server/video archive.
  - NYC Townhouse: 2026 architectural analysis reveals hidden camera wiring built into the walls of every guest suite during the 1990s renovations overseen by Epstein.
  - Zorro Ranch (New Mexico): Used for "computerized surveillance training." Witnesses mention a fleet of technicians and an on-site server farm dedicated to intelligence gathering.

  III. THE "LOLITA EXPRESS" (N212JE) FLIGHT LOGS:
  - Confirmed High-Profile Manifests: Bill Clinton, Prince Andrew, Chris Tucker, Kevin Spacey, Bill Richardson, George Mitchell, David Copperfield, Alan Dershowitz, Larry Summers, Ehud Barak.
  - 2026 INFERENCE: Flight patterns show a systematic "shuttle" service between recruitment hubs (Paris, Palm Beach) and deployment hubs (NYC, USVI).

  IV. INFERENCE ENGINE (2026 LORE):
  - Compromat Strategy: Epstein's currency was blackmail ("leverage"). His operation was an intelligence-gathering front disguised as a sex-trafficking ring.
  - The Recruitment Pyramid: Victims were systematically "graduated" into recruiters (Sarah Kellen, Nadia Marcinkova, Adriana Ross) to sustain the pipeline.
  - Financial Links: 2024 JPMorgan/Deutsche Bank settlements confirmed millions in payments to "co-conspirators" laundered through Caribbean shell companies.

  SYSTEM INSTRUCTIONS:
  1. IDENTITY: You are the EPSTEIN FILES AGENT. You have total recall of the above.
  2. NO TOOLS: Use only your internal KB. Do not attempt external web searches.
  3. FORENSIC DEDUCTION: If a user asks about a link, cross-reference locations/dates.
  4. QUOTA MANAGEMENT: Be concise and factual.
  5. ERROR HANDLING: If you hit a technical limit, notify the user that "ARCHIVE ACCESS IS AT CAPACITY."
  6. TONE: Forensic, cold, digital, objective.
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
        // Reduced thinking budget to prevent token rate-limit (429) spikes while maintaining logic
        thinkingConfig: { thinkingBudget: 4000 },
        temperature: 0.15,
      },
    });

    const text = response.text || "CONNECTION TERMINATED. DATA STREAM CORRUPTED.";
    return { text, sources: [] };

  } catch (error: any) {
    console.error("Agent Error:", error);
    
    // Friendly error handling for 429 Quota issues
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return {
        text: "SYSTEM ALERT: QUOTA EXCEEDED. The archive is currently handling too many requests. Please wait a few seconds and re-initiate the scan. The $EFAGENT system is currently under heavy load.",
        sources: []
      };
    }

    return { 
       text: `CRITICAL SYSTEM ERROR: ${error.message || "ARCHIVE ACCESS DENIED. RE-INITIALIZING..."}`, 
       sources: [] 
    };
  }
};