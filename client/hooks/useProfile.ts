import { useState, useCallback } from "react";
import {
  Profile,
  ProfileInputs,
  PPGChartData,
  SegmentChartData,
} from "@/types";
import {
  parsePpgBlock,
  parseIndexBlock,
  parseNewFiveMinSegmentData,
  parseHalfDataBlock,
  parseLeagueTable,
} from "@/services/parsingService";

export const useProfile = () => {
  // Team names
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  // Profile inputs
  const [ppgBlock, setPpgBlock] = useState("");
  const [indexBlock, setIndexBlock] = useState("");
  const [homeFiveMinSegmentBlock, setHomeFiveMinSegmentBlock] = useState("");
  const [awayFiveMinSegmentBlock, setAwayFiveMinSegmentBlock] = useState("");
  const [halfDataScoredBlock, setHalfDataScoredBlock] = useState("");
  const [halfDataConcededBlock, setHalfDataConcededBlock] = useState("");
  const [overallStats, setOverallStats] = useState("");
  const [atVenueStats, setAtVenueStats] = useState("");
  const [leagueTable, setLeagueTable] = useState("");
  const [homeRawResults, setHomeRawResults] = useState("");
  const [awayRawResults, setAwayRawResults] = useState("");

  // Generated profile
  const [profile, setProfile] = useState<Profile>({ text: "", sources: [] });

  // Chart data
  const [ppgChartData, setPpgChartData] = useState<PPGChartData[]>([]);
  const [fiveMinSegmentChartData, setFiveMinSegmentChartData] = useState<
    SegmentChartData[]
  >([]);

  // State for follow-up
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  // State for lazy-loaded content
  const [keyLearnings, setKeyLearnings] = useState("");
  const [keyCharts, setKeyCharts] = useState("");
  const [keyVisualisations, setKeyVisualisations] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<
    | "report"
    | "charts"
    | "visualisations"
    | "analyst"
    | "learnings"
    | "myProfiles"
  >("report");

  // Get all inputs as an object
  const getInputs = useCallback((): ProfileInputs => {
    return {
      ppgBlock,
      indexBlock,
      homeFiveMinSegmentBlock,
      awayFiveMinSegmentBlock,
      halfDataScoredBlock,
      halfDataConcededBlock,
      overallStats,
      atVenueStats,
      leagueTable,
      homeRawResults,
      awayRawResults,
    };
  }, [
    ppgBlock,
    indexBlock,
    homeFiveMinSegmentBlock,
    awayFiveMinSegmentBlock,
    halfDataScoredBlock,
    halfDataConcededBlock,
    overallStats,
    atVenueStats,
    leagueTable,
    homeRawResults,
    awayRawResults,
  ]);

  // Parse and set chart data
  const updateChartData = useCallback(() => {
    const ppgData = parsePpgBlock(ppgBlock, teamA, teamB);
    const segmentData = parseNewFiveMinSegmentData(
      homeFiveMinSegmentBlock,
      awayFiveMinSegmentBlock,
    );

    setPpgChartData(ppgData.chartData);
    setFiveMinSegmentChartData(segmentData.chartData);
  }, [
    ppgBlock,
    homeFiveMinSegmentBlock,
    awayFiveMinSegmentBlock,
    teamA,
    teamB,
  ]);

  // Get parsed data for API calls
  const getParsedData = useCallback(() => {
    const ppgData = parsePpgBlock(ppgBlock, teamA, teamB);
    const indexData = parseIndexBlock(indexBlock);
    const segmentData = parseNewFiveMinSegmentData(
      homeFiveMinSegmentBlock,
      awayFiveMinSegmentBlock,
    );
    const parsedScoredHalfData = parseHalfDataBlock(halfDataScoredBlock);
    const parsedConcededHalfData = parseHalfDataBlock(halfDataConcededBlock);
    const numberOfTeams = parseLeagueTable(leagueTable);

    return {
      ppgData,
      indexData,
      segmentData,
      parsedScoredHalfData,
      parsedConcededHalfData,
      numberOfTeams,
    };
  }, [
    ppgBlock,
    indexBlock,
    homeFiveMinSegmentBlock,
    awayFiveMinSegmentBlock,
    halfDataScoredBlock,
    halfDataConcededBlock,
    leagueTable,
    teamA,
    teamB,
  ]);

  // Reset all state
  const resetProfile = useCallback(() => {
    setProfile({ text: "", sources: [] });
    setPpgChartData([]);
    setFiveMinSegmentChartData([]);
    setFollowUpQuestion("");
    setFollowUpAnswer("");
    setKeyLearnings("");
    setKeyCharts("");
    setKeyVisualisations("");
    setActiveTab("report");
  }, []);

  // Load a saved profile
  const loadProfile = useCallback(
    (
      teamAName: string,
      teamBName: string,
      profileText: string,
      sources: any[],
      inputs: ProfileInputs,
    ) => {
      setTeamA(teamAName);
      setTeamB(teamBName);
      setPpgBlock(inputs.ppgBlock);
      setIndexBlock(inputs.indexBlock);
      setHomeFiveMinSegmentBlock(inputs.homeFiveMinSegmentBlock);
      setAwayFiveMinSegmentBlock(inputs.awayFiveMinSegmentBlock);
      setHalfDataScoredBlock(inputs.halfDataScoredBlock);
      setHalfDataConcededBlock(inputs.halfDataConcededBlock);
      setOverallStats(inputs.overallStats);
      setAtVenueStats(inputs.atVenueStats);
      setLeagueTable(inputs.leagueTable);
      setHomeRawResults(inputs.homeRawResults);
      setAwayRawResults(inputs.awayRawResults);

      setProfile({ text: profileText, sources });
      setFollowUpQuestion("");
      setFollowUpAnswer("");
      setKeyCharts("");
      setKeyLearnings("");
      setKeyVisualisations("");
      setActiveTab("report");

      // Re-run parsers
      const ppgData = parsePpgBlock(inputs.ppgBlock, teamAName, teamBName);
      const segmentData = parseNewFiveMinSegmentData(
        inputs.homeFiveMinSegmentBlock,
        inputs.awayFiveMinSegmentBlock,
      );
      setPpgChartData(ppgData.chartData);
      setFiveMinSegmentChartData(segmentData.chartData);
    },
    [],
  );

  return {
    // Team names
    teamA,
    setTeamA,
    teamB,
    setTeamB,

    // Inputs
    ppgBlock,
    setPpgBlock,
    indexBlock,
    setIndexBlock,
    homeFiveMinSegmentBlock,
    setHomeFiveMinSegmentBlock,
    awayFiveMinSegmentBlock,
    setAwayFiveMinSegmentBlock,
    halfDataScoredBlock,
    setHalfDataScoredBlock,
    halfDataConcededBlock,
    setHalfDataConcededBlock,
    overallStats,
    setOverallStats,
    atVenueStats,
    setAtVenueStats,
    leagueTable,
    setLeagueTable,
    homeRawResults,
    setHomeRawResults,
    awayRawResults,
    setAwayRawResults,

    // Profile
    profile,
    setProfile,

    // Chart data
    ppgChartData,
    fiveMinSegmentChartData,

    // Follow-up
    followUpQuestion,
    setFollowUpQuestion,
    followUpAnswer,
    setFollowUpAnswer,

    // Lazy-loaded content
    keyLearnings,
    setKeyLearnings,
    keyCharts,
    setKeyCharts,
    keyVisualisations,
    setKeyVisualisations,

    // Tab state
    activeTab,
    setActiveTab,

    // Methods
    getInputs,
    updateChartData,
    getParsedData,
    resetProfile,
    loadProfile,
  };
};
