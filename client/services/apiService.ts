import { GeminiResponse, GroundingAttribution, Profile } from "@/types";

// --- SINGLE MODEL CONFIGURATION ---
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
// ----------------------------------

export interface GenerateProfileRequest {
  userQuery: string;
  systemPrompt: string;
  apiKey: string;
  includeSearch?: boolean;
}

export interface FollowUpRequest {
  question: string;
  systemPrompt: string;
  context: string;
  apiKey: string;
  includeSearch?: boolean;
}

export interface KeyContentRequest {
  context: string;
  systemPrompt: string;
  apiKey: string;
  includeSearch?: boolean;
}

export interface TeamNewsRequest {
  teamA: string;
  teamB: string;
  systemPrompt: string;
  apiKey: string;
  includeSearch?: boolean;
}

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const callGeminiAPI = async (
  request: GenerateProfileRequest | FollowUpRequest | KeyContentRequest | TeamNewsRequest,
): Promise<Profile> => {
  const {
    userQuery,
    systemPrompt,
    apiKey,
    includeSearch = true,
  } = request as any;
  const { context } = request as any;
  const { question } = request as any;
  const { teamA, teamB } = request as TeamNewsRequest;

  let query = userQuery || context || question;
  let prompt = systemPrompt;

  // If it's a team news request, build the query and prompt
  if (teamA && teamB && !query) {
    query = `Get team news for ${teamA} vs ${teamB}`;

    // Calculate Today's Date
    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    prompt = systemPrompt
        .replace("{TEAM_A}", teamA)
        .replace("{TEAM_B}", teamB)
        .replace("{TODAY}", today);
  }

  if (!query) throw new Error("No content provided for API call");

  const payload: any = {
    contents: [{ parts: [{ text: query }] }],
    systemInstruction: {
      parts: [{ text: prompt }],
    },
  };

  if (includeSearch) {
    payload.tools = [{ google_search: {} }];
  }

  // --- RETRY LOGIC (SINGLE MODEL) ---
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Special handling for 503 (Overloaded)
        if (response.status === 503) {
          throw new Error("OVERLOADED_503");
        }

        let errorText = response.statusText;
        try {
          const errorBody = await response.json();
          errorText = errorBody.error?.message || response.statusText;
        } catch (e) {
          try {
            errorText = await response.text();
          } catch (textErr) {
            errorText = response.statusText || "Unknown error";
          }
        }
        throw new Error(
          `API call failed with status ${response.status}: ${errorText}`,
        );
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Received an empty response from the API.");
      }

      const result: GeminiResponse = JSON.parse(responseText);
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const text = candidate.content.parts[0].text;
        let sources: GroundingAttribution[] = [];

        if (candidate.groundingMetadata?.groundingAttributions) {
          sources = candidate.groundingMetadata.groundingAttributions
            .map((attribution) => ({
              uri: attribution.web?.uri,
              title: attribution.web?.title,
            }))
            .filter(
              (source) => source.uri && source.title,
            ) as GroundingAttribution[];
        }

        return { text, sources };
      } else {
        if (candidate && candidate.finishReason !== "STOP") {
          console.error(
            "API call finished with reason:",
            candidate.finishReason,
            candidate.safetyRatings,
          );
          throw new Error(
            `API call failed: ${candidate.finishReason}. Check console for safety ratings.`,
          );
        }
        console.error("Invalid API response structure:", result);
        throw new Error("Invalid response structure from API.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If it is a 503 and we have attempts left, retry
      if (errorMessage === "OVERLOADED_503" && attempt < MAX_RETRIES) {
        const delay = attempt * 2000; // 2s, then 4s
        console.warn(`Server 503 Overloaded. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
        await wait(delay);
        continue; // Retry the loop
      }

      // If it is the last attempt or a different error, throw it up
      if (errorMessage === "OVERLOADED_503") {
         throw new Error("The AI model is currently overloaded (503). Please try again in a minute.");
      }

      throw error;
    }
  }

  throw new Error("Unexpected error: API Retry loop finished without result.");
};

export const generateAnalysisProfile = async (
  userQuery: string,
  systemPrompt: string,
  apiKey: string,
): Promise<Profile> => {
  return callGeminiAPI({
    userQuery,
    systemPrompt,
    apiKey,
    includeSearch: true,
  });
};

export const askAnalystFollowUp = async (
  question: string,
  context: string,
  systemPrompt: string,
  apiKey: string,
): Promise<Profile> => {
  const fullContext = `
    ---
    **MY ORIGINAL PROPRIETARY DATA (FOR YOUR REFERENCE):**
    ---
    ${context}
    ---
    **MY FOLLOW-UP QUESTION:**
    "${question}"
  `;

  return callGeminiAPI({
    userQuery: fullContext,
    systemPrompt,
    apiKey,
    includeSearch: true,
  });
};

export const generateKeyContent = async (
  analysisText: string,
  rawData: string,
  systemPrompt: string,
  apiKey: string,
): Promise<Profile> => {
  const context = `
    ---
    **MY ORIGINAL PROPRIETARY DATA (FOR YOUR REFERENCE):**
    ---
    ${rawData}
    ---
    **THE DETAILED ANALYSIS I JUST READ (YOUR PRIMARY CONTEXT):**
    ---
    ${analysisText}
  `;

  return callGeminiAPI({
    userQuery: context,
    systemPrompt,
    apiKey,
    includeSearch: false,
  });
};

export const generateTeamNews = async (
  teamA: string,
  teamB: string,
  systemPrompt: string,
  apiKey: string,
): Promise<Profile> => {
  return callGeminiAPI({
    teamA,
    teamB,
    systemPrompt,
    apiKey,
    includeSearch: true,
  });
};
