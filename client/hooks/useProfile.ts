// client/hooks/useProfile.ts

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Profile,
  ProfileInputs,
  PPGChartData,
  SegmentChartData,
  VolatilityStats, // <--- ADDED
} from "@/types";
import {
  parsePpgBlock,
  parseIndexBlock,
  parseNewFiveMinSegmentData,
  parseHalfDataBlock,
  parseLeagueTable,
  parseVolatilityData, // <--- ADDED
} from "@/services/parsingService";
import { VOLATILITY_DEFAULT_STATE } from "@/utils/constants"; // <--- ADDED

// --- Helper to load draft state (Inferred from useAutosave in FootballTrader.tsx) ---
const loadDraft = (key: string, field: string, defaultValue: string = "") => {
  if (typeof window !== "undefined") {
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        const parsed = JSON.parse(draft);
        return parsed[field] ?? defaultValue;
      }
    } catch (e) {
      // console.error("Error parsing saved draft:", e);
    }
  }
  return defaultValue;
};
// ------------------------------------------------------------------------------------


export const useProfile = () => {
  // --- API Key management (EXISTING SNIPPET) ---
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Also set on window for backwards compatibility
    (window as any).__gemini_api_key = key;
  }, []);

  // Load API key on mount (EXISTING SNIPPET)
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      (window as any).__gemini_api_key = savedKey;
    }
  }, []);
  // ----------------------------------------------

  // --- INPUT STATES (Extended based on usage in FootballTrader.tsx) ---
  const [teamA, setTeamA] = useState(loadDraft("football-trader-draft", "teamA"));
  const [teamB, setTeamB] = useState(loadDraft("football-trader-draft", "teamB"));
  const [ppgBlock, setPpgBlock] = useState(loadDraft("football-trader-draft", "ppgBlock"));
  const [indexBlock, setIndexBlock] = useState(loadDraft("football-trader-draft", "indexBlock"));
  const [homeFiveMinSegmentBlock, setHomeFiveMinSegmentBlock] = useState(loadDraft("football-trader-draft", "homeFiveMinSegmentBlock"));
  const [awayFiveMinSegmentBlock, setAwayFiveMinSegmentBlock] = useState(loadDraft("football-trader-draft", "awayFiveMinSegmentBlock"));
  const [halfDataScoredBlock, setHalfDataScoredBlock] = useState(loadDraft("football-trader-draft", "halfDataScoredBlock"));
  const [halfDataConcededBlock, setHalfDataConcededBlock] = useState(loadDraft("football-trader-draft", "halfDataConcededBlock"));
  const [overallStats, setOverallStats] = useState(loadDraft("football-trader-draft", "overallStats"));
  const [atVenueStats, setAtVenueStats] = useState(loadDraft("football-trader-draft", "atVenueStats"));
  const [leagueTable, setLeagueTable] = useState(loadDraft("football-trader-draft", "leagueTable"));
  const [homeRawResults, setHomeRawResults] = useState(loadDraft("football-trader-draft", "homeRawResults"));
  const [awayRawResults, setAwayRawResults] = useState(loadDraft("football-trader-draft", "awayRawResults"));
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  // -------------------------------------------------------------------

  // --- OUTPUT STATES (Extended based on usage in FootballTrader.tsx) ---
  const [profile, setProfile] = useState<Profile>({ text: "", sources: [] });
  const [followUpAnswer, setFollowUpAnswer] = useState<string>("");
  const [keyLearnings, setKeyLearnings] = useState<string>("");
  const [keyCharts, setKeyCharts] = useState<string>("");
  const [keyVisualisations, setKeyVisualisations] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("report");
  // ---------------------------------------------------------------------

  // --- DERIVED CHART DATA (For use in the report and other tabs) ---
  const [ppgChartData, setPpgChartData] = useState<PPGChartData[]>([]);
  const [fiveMinSegmentChartData, setFiveMinSegmentChartData] = useState<SegmentChartData[]>([]);
  
  // --- NEW VOLATILITY CALCULATION LOGIC ---
  const homeVolatility = useMemo<VolatilityStats>(() => {
    if (teamA && homeRawResults) {
      return parseVolatilityData(homeRawResults, teamA, "home");
    }
    return VOLATILITY_DEFAULT_STATE;
  }, [teamA, homeRawResults]);

  const awayVolatility = useMemo<VolatilityStats>(() => {
    if (teamB && awayRawResults) {
      return parseVolatilityData(awayRawResults, teamB, "away");
    }
    return VOLATILITY_DEFAULT_STATE;
  }, [teamB, awayRawResults]);
  // -----------------------------------------------------

  // --- UTILITY FUNCTIONS (Stubs for full hook functionality) ---
  const resetProfile = useCallback(() => {
    setProfile({ text: "", sources: [] });
    setFollowUpAnswer("");
    setKeyLearnings("");
    setKeyCharts("");
    setKeyVisualisations("");
    setActiveTab("report");
    setPpgChartData([]);
    setFiveMinSegmentChartData([]);
  }, []);

  const updateChartData = useCallback(() => {
    // This populates the data used by PpgChart and FiveMinSegmentChart in RenderedProfile.tsx
    const ppgResult = parsePpgBlock(ppgBlock, teamA, teamB);
    setPpgChartData(ppgResult.chartData);

    const segmentResult = parseNewFiveMinSegmentData(homeFiveMinSegmentBlock, awayFiveMinSegmentBlock);
    setFiveMinSegmentChartData(segmentResult.chartData);
  }, [ppgBlock, teamA, teamB, homeFiveMinSegmentBlock, awayFiveMinSegmentBlock]);
  
  const getInputs = useCallback((): ProfileInputs => {
    return {
      ppgBlock, indexBlock, homeFiveMinSegmentBlock, awayFiveMinSegmentBlock,
      halfDataScoredBlock, halfDataConcededBlock, overallStats, atVenueStats,
      leagueTable, homeRawResults, awayRawResults,
    };
  }, [
    ppgBlock, indexBlock, homeFiveMinSegmentBlock, awayFiveMinSegmentBlock,
    halfDataScoredBlock, halfDataConcededBlock, overallStats, atVenueStats,
    leagueTable, homeRawResults, awayRawResults,
  ]);
  
  const loadProfile = useCallback((
    newTeamA: string, newTeamB: string, newProfileText: string, newSources: any[], newInputs: ProfileInputs,
  ) => {
    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setProfile({ text: newProfileText, sources: newSources });
    // Assuming a complete load mechanism to restore all inputs
    setPpgBlock(newInputs.ppgBlock);
    setIndexBlock(newInputs.indexBlock);
    setHomeFiveMinSegmentBlock(newInputs.homeFiveMinSegmentBlock);
    setAwayFiveMinSegmentBlock(newInputs.awayFiveMinSegmentBlock);
    setHalfDataScoredBlock(newInputs.halfDataScoredBlock);
    setHalfDataConcededBlock(newInputs.halfDataConcededBlock);
    setOverallStats(newInputs.overallStats);
    setAtVenueStats(newInputs.atVenueStats);
    setLeagueTable(newInputs.leagueTable);
    setHomeRawResults(newInputs.homeRawResults);
    setAwayRawResults(newInputs.awayRawResults);
  }, []);
  
  const getParsedData = useCallback(() => {
    return {
        ppg: parsePpgBlock(ppgBlock, teamA, teamB),
        index: parseIndexBlock(indexBlock),
        fiveMin: parseNewFiveMinSegmentData(homeFiveMinSegmentBlock, awayFiveMinSegmentBlock),
        halfScored: parseHalfDataBlock(halfDataScoredBlock),
        halfConceded: parseHalfDataBlock(halfDataConcededBlock),
    };
  }, [ppgBlock, teamA, teamB, indexBlock, homeFiveMinSegmentBlock, awayFiveMinSegmentBlock, halfDataScoredBlock, halfDataConcededBlock]);
  // -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  return {
    // API Key management (EXISTING SNIPPET)
    apiKey,
    saveApiKey,
    
    // Inputs (for binding to UI and persistence)
    teamA, setTeamA,
    teamB, setTeamB,
    ppgBlock, setPpgBlock,
    indexBlock, setIndexBlock,
    homeFiveMinSegmentBlock, setHomeFiveMinSegmentBlock,
    awayFiveMinSegmentBlock, setAwayFiveMinSegmentBlock,
    halfDataScoredBlock, setHalfDataScoredBlock,
    halfDataConcededBlock, setHalfDataConcededBlock,
    overallStats, setOverallStats,
    atVenueStats, setAtVenueStats,
    leagueTable, setLeagueTable,
    homeRawResults, setHomeRawResults,
    awayRawResults, setAwayRawResults,
    followUpQuestion, setFollowUpQuestion,

    // Outputs & Derived Data
    profile, setProfile,
    ppgChartData,
    fiveMinSegmentChartData,
    homeVolatility, // <--- NEW EXPORT
    awayVolatility, // <--- NEW EXPORT
    followUpAnswer, setFollowUpAnswer,
    keyLearnings, setKeyLearnings,
    keyCharts, setKeyCharts,
    keyVisualisations, setKeyVisualisations,

    // Other state for UI
    activeTab, setActiveTab,

    // Functions
    getInputs,
    getParsedData,
    updateChartData,
    resetProfile,
    loadProfile,
  };
};
