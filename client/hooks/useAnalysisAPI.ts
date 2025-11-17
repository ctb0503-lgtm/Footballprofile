import { useCallback, useState } from "react";
import {
  generateAnalysisProfile,
  askAnalystFollowUp,
  generateKeyContent,
} from "@/services/apiService";
import { Profile } from "@/types";

interface UseAnalysisAPIReturn {
  // Main profile generation
  generateProfile: (
    userQuery: string,
    systemPrompt: string,
    apiKey: string,
  ) => Promise<void>;
  profileLoading: boolean;
  profileError: string | null;

  // Follow-up question
  askFollowUp: (
    question: string,
    context: string,
    systemPrompt: string,
    apiKey: string,
  ) => Promise<void>;
  followUpLoading: boolean;
  followUpError: string | null;

  // Key learnings
  generateLearnings: (
    analysisText: string,
    rawData: string,
    systemPrompt: string,
    apiKey: string,
  ) => Promise<void>;
  learningsLoading: boolean;
  learningsError: string | null;

  // Key charts
  generateCharts: (
    analysisText: string,
    rawData: string,
    systemPrompt: string,
    apiKey: string,
  ) => Promise<void>;
  chartsLoading: boolean;
  chartsError: string | null;

  // Key visualisations
  generateVisualisations: (
    analysisText: string,
    rawData: string,
    systemPrompt: string,
    apiKey: string,
  ) => Promise<void>;
  visualisationsLoading: boolean;
  visualisationsError: string | null;
}

export const useAnalysisAPI = (
  onProfileGenerated: (profile: Profile) => void,
  onFollowUpAnswered: (answer: Profile) => void,
  onLearningsGenerated: (learnings: Profile) => void,
  onChartsGenerated: (charts: Profile) => void,
  onVisualisationsGenerated: (visualisations: Profile) => void,
): UseAnalysisAPIReturn => {
  // Main profile
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Follow-up
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // Learnings
  const [learningsLoading, setLearningsLoading] = useState(false);
  const [learningsError, setLearningsError] = useState<string | null>(null);

  // Charts
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Visualisations
  const [visualisationsLoading, setVisualisationsLoading] = useState(false);
  const [visualisationsError, setVisualisationsError] = useState<string | null>(
    null,
  );

  // Generate profile
  const generateProfile = useCallback(
    async (userQuery: string, systemPrompt: string, apiKey: string) => {
      setProfileLoading(true);
      setProfileError(null);

      try {
        const profile = await generateAnalysisProfile(
          userQuery,
          systemPrompt,
          apiKey,
        );
        onProfileGenerated(profile);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setProfileError(errorMessage);
      } finally {
        setProfileLoading(false);
      }
    },
    [onProfileGenerated],
  );

  // Ask follow-up
  const askFollowUp = useCallback(
    async (
      question: string,
      context: string,
      systemPrompt: string,
      apiKey: string,
    ) => {
      setFollowUpLoading(true);
      setFollowUpError(null);

      try {
        const answer = await askAnalystFollowUp(
          question,
          context,
          systemPrompt,
          apiKey,
        );
        onFollowUpAnswered(answer);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setFollowUpError(errorMessage);
      } finally {
        setFollowUpLoading(false);
      }
    },
    [onFollowUpAnswered],
  );

  // Generate learnings
  const generateLearnings = useCallback(
    async (
      analysisText: string,
      rawData: string,
      systemPrompt: string,
      apiKey: string,
    ) => {
      setLearningsLoading(true);
      setLearningsError(null);

      try {
        const learnings = await generateKeyContent(
          analysisText,
          rawData,
          systemPrompt,
          apiKey,
        );
        onLearningsGenerated(learnings);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setLearningsError(errorMessage);
      } finally {
        setLearningsLoading(false);
      }
    },
    [onLearningsGenerated],
  );

  // Generate charts
  const generateCharts = useCallback(
    async (
      analysisText: string,
      rawData: string,
      systemPrompt: string,
      apiKey: string,
    ) => {
      setChartsLoading(true);
      setChartsError(null);

      try {
        const charts = await generateKeyContent(
          analysisText,
          rawData,
          systemPrompt,
          apiKey,
        );
        onChartsGenerated(charts);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setChartsError(errorMessage);
      } finally {
        setChartsLoading(false);
      }
    },
    [onChartsGenerated],
  );

  // Generate visualisations
  const generateVisualisations = useCallback(
    async (
      analysisText: string,
      rawData: string,
      systemPrompt: string,
      apiKey: string,
    ) => {
      setVisualisationsLoading(true);
      setVisualisationsError(null);

      try {
        const visualisations = await generateKeyContent(
          analysisText,
          rawData,
          systemPrompt,
          apiKey,
        );
        onVisualisationsGenerated(visualisations);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setVisualisationsError(errorMessage);
      } finally {
        setVisualisationsLoading(false);
      }
    },
    [onVisualisationsGenerated],
  );

  return {
    generateProfile,
    profileLoading,
    profileError,
    askFollowUp,
    followUpLoading,
    followUpError,
    generateLearnings,
    learningsLoading,
    learningsError,
    generateCharts,
    chartsLoading,
    chartsError,
    generateVisualisations,
    visualisationsLoading,
    visualisationsError,
  };
};
