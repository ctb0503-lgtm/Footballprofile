import { useEffect, useCallback, useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useLocalProfiles } from "@/hooks/useLocalProfiles";
import { useAnalysisAPI } from "@/hooks/useAnalysisAPI";
import { useAutosave } from "@/hooks/useAutosave";
import { useDailyPlan } from "@/hooks/useDailyPlan";
import { extractStrategiesFromMarkdown, extractTradingAngles } from "@/services/parsingService";
import { STRATEGY_BENCHMARKS } from "@/utils/strategyBenchmarks";

import {
  SYSTEM_PROMPT,
  FOLLOW_UP_SYSTEM_PROMPT,
  KEY_LEARNINGS_SYSTEM_PROMPT,
  KEY_CHARTS_SYSTEM_PROMPT,
  KEY_VISUALISATIONS_SYSTEM_PROMPT,
  TEAM_NEWS_SYSTEM_PROMPT,
} from "@/utils/constants";

// Icons
import {
  FootballIcon,
  ErrorIcon,
  SaveIcon,
  LoadIcon,
  DeleteIcon,
  TeamNewsIcon,
  LoadingIcon,
} from "@/components/icons";
import { ChevronDown, ChevronUp, Trash2, PlusCircle, CalendarCheck, CheckCircle, Target, TrendingUp, PenTool, Timer, BookOpen } from "lucide-react"; // Added BookOpen

// Form components
import { StatsTextarea } from "@/components/forms/StatsTextarea";
import { ApiKeyInput } from "@/components/forms/ApiKeyInput";

// UI Components
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TabButton } from "@/components/tabs/TabButton";
import { TabContent } from "@/components/tabs/TabContent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Charts & analysis
import { RenderedProfile } from "@/components/analysis/RenderedProfile";
import { LeagueStyleQuadrantChart, GoalHeatmap } from "@/components/charts";
import { FormPulseChart } from "@/components/charts/FormPulseChart";
import { KillZoneRadar } from "@/components/charts/KillZoneRadar";
import { OpponentScatter } from "@/components/charts/OpponentScatter";
import { TaleOfTheTape } from "@/components/cards/TaleOfTheTape";
import { FastStartCard } from "@/components/cards/FastStartCard";
import { VolatilityCard } from "@/components/cards/VolatilityCard";
import { MatchVolatilityCard } from "@/components/cards/MatchVolatilityCard";
import { StrategyBenchmarkCard } from "@/components/cards/StrategyBenchmarkCard"; // NEW IMPORT
import { LoadingProgress } from "@/components/LoadingProgress";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { AnalyticalFlagDisplay } from "@/components/analysis/AnalyticalFlagDisplay";
import { DailyTradingPlan } from "@/components/DailyTradingPlan";

import { Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";

const APP_ID = "default-app-id";

export const FootballTrader = () => {
  // Profile management
  const profile = useProfile();
  const localProfiles = useLocalProfiles();
  const dailyPlan = useDailyPlan();
  const { toast } = useToast();

  const [teamNews, setTeamNews] = useState<Profile>({ text: "", sources: [] });
  const [fastStartContext, setFastStartContext] = useState<Profile>({ text: "", sources: [] });

  const [customStrategyTitle, setCustomStrategyTitle] = useState("");
  const [customStrategyReason, setCustomStrategyReason] = useState("");

  // API calls
  const api = useAnalysisAPI(
    (prof) => profile.setProfile(prof),
    (answer) => profile.setFollowUpAnswer(answer.text),
    (learnings) => profile.setKeyLearnings(learnings.text),
    (charts) => profile.setKeyCharts(charts.text),
    (visualisations) => profile.setKeyVisualisations(visualisations.text),
    (news) => setTeamNews(news)
  );

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<"analyzing" | "searching" | "generating">("analyzing");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFastStartLoading, setIsFastStartLoading] = useState(false);

  // UI State
  const [isInputsOpen, setIsInputsOpen] = useState(true);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Autosave
  useAutosave(
    {
      teamA: profile.teamA,
      teamB: profile.teamB,
      ppgBlock: profile.ppgBlock,
      indexBlock: profile.indexBlock,
      homeFiveMinSegmentBlock: profile.homeFiveMinSegmentBlock,
      awayFiveMinSegmentBlock: profile.awayFiveMinSegmentBlock,
      halfDataScoredBlock: profile.halfDataScoredBlock,
      halfDataConcededBlock: profile.halfDataConcededBlock,
      overallStats: profile.overallStats,
      atVenueStats: profile.atVenueStats,
      leagueTable: profile.leagueTable,
      homeRawResults: profile.homeRawResults,
      awayRawResults: profile.awayRawResults,
    },
    'football-trader-draft',
    1000
  );

  // Lazy-load tabs logic
  useEffect(() => {
    if (!profile.profile.text) return;

    const rawData = constructRawData();

    if (profile.activeTab === "charts" && !profile.keyCharts && !api.chartsLoading) {
      api.generateCharts(
        profile.profile.text,
        rawData,
        KEY_CHARTS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }

    if (profile.activeTab === "learnings" && !profile.keyLearnings && !api.learningsLoading) {
      api.generateLearnings(
        profile.profile.text,
        rawData,
        KEY_LEARNINGS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }

    if (profile.activeTab === "visualisations" && !profile.keyVisualisations && !api.visualisationsLoading) {
      api.generateVisualisations(
        profile.profile.text,
        rawData,
        KEY_VISUALISATIONS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }
  }, [profile.activeTab, profile.profile.text, api, profile.apiKey]);

  useEffect(() => {
    setTeamNews({ text: "", sources: [] });
    setFastStartContext({ text: "", sources: [] });
  }, [profile.teamA, profile.teamB]);

  const constructRawData = useCallback(() => {
    return `
    PPG Block: ${profile.ppgBlock || "N/A"}
    Index Block: ${profile.indexBlock || "N/A"}
    Home 5-Min: ${profile.homeFiveMinSegmentBlock || "N/A"}
    Away 5-Min: ${profile.awayFiveMinSegmentBlock || "N/A"}
    Half Data (Scored): ${profile.halfDataScoredBlock || "N/A"}
    Half Data (Conceded): ${profile.halfDataConcededBlock || "N/A"}
    Overall Stats: ${profile.overallStats || "N/A"}
    At Venue Stats: ${profile.atVenueStats || "N/A"}
    League Table: ${profile.leagueTable || "N/A"}
    Home Raw Results: ${profile.homeRawResults || "N/A"}
    Away Raw Results: ${profile.awayRawResults || "N/A"}
    `;
  }, [
    profile.ppgBlock, profile.indexBlock,
    profile.homeFiveMinSegmentBlock, profile.awayFiveMinSegmentBlock,
    profile.halfDataScoredBlock, profile.halfDataConcededBlock,
    profile.overallStats, profile.atVenueStats,
    profile.leagueTable, profile.homeRawResults, profile.awayRawResults
  ]);

  const matchedStrategies = useMemo(() => {
      return extractStrategiesFromMarkdown(profile.profile.text);
  }, [profile.profile.text]);

  const aiTradingAngles = useMemo(() => {
      return extractTradingAngles(profile.profile.text);
  }, [profile.profile.text]);

  const handleAddCustomStrategy = () => {
    if (!customStrategyTitle) return;
    dailyPlan.addToPlan({
        match: `${profile.teamA} vs ${profile.teamB}`,
        strategy: customStrategyTitle,
        confidence: "Manual",
        notes: customStrategyReason
    });
    setCustomStrategyTitle("");
    setCustomStrategyReason("");
    toast({ title: "Added to Journal", description: "Custom strategy added successfully." });
  };

  const handleClearAll = () => {
      profile.setTeamA("");
      profile.setTeamB("");
      profile.setPpgBlock("");
      profile.setIndexBlock("");
      profile.setHomeFiveMinSegmentBlock("");
      profile.setAwayFiveMinSegmentBlock("");
      profile.setHalfDataScoredBlock("");
      profile.setHalfDataConcededBlock("");
      profile.setOverallStats("");
      profile.setAtVenueStats("");
      profile.setLeagueTable("");
      profile.setHomeRawResults("");
      profile.setAwayRawResults("");
      setGeneralError(null);
      profile.resetProfile();
      setIsClearConfirmOpen(false);
      toast({
        title: "Data Cleared",
        description: "All input data has been reset.",
      });
  };

  const handleClearAllConfirm = () => {
    setIsClearConfirmOpen(true);
  };

  const validateInputs = () => {
    const errors = [];

    if (!profile.teamA || !profile.teamB) {
      errors.push('Both team names are required');
    }

    if (!profile.ppgBlock || !profile.indexBlock) {
      errors.push('PPG and Index blocks are required for analysis');
    }

    if (!profile.apiKey) {
      errors.push('API key is required');
    }

    if (errors.length > 0) {
      setGeneralError(errors.join('; '));
      return false;
    }

    return true;
  };

  const handleGenerateProfile = async () => {
    setGeneralError(null);
    if (!validateInputs()) {
      return;
    }

    setIsGenerating(true);
    profile.resetProfile();
    setTeamNews({ text: "", sources: [] });
    setFastStartContext({ text: "", sources: [] });
    setIsInputsOpen(false);

    try {
      setLoadingStage("searching");

      const newsPromise = api.generateTeamNews(
        profile.teamA,
        profile.teamB,
        TEAM_NEWS_SYSTEM_PROMPT,
        profile.apiKey,
      );

      const fastStartPrompt = `
      **TASK: Find Goal Timing Statistics for ${profile.teamA} and ${profile.teamB}.**

      You must find:
      1. **Average Minute of First Goal SCORED** for both teams this season.
      2. **Average Minute of First Goal CONCEDED** for both teams this season.
      3. **Percentage of goals scored in the first 15 minutes** for both teams.

      **CRITICAL OUTPUT FORMAT:**
      You MUST return a markdown list exactly like this:
      * **${profile.teamA} (Avg Scored Time):** [e.g. 34th min]
      * **${profile.teamA} (Avg Conceded Time):** [e.g. 22nd min]
      * **${profile.teamB} (Avg Scored Time):** [e.g. 45th min]
      * **${profile.teamB} (Avg Conceded Time):** [e.g. 60th min]
      * **Fast Start Verdict:** [e.g. "HIGH PROBABILITY" or "LOW PROBABILITY" based on the times found].

      If exact "average minute" is not found, look for "most common scoring period" or "first half goal percentage".
      `;

      const fastStartPromise = api.generateTeamNews(
           profile.teamA,
           profile.teamB,
           fastStartPrompt,
           profile.apiKey
      );

      const [news, fastStartData] = await Promise.all([newsPromise, fastStartPromise]);

      setTeamNews(news);
      setFastStartContext(fastStartData);

      setLoadingStage("analyzing");
      const flags = profile.analyticalFlagData;
      const quality = profile.opponentQualityAnalysis;
      const homeExt = profile.homeExtendedStats;
      const awayExt = profile.awayExtendedStats;

      const flagContext = flags ? `
      **VERIFIED PARSED STATS (USE THESE VALUES, THEY ARE CORRECT):**
      - Home Scoring Rate (H@H): ${flags.venue.homeScoringRate}
      - Away Scoring Rate (A@A): ${flags.venue.awayScoringRate}
      - Home Conceding Rate (H@H): ${flags.venue.homeConcedingRate}
      - Away Conceding Rate (A@A): ${flags.venue.awayConcedingRate}
      - Home Games with FHG: ${flags.venue.homeFHG}%
      - Home Games with SHG: ${flags.venue.homeSHG}%
      - Away Games with FHG: ${flags.venue.awayFHG}%
      - Away Games with SHG: ${flags.venue.awaySHG}%
      - Home PPG Bias: ${flags.ppg.homeBias}
      - Away PPG Bias: ${flags.ppg.awayBias}
      - Home 1st Half Goals (H@H 0.5+): ${flags.half.homeScored1stHalfOvers}%
      - Home Goals Breakdown (1st Half %): ${flags.half.homeScored1stHalfPct}%
      - Home Conceded 1st Half (H@H 0.5+): ${flags.half.homeConceded1stHalfOvers}%
      - Home Goals Conceded Breakdown (1st Half %): ${flags.half.homeConceded1stHalfPct}%
      - Away 2nd Half Goals (A@A %): ${flags.half.awayScoredHalf2Pct}%
      - Away 2nd Half Conceded (H@H %): ${flags.half.homeConcededHalf2Pct}%

      **NEW: CRITICAL VENUE STATS:**
      - Home BTTS %: ${homeExt.gamesFound > 0 ? homeExt.bttsPercentage : flags.venue.homeBTTS}% (Calculated from Results)
      - Away BTTS %: ${awayExt.gamesFound > 0 ? awayExt.bttsPercentage : flags.venue.awayBTTS}% (Calculated from Results)
      - Home Avg Match Goals: ${homeExt.gamesFound > 0 ? homeExt.avgMatchGoals : flags.venue.homeAvgGoals} (Calculated from Results)
      - Away Avg Match Goals: ${awayExt.gamesFound > 0 ? awayExt.avgMatchGoals : flags.venue.awayAvgGoals} (Calculated from Results)
      - Home Clean Sheet %: ${homeExt.gamesFound > 0 ? homeExt.cleanSheetPercentage : flags.venue.homeCleanSheet}% (Calculated from Results)
      - Away Clean Sheet %: ${awayExt.gamesFound > 0 ? awayExt.cleanSheetPercentage : flags.venue.awayCleanSheet}% (Calculated from Results)

      **HALF-TIME DATA BREAKDOWN & DISPARITIES:**
      ${flags.half.disparityDetails || "No significant half-time data disparities found."}

      *Home Scored Stats Block (Parsed Details):*
      ${flags.half.scoredHalfDetails}

      *Home Conceded Stats Block (Parsed Details):*
      ${flags.half.concededHalfDetails}
      ` : "";

      const opponentQualityContext = (quality.homeTeamRank && quality.awayTeamRank) ? `
      **OPPONENT QUALITY ANALYSIS (Record against teams of similar rank):**
      * **Match-up:** Home Team (Rank ${quality.homeTeamRank}) vs. Away Team (Rank ${quality.awayTeamRank}).
      * **Home vs. Similar Opponents (${quality.homeVsSimilarAway.category}):**
          * Record (W-D-L): ${quality.homeVsSimilarAway.W}-${quality.homeVsSimilarAway.D}-${quality.homeVsSimilarAway.L} (from ${quality.homeVsSimilarAway.similarMatchCount} games).
          * **Insight:** How does Home perform when facing teams of Away's rank?
      * **Away vs. Similar Opponents (${quality.awayVsSimilarHome.category}):**
          * Record (W-D-L): ${quality.awayVsSimilarHome.W}-${quality.awayVsSimilarHome.D}-${quality.awayVsSimilarHome.L} (from ${quality.awayVsSimilarHome.similarMatchCount} games).
          * **Insight:** How does Away perform when facing teams of Home's rank?
      ` : `
      **OPPONENT QUALITY ANALYSIS:** Not available. League Table and/or Raw Results must be provided.
      `;

      const patternsContext = `
      **STREAKS & SCORE PATTERNS (Based on recent raw results):**
      * **Home Team (${profile.teamA}):**
          * Clean Sheet Streak: ${homeExt.cleanSheetStreak} games
          * Failed to Score Streak: ${homeExt.failedToScoreStreak} games
          * Goal Scoring Streak: ${homeExt.scoringStreak} games
          * Win Streak: ${homeExt.winStreak} | Loss Streak: ${homeExt.lossStreak}
          * Most Common Scoreline: ${homeExt.mostCommonScore}
      * **Away Team (${profile.teamB}):**
          * Clean Sheet Streak: ${awayExt.cleanSheetStreak} games
          * Failed to Score Streak: ${awayExt.failedToScoreStreak} games
          * Goal Scoring Streak: ${awayExt.scoringStreak} games
          * Win Streak: ${awayExt.winStreak} | Loss Streak: ${awayExt.lossStreak}
          * Most Common Scoreline: ${awayExt.mostCommonScore}
      `;

      const statsQuery = `
      Analyze the upcoming match: **${profile.teamA || "Home Team"} vs ${profile.teamB || "Away Team"}**.

      PPG Block: ${profile.ppgBlock || "N/A"}
      Index Block: ${profile.indexBlock || "N/A"}
      Home 5-Min: ${profile.homeFiveMinSegmentBlock || "N/A"}
      Away 5-Min: ${profile.awayFiveMinSegmentBlock || "N/A"}

      Half Data (Scored - Raw): ${profile.halfDataScoredBlock || "N/A"}
      Half Data (Conceded - Raw): ${profile.halfDataConcededBlock || "N/A"}

      Overall Stats: ${profile.overallStats || "N/A"}
      At Venue Stats: ${profile.atVenueStats || "N/A"}
      League Table: ${profile.leagueTable || "N/A"}
      Home Raw Results: ${profile.homeRawResults || "N/A"}
      Away Raw Results: ${profile.awayRawResults || "N/A"}
      `;

      const userQueryWithNews = `
        ${statsQuery}

        ---
        ${flagContext}
        ---
        ${opponentQualityContext}
        ---
        ${patternsContext}
        ---
        **WEB SEARCH: AVERAGE GOAL TIMES (Use this to identify Fast Start potential):**
        ${fastStartData.text || "Web search for goal times failed."}
        ---
        **EXTERNAL TEAM NEWS (Qualitative Context Only - Do NOT allow this to override the stats above):**
        **WARNING:** Web searches regarding recent form are often outdated. If the news below claims a specific "winning streak" or result that contradicts the "STREAKS & PATTERNS" block above, **YOU MUST IGNORE THE NEWS** and trust the raw data.
        ${news.text || "No recent team news found."}
        ---
      `;

      setLoadingStage("generating");
      await api.generateProfile(userQueryWithNews, SYSTEM_PROMPT, profile.apiKey);
      profile.updateChartData();

      toast({
        title: "Profile Generated",
        description: `Analysis complete for ${profile.teamA} vs ${profile.teamB}.`,
        variant: "default",
      });

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setGeneralError(msg);
      console.error(error);
      setIsInputsOpen(true);
      toast({
        title: "Generation Failed",
        description: `Error: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.profile.text) return;

    setIsSaving(true);
    try {
      await localProfiles.saveProfile(
        profile.teamA,
        profile.teamB,
        profile.profile.text,
        profile.profile.sources,
        profile.getInputs(),
      );
       toast({
        title: "Profile Saved",
        description: `Profile for ${profile.teamA} vs ${profile.teamB} saved locally.`,
        variant: "default",
      });
    } catch (error) {
      setGeneralError("Failed to save profile");
      toast({
        title: "Save Failed",
        description: "Failed to save profile to local storage.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProfile = (savedProfile: any) => {
    profile.loadProfile(
      savedProfile.teamA,
      savedProfile.teamB,
      savedProfile.profileText,
      savedProfile.sources,
      savedProfile.inputs,
    );
    setTeamNews({ text: "", sources: [] });
    setTimeout(() => profile.updateChartData(), 0);
    setIsInputsOpen(true);
    toast({
      title: "Profile Loaded",
      description: `Loaded profile for ${savedProfile.teamA} vs ${savedProfile.teamB}.`,
      variant: "default",
    });
  };

  useEffect(() => {
    if (profile.profile.text) {
        profile.updateChartData();
    }
  }, [profile]);


  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <FootballIcon />
            <h1 className="text-3xl font-bold text-white ml-2">
                Football Trader Profile Tool
            </h1>
          </div>
          <button
             onClick={() => profile.setActiveTab("dailyPlan")}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors"
          >
              <CalendarCheck className="h-4 w-4" />
              Daily Plan ({dailyPlan.plan.length})
          </button>
        </header>

        <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800">
          <ApiKeyInput value={profile.apiKey} onChange={profile.saveApiKey} />
        </div>

        <Collapsible
          open={isInputsOpen}
          onOpenChange={setIsInputsOpen}
          className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <div className="flex items-center gap-2">
               <CollapsibleTrigger asChild>
                 <button className="flex items-center gap-2 text-xl font-semibold text-white hover:text-green-400 transition-colors">
                    Data Inputs
                    {isInputsOpen ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                 </button>
               </CollapsibleTrigger>
            </div>
            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button
                  onClick={handleClearAllConfirm}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-900"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently clear all loaded data and input fields, including unsaved drafts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                    Yes, clear all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <CollapsibleContent className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Home Team *
                </label>
                <input
                  type="text"
                  value={profile.teamA}
                  onChange={(e) => profile.setTeamA(e.target.value)}
                  placeholder="e.g., Man City"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Away Team *
                </label>
                <input
                  type="text"
                  value={profile.teamB}
                  onChange={(e) => profile.setTeamB(e.target.value)}
                  placeholder="e.g., Liverpool"
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsTextarea
                label="PPG & GoalSense Block *"
                value={profile.ppgBlock}
                onChange={profile.setPpgBlock}
                placeholder="Paste PPG block here..."
                rows={6}
                tooltip="Paste the full PPG table including 'PPG L8', 'Opp PPG L8' and 'PPG Bias' columns."
              />
              <StatsTextarea
                label="Index & Edge Block *"
                value={profile.indexBlock}
                onChange={profile.setIndexBlock}
                placeholder="Paste Index block here..."
                rows={6}
                tooltip="Paste the block containing 'Offence Index', 'Defence Index', 'H v A' and 'Goal Edge'."
              />
              <StatsTextarea
                label="Home Team 5-Min Goal Segment Block"
                value={profile.homeFiveMinSegmentBlock}
                onChange={profile.setHomeFiveMinSegmentBlock}
                placeholder="Paste Home Team's 5-Min Segment block here..."
                rows={6}
                tooltip="Paste the 5-minute segment table for the HOME team. Ensure you capture the 'Home' column."
              />
              <StatsTextarea
                label="Away Team 5-Min Goal Segment Block"
                value={profile.awayFiveMinSegmentBlock}
                onChange={profile.setAwayFiveMinSegmentBlock}
                placeholder="Paste Away Team's 5-Min Segment block here..."
                rows={6}
                tooltip="Paste the 5-minute segment table for the AWAY team. Ensure you capture the 'Away' column."
              />
              <StatsTextarea
                label="Half Data Block (SCORED)"
                value={profile.halfDataScoredBlock}
                onChange={profile.setHalfDataScoredBlock}
                placeholder="Paste the 'Scored' half data here..."
                rows={6}
                tooltip="Paste the 'Goals Scored' half breakdown table, including '1st Half Overs' and '2nd Half Overs'."
              />
              <StatsTextarea
                label="Half Data Block (CONCEDED)"
                value={profile.halfDataConcededBlock}
                onChange={profile.setHalfDataConcededBlock}
                placeholder="Paste the 'Conceded' half data here..."
                rows={6}
                tooltip="Paste the 'Goals Conceded' half breakdown table."
              />
            </div>

            <StatsTextarea
              label="Optional: Paste League Table"
              value={profile.leagueTable}
              onChange={profile.setLeagueTable}
              placeholder="Paste league table here..."
              rows={6}
              tooltip="Paste the full league table (Rank, Team, GP, W, D, L, GF, GA, GD, Pts) to generate the Quadrant Chart. Also required for Opponent Quality Analysis."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsTextarea
                label="Optional: Paste Your 'Overall' Stats Block"
                value={profile.overallStats}
                onChange={profile.setOverallStats}
                placeholder="Paste your 'Overall' stats block here..."
                rows={6}
              />
              <StatsTextarea
                label="Optional: Paste Your 'At Venue' Stats Block"
                value={profile.atVenueStats}
                onChange={profile.setAtVenueStats}
                placeholder="Paste your 'At Venue' stats block here..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsTextarea
                label="Optional: Paste Home Team Raw Results"
                value={profile.homeRawResults}
                onChange={profile.setHomeRawResults}
                placeholder="Paste Home Team's recent results (FT/HT scores required for volatility)..."
                rows={6}
                tooltip="Paste recent match results list (e.g., 'Team A 2-1 Team B (1-0)') to calculate volatility, resilience, and Opponent Quality."
              />
              <StatsTextarea
                label="Optional: Paste Away Team Raw Results"
                value={profile.awayRawResults}
                onChange={profile.setAwayRawResults}
                placeholder="Paste Away Team's recent results (FT/HT scores required for volatility)..."
                rows={6}
                tooltip="Paste recent match results list (e.g., 'Team C 0-0 Team D (0-0)') to calculate volatility, resilience, and Opponent Quality."
              />
            </div>

            <button
              onClick={handleGenerateProfile}
              disabled={isGenerating}
              aria-label="Generate football trading profile"
              aria-busy={isGenerating}
              className="w-full flex items-center justify-center p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <LoadingIcon />
                  <span>{loadingStage}...</span>
                </div>
              ) : (
                "Generate Profile (with News)"
              )}
            </button>
          </CollapsibleContent>
        </Collapsible>

        <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800 space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">
            Analytical Profile
          </h2>

          {isGenerating && (
            <LoadingProgress stage={loadingStage} />
          )}

          {(api.profileError || generalError) && !isGenerating && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-md">
              <div className="flex items-center mb-2">
                <ErrorIcon />
                <h3 className="text-lg font-bold text-red-200">
                  Analysis Failed
                </h3>
              </div>
              <pre className="text-sm text-red-100 whitespace-pre-wrap font-mono">
                {api.profileError || generalError}
              </pre>
            </div>
          )}

          {!isGenerating && !api.profileError && profile.profile.text && (
            <div>
               <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                   <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <TrendingUp className="h-4 w-4" /> Active Trading Opportunities
                   </h3>

                   {matchedStrategies.length === 0 && aiTradingAngles.length === 0 && (
                       <div className="text-center p-4 text-gray-400 text-xs italic mb-4 border border-dashed border-gray-700 rounded">
                           No AI trading opportunities detected automatically. Add your own below.
                       </div>
                   )}

                   <div className="space-y-3 mb-4">
                       {matchedStrategies.map((strat, idx) => (
                           <div key={`strat-${idx}`} className="flex justify-between items-start bg-gray-900/50 p-3 rounded border-l-4 border-l-green-500 border-y border-r border-indigo-500/20">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <p className="text-white font-semibold text-sm">{strat.name}</p>
                                      <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">Strategy Match</span>
                                   </div>
                                   <p className="text-gray-400 text-xs">{strat.reasoning}</p>
                               </div>
                               <button
                                  onClick={() => {
                                      dailyPlan.addToPlan({
                                          match: `${profile.teamA} vs ${profile.teamB}`,
                                          strategy: strat.name,
                                          confidence: "High",
                                          notes: strat.reasoning
                                      });
                                      toast({ title: "Added to Plan", description: `${strat.name} added.` });
                                  }}
                                  className="ml-4 text-indigo-400 hover:text-indigo-300 p-1 hover:bg-indigo-900/30 rounded"
                                  title="Add to Trading Journal"
                               >
                                   <PlusCircle className="h-5 w-5" />
                               </button>
                           </div>
                       ))}

                       {aiTradingAngles.map((angle, idx) => (
                           <div key={`angle-${angle.id || idx}`} className="flex justify-between items-start bg-gray-900/50 p-3 rounded border-l-4 border-l-blue-500 border-y border-r border-indigo-500/20">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <p className="text-white font-semibold text-sm">Analyst Observation</p>
                                      <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">AI Angle</span>
                                   </div>
                                   <p className="text-gray-300 text-xs">{angle.description}</p>
                               </div>
                               <button
                                  onClick={() => {
                                      dailyPlan.addToPlan({
                                          match: `${profile.teamA} vs ${profile.teamB}`,
                                          strategy: "AI Angle",
                                          confidence: "Medium",
                                          notes: angle.description
                                      });
                                      toast({ title: "Added to Plan", description: "Trading angle added to journal." });
                                  }}
                                  className="ml-4 text-indigo-400 hover:text-indigo-300 p-1 hover:bg-indigo-900/30 rounded"
                                  title="Add to Trading Journal"
                               >
                                   <PlusCircle className="h-5 w-5" />
                               </button>
                           </div>
                       ))}
                   </div>

                   <div className="mt-4 border-t border-indigo-500/30 pt-4">
                      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <PenTool className="h-3 w-3" /> Add Custom Strategy
                      </h4>
                      <div className="flex flex-col gap-3">
                        <input
                           type="text"
                           placeholder="Strategy Title (e.g. Lay The Draw)"
                           className="bg-gray-950 border border-indigo-500/30 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-400 placeholder-gray-600"
                           value={customStrategyTitle}
                           onChange={(e) => setCustomStrategyTitle(e.target.value)}
                        />
                        <textarea
                           placeholder="Reasoning / Notes..."
                           className="bg-gray-950 border border-indigo-500/30 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-400 min-h-[60px] placeholder-gray-600"
                           value={customStrategyReason}
                           onChange={(e) => setCustomStrategyReason(e.target.value)}
                        />
                        <button
                           onClick={handleAddCustomStrategy}
                           disabled={!customStrategyTitle}
                           className="self-end bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                           <PlusCircle className="h-4 w-4" /> Add to Journal
                        </button>
                      </div>
                   </div>
               </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mb-4 w-full md:w-auto flex items-center justify-center p-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
              >
                {isSaving ? (
                  <>
                    <span className="mr-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Save Profile (Local)
                  </>
                )}
              </button>

              <div className="flex border-b border-gray-700 mb-4 flex-wrap">
                <TabButton
                  label="Full Report"
                  isActive={profile.activeTab === "report"}
                  onClick={() => profile.setActiveTab("report")}
                />
                <TabButton
                  label="Strategy Confidence"
                  isActive={profile.activeTab === "benchmarks"} // New Tab
                  onClick={() => profile.setActiveTab("benchmarks")}
                />
                <TabButton
                  label="Team News"
                  isActive={profile.activeTab === "news"}
                  onClick={() => profile.setActiveTab("news")}
                />
                <TabButton
                  label="Key Charts & Stats"
                  isActive={profile.activeTab === "charts"}
                  onClick={() => profile.setActiveTab("charts")}
                />
                <TabButton
                  label="Key Visualisations"
                  isActive={profile.activeTab === "visualisations"}
                  onClick={() => profile.setActiveTab("visualisations")}
                />
                <TabButton
                  label="Analyst Q&A"
                  isActive={profile.activeTab === "analyst"}
                  onClick={() => profile.setActiveTab("analyst")}
                />
                <TabButton
                  label="Key Learnings"
                  isActive={profile.activeTab === "learnings"}
                  onClick={() => profile.setActiveTab("learnings")}
                />
                 <TabButton
                  label="Daily Plan"
                  isActive={profile.activeTab === "dailyPlan"}
                  onClick={() => profile.setActiveTab("dailyPlan")}
                />
                <TabButton
                  label="My Profiles"
                  isActive={profile.activeTab === "myProfiles"}
                  onClick={() => profile.setActiveTab("myProfiles")}
                />
              </div>

              <div className="p-4 bg-gray-800 rounded-md border border-gray-700 min-h-[400px]">
                {profile.activeTab === "report" && (
                  <RenderedProfile
                    markdownText={profile.profile.text}
                    ppgData={profile.ppgChartData}
                    segmentData={profile.fiveMinSegmentChartData}
                  />
                )}

                {profile.activeTab === "benchmarks" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                      <div>
                        <h3 className="font-bold text-blue-200 text-sm">Strategy Confidence Benchmarks</h3>
                        <p className="text-xs text-blue-300/80">Reference guide for assessing trade confidence based on statistical thresholds.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {STRATEGY_BENCHMARKS.map((strategy) => (
                        <StrategyBenchmarkCard key={strategy.id} strategy={strategy} />
                      ))}
                    </div>
                  </div>
                )}

                {profile.activeTab === "dailyPlan" && (
                   <DailyTradingPlan
                      plan={dailyPlan.plan}
                      onRemove={dailyPlan.removeFromPlan}
                      onUpdateStatus={dailyPlan.updateStatus}
                      onClear={dailyPlan.clearPlan}
                   />
                )}

                {profile.activeTab === "news" && (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        api.generateTeamNews(
                          profile.teamA,
                          profile.teamB,
                          TEAM_NEWS_SYSTEM_PROMPT,
                          profile.apiKey,
                        );
                      }}
                      disabled={api.teamNewsLoading}
                      className="w-full flex items-center justify-center p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                    >
                      {api.teamNewsLoading ? (
                        <LoadingIcon />
                      ) : (
                        <TeamNewsIcon />
                      )}
                      {api.teamNewsLoading
                        ? "Refreshing News..."
                        : "Refresh Latest Team News"}
                    </button>
                    <TabContent
                      isLoading={api.teamNewsLoading}
                      error={api.teamNewsError}
                      data={teamNews.text || !api.teamNewsLoading}
                    >
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {teamNews.text || "No team news fetched yet. News is fetched automatically when you generate a profile."}
                        </ReactMarkdown>
                      </div>
                      {teamNews.sources && teamNews.sources.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Verified Sources
                          </h4>
                          <ul className="space-y-1">
                            {teamNews.sources.map((source, index) => (
                              <li key={index} className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">{index + 1}.</span>
                                <a
                                  href={source.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 truncate"
                                >
                                  {source.title || source.uri}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabContent>
                  </div>
                )}

                {profile.activeTab === "charts" && (
                  <TabContent
                    isLoading={api.chartsLoading}
                    error={api.chartsError}
                    data={profile.keyCharts || !api.chartsLoading}
                  >
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {profile.keyCharts}
                      </ReactMarkdown>
                    </div>
                  </TabContent>
                )}

                {profile.activeTab === "visualisations" && (
                  <TabContent
                    isLoading={api.visualisationsLoading}
                    error={api.visualisationsError}
                    data={
                      profile.keyVisualisations || !api.visualisationsLoading
                    }
                  >
                    <div className="space-y-6">
                      <TaleOfTheTape
                        homeName={profile.teamA}
                        awayName={profile.teamB}
                        venueData={{
                           ...profile.analyticalFlagData?.venue,
                           homeBTTS: profile.homeExtendedStats.gamesFound > 0 ? profile.homeExtendedStats.bttsPercentage : profile.analyticalFlagData?.venue.homeBTTS,
                           awayBTTS: profile.awayExtendedStats.gamesFound > 0 ? profile.awayExtendedStats.bttsPercentage : profile.analyticalFlagData?.venue.awayBTTS,
                           homeAvgGoals: profile.homeExtendedStats.gamesFound > 0 ? profile.homeExtendedStats.avgMatchGoals : profile.analyticalFlagData?.venue.homeAvgGoals,
                           awayAvgGoals: profile.awayExtendedStats.gamesFound > 0 ? profile.awayExtendedStats.avgMatchGoals : profile.analyticalFlagData?.venue.awayAvgGoals,
                           homeCleanSheet: profile.homeExtendedStats.gamesFound > 0 ? profile.homeExtendedStats.cleanSheetPercentage : profile.analyticalFlagData?.venue.homeCleanSheet,
                           awayCleanSheet: profile.awayExtendedStats.gamesFound > 0 ? profile.awayExtendedStats.cleanSheetPercentage : profile.analyticalFlagData?.venue.awayCleanSheet,
                           homeScoringRate: profile.analyticalFlagData?.venue.homeScoringRate || profile.homeVolatility.meanScored,
                           awayScoringRate: profile.analyticalFlagData?.venue.awayScoringRate || profile.awayVolatility.meanScored,
                           homeConcedingRate: profile.analyticalFlagData?.venue.homeConcedingRate || profile.homeVolatility.meanConceded,
                           awayConcedingRate: profile.analyticalFlagData?.venue.awayConcedingRate || profile.awayVolatility.meanConceded,
                        }}
                        ppgData={profile.analyticalFlagData?.ppg}
                      />

                      {fastStartContext.text && (
                        <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Timer className="h-4 w-4" /> Fast Start Context (Web Search)
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                    {fastStartContext.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Key Analytical Flags
                        </h3>
                        <AnalyticalFlagDisplay />
                      </div>

                      <GoalHeatmap data={profile.fiveMinSegmentChartData} />

                      <KillZoneRadar
                        data={profile.fiveMinSegmentChartData}
                        description="Overlaps indicate periods where one team scores while the other concedes. Large shapes mean high goal activity."
                      />

                      <LeagueStyleQuadrantChart
                        leagueTableData={profile.leagueTable}
                        homeTeamName={profile.teamA}
                        awayTeamName={profile.teamB}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <h4 className="text-center font-semibold mb-2 text-white">{profile.teamA} Form Pulse</h4>
                              <FormPulseChart
                                matches={profile.homeExtendedStats.matches}
                                leagueTable={profile.leagueTable}
                                targetTeamName={profile.teamA}
                                currentOpponentName={profile.teamB}
                                description="Shows recent form (Oldest → Newest) plotted against opponent rank. Lower dots are easier opponents. The dotted line is today's opponent rank."
                              />
                          </div>
                          <div>
                              <h4 className="text-center font-semibold mb-2 text-white">{profile.teamB} Form Pulse</h4>
                              <FormPulseChart
                                matches={profile.awayExtendedStats.matches}
                                leagueTable={profile.leagueTable}
                                targetTeamName={profile.teamB}
                                currentOpponentName={profile.teamA}
                                description="Shows recent form (Oldest → Newest) plotted against opponent rank. Lower dots are easier opponents. The dotted line is today's opponent rank."
                              />
                          </div>
                      </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <OpponentScatter
                                matches={profile.homeExtendedStats.matches}
                                leagueTable={profile.leagueTable}
                                targetTeamName={profile.teamA}
                                isHomeTeam={true}
                                description="Dots to the right are wins. Dots high up are vs top teams. Green dots high up = 'Big Game Player'."
                          />
                          <OpponentScatter
                                matches={profile.awayExtendedStats.matches}
                                leagueTable={profile.leagueTable}
                                targetTeamName={profile.teamB}
                                isHomeTeam={false}
                                description="Dots to the right are wins. Dots high up are vs top teams. Green dots high up = 'Big Game Player'."
                          />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Volatility & Goal Ranges
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <VolatilityCard
                            teamName={profile.teamA || "Home"}
                            volatilityData={profile.homeVolatility}
                          />
                          <MatchVolatilityCard
                             homeData={profile.homeVolatility}
                             awayData={profile.awayVolatility}
                          />
                          <VolatilityCard
                            teamName={profile.teamB || "Away"}
                            volatilityData={profile.awayVolatility}
                          />
                        </div>
                      </div>

                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {profile.keyVisualisations}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </TabContent>
                )}

                {profile.activeTab === "analyst" && (
                  <div className="space-y-4">
                    <StatsTextarea
                      label="Ask a follow-up question"
                      value={profile.followUpQuestion}
                      onChange={profile.setFollowUpQuestion}
                      placeholder="e.g., 'If the home team scores first...'"
                      rows={4}
                    />
                    <button
                      onClick={() => {
                        const rawData = constructRawData();
                        api.askFollowUp(
                          profile.followUpQuestion,
                          profile.profile.text + "\n\n" + rawData,
                          FOLLOW_UP_SYSTEM_PROMPT,
                          profile.apiKey,
                        );
                      }}
                      disabled={api.followUpLoading}
                      className="w-full flex items-center justify-center p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                    >
                      {api.followUpLoading ? "💬 Thinking..." : "💬 Ask Analyst"}
                    </button>
                    <TabContent
                      isLoading={api.followUpLoading}
                      error={api.followUpError}
                      data={profile.followUpAnswer}
                    >
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {profile.followUpAnswer}
                        </ReactMarkdown>
                      </div>
                    </TabContent>
                  </div>
                )}

                {profile.activeTab === "learnings" && (
                  <TabContent
                    isLoading={api.learningsLoading}
                    error={api.learningsError}
                    data={profile.keyLearnings || !api.learningsLoading}
                  >
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {profile.keyLearnings}
                      </ReactMarkdown>
                    </div>
                  </TabContent>
                )}

                {profile.activeTab === "myProfiles" && (
                  <TabContent
                    isLoading={false}
                    error={null}
                    data={true}
                  >
                    <h3 className="text-lg font-semibold mb-4 text-white">
                      My Saved Profiles (Local)
                    </h3>
                    {localProfiles.myProfiles.length === 0 && (
                      <p className="text-gray-400">
                        You have no saved profiles yet.
                      </p>
                    )}
                    <div className="space-y-3">
                      {localProfiles.myProfiles.map((prof) => (
                        <div
                          key={prof.id}
                          className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-gray-900 rounded-md border border-gray-700"
                        >
                          <div className="mb-2 md:mb-0">
                            <p className="font-semibold text-white">
                              {prof.teamA} vs {prof.teamB}
                            </p>
                            <p className="text-xs text-gray-400">
                              Saved:{" "}
                              {prof.createdAt
                                ? new Date(
                                    prof.createdAt.seconds * 1000,
                                  ).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLoadProfile(prof)}
                              className="flex items-center p-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700"
                            >
                              <LoadIcon />
                              Load
                            </button>
                            <button
                              onClick={() => localProfiles.deleteProfile(prof.id)}
                              className="flex items-center p-2 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700"
                            >
                              <DeleteIcon />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabContent>
                )}
              </div>
            </div>
          )}

          {!profile.profile.text &&
            !isGenerating &&
            !api.profileError && (
              <div className="text-center text-gray-500 p-6">
                Enter team names, API key, and paste data to generate a profile.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
