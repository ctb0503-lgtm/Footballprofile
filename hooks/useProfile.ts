import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Profile,
  ProfileInputs,
  PPGChartData,
  SegmentChartData,
  VolatilityStats,
  ResilienceStats,
  HalfDataStats,
  OpponentQualityStats,
  RawResultsStats,
  TradingAngle // NEW IMPORT
} from "@/types";
import {
  parsePpgBlock,
  parseIndexBlock,
  parseNewFiveMinSegmentData,
  parseHalfDataBlock,
  parseVolatilityData,
  parsePpgForFlags,
  parseVenueForFlags,
  parseIndexForFlags,
  parse5MinForFlags,
  parseResilienceForFlags,
  parseHalfDataForFlags,
  parseOpponentQualityResults,
  parseLeagueTable,
  parseRawResultsData,
} from "@/services/parsingService";
import { VOLATILITY_DEFAULT_STATE } from "@/utils/constants";

const loadDraft = (key: string, field: string, defaultValue: string = "") => {
  if (typeof window !== "undefined") {
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        const parsed = JSON.parse(draft);
        return parsed[field] ?? defaultValue;
      }
    } catch (e) {
    }
  }
  return defaultValue;
};

const getTeamRank = (leagueTable: string, teamName: string): number | null => {
  if (!leagueTable || !teamName) return null;
  const lines = leagueTable.split('\n');
  const lowerTeamName = teamName.toLowerCase();
  const tableRegex = /^\s*(\d+)\.?\s+(.+?)\s+\d+/;

  for (const line of lines) {
    const match = line.trim().match(tableRegex);
    if (match) {
      const rank = parseInt(match[1], 10);
      const team = match[2].trim().toLowerCase();
      if (team === lowerTeamName) return rank;
    }
  }
  return null;
};


export const useProfile = () => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  }, []);

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

  const [profile, setProfile] = useState<Profile>({ text: "", sources: [] });
  const [followUpAnswer, setFollowUpAnswer] = useState<string>("");
  const [keyLearnings, setKeyLearnings] = useState<string>("");
  const [keyCharts, setKeyCharts] = useState<string>("");
  const [keyVisualisations, setKeyVisualisations] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("report");

  // NEW: State for Trading Angles
  const [tradingAngles, setTradingAngles] = useState<TradingAngle[]>([]);

  const [ppgChartData, setPpgChartData] = useState<PPGChartData[]>([]);
  const [fiveMinSegmentChartData, setFiveMinSegmentChartData] = useState<SegmentChartData[]>([]);

  const homeVolatility = useMemo<VolatilityStats>(() => {
    if (teamA && homeRawResults) {
      return parseVolatilityData(homeRawResults, teamA);
    }
    return VOLATILITY_DEFAULT_STATE;
  }, [teamA, homeRawResults]);

  const awayVolatility = useMemo<VolatilityStats>(() => {
    if (teamB && awayRawResults) {
      return parseVolatilityData(awayRawResults, teamB);
    }
    return VOLATILITY_DEFAULT_STATE;
  }, [teamB, awayRawResults]);

  const homeExtendedStats = useMemo<RawResultsStats>(() => {
     return parseRawResultsData(homeRawResults, teamA);
  }, [homeRawResults, teamA]);

  const awayExtendedStats = useMemo<RawResultsStats>(() => {
      return parseRawResultsData(awayRawResults, teamB);
  }, [awayRawResults, teamB]);

  const opponentQualityAnalysis = useMemo(() => {
    const homeTeamRank = getTeamRank(leagueTable, teamA);
    const awayTeamRank = getTeamRank(leagueTable, teamB);

    const homeVsSimilarAway = parseOpponentQualityResults(
        leagueTable,
        homeRawResults,
        teamA,
        teamB,
        awayTeamRank
    );

    const awayVsSimilarHome = parseOpponentQualityResults(
        leagueTable,
        awayRawResults,
        teamB,
        teamA,
        homeTeamRank
    );

    return {
        homeVsSimilarAway,
        awayVsSimilarHome,
        homeTeamRank,
        awayTeamRank
    };
  }, [leagueTable, homeRawResults, awayRawResults, teamA, teamB]);

  const analyticalFlagData = useMemo(() => {
    try {
      return {
        ppg: parsePpgForFlags(ppgBlock),
        venue: parseVenueForFlags(atVenueStats),
        index: parseIndexForFlags(indexBlock),
        fiveMin: parse5MinForFlags(homeFiveMinSegmentBlock, awayFiveMinSegmentBlock),
        resilience: parseResilienceForFlags(homeRawResults, awayRawResults, teamA, teamB),
        half: parseHalfDataForFlags(halfDataScoredBlock, halfDataConcededBlock),
      };
    } catch (error) {
      console.error("Error parsing flag data:", error);
      return null;
    }
  }, [
    ppgBlock, atVenueStats, indexBlock,
    homeFiveMinSegmentBlock, awayFiveMinSegmentBlock,
    homeRawResults, awayRawResults, teamA, teamB,
    halfDataScoredBlock, halfDataConcededBlock
  ]);

  const resetProfile = useCallback(() => {
    setProfile({ text: "", sources: [] });
    setFollowUpAnswer("");
    setKeyLearnings("");
    setKeyCharts("");
    setKeyVisualisations("");
    setTradingAngles([]); // Reset angles too
    setActiveTab("report");
    setPpgChartData([]);
    setFiveMinSegmentChartData([]);
  }, []);

  const updateChartData = useCallback(() => {
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
    newTeamA: string, newTeamB: string, newProfileText: string, newSources: any[], newInputs: ProfileInputs, newTradingAngles: TradingAngle[] = []
  ) => {
    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setProfile({ text: newProfileText, sources: newSources });
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
    setTradingAngles(newTradingAngles || []); // Load angles
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

  // NEW: Helper to toggle trading angle status
  const updateAngleStatus = useCallback((id: string, status: 'won' | 'lost' | 'void' | 'pending') => {
    setTradingAngles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  return {
    apiKey,
    saveApiKey,

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

    profile, setProfile,
    ppgChartData,
    fiveMinSegmentChartData,
    homeVolatility,
    awayVolatility,
    homeExtendedStats,
    awayExtendedStats,
    analyticalFlagData,
    opponentQualityAnalysis,
    followUpAnswer, setFollowUpAnswer,
    keyLearnings, setKeyLearnings,
    keyCharts, setKeyCharts,
    keyVisualisations, setKeyVisualisations,

    // Trading Angles
    tradingAngles, setTradingAngles, updateAngleStatus,

    activeTab, setActiveTab,

    getInputs,
    getParsedData,
    updateChartData,
    resetProfile,
    loadProfile,
  };
};
