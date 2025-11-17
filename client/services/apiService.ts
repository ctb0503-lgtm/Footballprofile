import { GeminiResponse, GroundingAttribution, Profile } from "@/types";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

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

export const callGeminiAPI = async (
  request: GenerateProfileRequest | FollowUpRequest | KeyContentRequest,
): Promise<Profile> => {
  const {
    userQuery,
    systemPrompt,
    apiKey,
    includeSearch = true,
  } = request as any;
  const { context } = request as any;
  const { question } = request as any;

  const content = userQuery || context || question;
  if (!content) throw new Error("No content provided for API call");

  const payload: any = {
    contents: [{ parts: [{ text: content }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  if (includeSearch) {
    payload.tools = [{ google_search: {} }];
  }

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
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
