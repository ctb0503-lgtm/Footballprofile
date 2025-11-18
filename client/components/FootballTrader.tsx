import { useEffect, useCallback, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useLocalProfiles } from "@/hooks/useLocalProfiles";
import { useAnalysisAPI } from "@/hooks/useAnalysisAPI";
import { useAutosave } from "@/hooks/useAutosave";
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
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

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

// Charts & analysis
import { RenderedProfile } from "@/components/analysis/RenderedProfile";
import { LeagueStyleQuadrantChart, GoalHeatmap } from "@/components/charts";
import { VolatilityCard } from "@/components/cards/VolatilityCard";
import { MatchVolatilityCard } from "@/components/cards/MatchVolatilityCard";
import { LoadingProgress } from "@/components/LoadingProgress";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { AnalyticalFlagDisplay } from "@/components/analysis/AnalyticalFlagDisplay";
import { Profile } from "@/types";

const APP_ID = "default-app-id";

export const FootballTrader = () => {
  // Profile management
  const profile = useProfile();
  const localProfiles = useLocalProfiles();

  const [teamNews, setTeamNews] = useState<Profile>({ text: "", sources: [] });

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

  // UI State
  const [isInputsOpen, setIsInputsOpen] = useState(true); // Default to open

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
    if (
      profile.activeTab === "charts" &&
      !profile.keyCharts &&
      profile.profile.text &&
      !api.chartsLoading
    ) {
      const rawData = constructRawData();
      api.generateCharts(
        profile.profile.text,
        rawData,
        KEY_CHARTS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }
  }, [profile.activeTab, profile.profile.text, api, profile.apiKey]);

  useEffect(() => {
    if (
      profile.activeTab === "learnings" &&
      !profile.keyLearnings &&
      profile.profile.text &&
      !api.learningsLoading
    ) {
      api.generateLearnings(
        profile.profile.text,
        constructRawData(),
        KEY_LEARNINGS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }
  }, [profile.activeTab, profile.profile.text, api, profile.apiKey]);

  useEffect(() => {
    if (
      profile.activeTab === "visualisations" &&
      !profile.keyVisualisations &&
      profile.profile.text &&
      !api.visualisationsLoading
    ) {
      api.generateVisualisations(
        profile.profile.text,
        constructRawData(),
        KEY_VISUALISATIONS_SYSTEM_PROMPT,
        profile.apiKey,
      );
    }
  }, [profile.activeTab, profile.profile.text, api, profile.apiKey]);

  useEffect(() => {
    setTeamNews({ text: "", sources: [] });
  }, [profile.teamA, profile.teamB]);

  // Simulate loading stages
  useEffect(() => {
    if (isGenerating) {
      const timer1 = setTimeout(() => {
          if (loadingStage === "searching") setLoadingStage("generating");
      }, 10000);
      return () => {
        clearTimeout(timer1);
      };
    }
  }, [isGenerating, loadingStage]);

  const constructRawData = useCallback(() => {
    return `
    PPG Block: ${profile.ppgBlock || "N/A"}
    Index Block: ${profile.indexBlock || "N/A"}
    Home 5-Min: ${profile.homeFiveMinSegmentBlock || "N/A"}
    Away 5-Min: ${profile.awayFiveMinSegmentBlock || "N/A"}
    Overall Stats: ${profile.overallStats || "N/A"}
    At Venue Stats: ${profile.atVenueStats || "N/A"}
    `;
  }, [profile.ppgBlock, profile.indexBlock, profile.homeFiveMinSegmentBlock, profile.awayFiveMinSegmentBlock, profile.overallStats, profile.atVenueStats]);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all input data?")) {
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
    }
  };

  // Input validation
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
    setLoadingStage("searching");
    profile.resetProfile();
    setTeamNews({ text: "", sources: [] });

    // Auto-close inputs on start
    setIsInputsOpen(false);

    try {
      // STEP 1: Fetch team news first
      const news = await api.generateTeamNews(
        profile.teamA,
        profile.teamB,
        TEAM_NEWS_SYSTEM_PROMPT,
        profile.apiKey,
      );

      setLoadingStage("analyzing");

      // --- NEW: GET PARSED FLAGS TO FEED TO AI ---
      const flags = profile.analyticalFlagData;
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
      ` : "";
      // -------------------------------------------

      // STEP 2: Construct the query with stats
      const statsQuery = `
      Analyze the upcoming match: **${profile.teamA || "Home Team"} vs ${profile.teamB || "Away Team"}**.

      PPG Block: ${profile.ppgBlock || "N/A"}
      Index Block: ${profile.indexBlock || "N/A"}
      Home 5-Min: ${profile.homeFiveMinSegmentBlock || "N/A"}
      Away 5-Min: ${profile.awayFiveMinSegmentBlock || "N/A"}
      Overall Stats: ${profile.overallStats || "N/A"}
      At Venue Stats: ${profile.atVenueStats || "N/A"}
      League Table: ${profile.leagueTable || "N/A"}
      Home Raw Results: ${profile.homeRawResults || "N/A"}
      Away Raw Results: ${profile.awayRawResults || "N/A"}
      `;

      // STEP 3: Inject news AND parsed flags into the main query
      const userQueryWithNews = `
        ${statsQuery}

        ---
        ${flagContext}
        ---
        **CRITICAL REAL-TIME CONTEXT (You MUST use this to guide your analysis):**
        ${news.text}
        ---
      `;

      // STEP 4: Generate the main profile *with* the news
      setLoadingStage("generating");
      await api.generateProfile(userQueryWithNews, SYSTEM_PROMPT, profile.apiKey);
      profile.updateChartData();

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setGeneralError(msg);
      console.error(error);
      // Re-open inputs if there was an error so user can fix it
      setIsInputsOpen(true);
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
    } catch (error) {
      setGeneralError("Failed to save profile");
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
    // Open inputs so user can see what was loaded
    setIsInputsOpen(true);
  };

  useEffect(() => {
    if (profile.profile.text) {
        profile.updateChartData();
    }
  }, [profile]);


  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-6 flex items-center">
          <FootballIcon />
          <h1 className="text-3xl font-bold text-white">
            Football Trader Profile Tool
          </h1>
        </header>

        {/* API Key Input */}
        <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800">
          <ApiKeyInput value={profile.apiKey} onChange={profile.saveApiKey} />
        </div>

        {/* Collapsible Inputs Section */}
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
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-900"
            >
               <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
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

            {/* Data input fields */}
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

            {/* Optional fields */}
            <StatsTextarea
              label="Optional: Paste League Table"
              value={profile.leagueTable}
              onChange={profile.setLeagueTable}
              placeholder="Paste league table here..."
              rows={6}
              tooltip="Paste the full league table (Rank, Team, GP, W, D, L, GF, GA, GD, Pts) to generate the Quadrant Chart."
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
                placeholder="Paste Home Team's recent results..."
                rows={6}
                tooltip="Paste recent match results list (e.g., 'Team A 2-1 Team B') to calculate volatility."
              />
              <StatsTextarea
                label="Optional: Paste Away Team Raw Results"
                value={profile.awayRawResults}
                onChange={profile.setAwayRawResults}
                placeholder="Paste Away Team's recent results..."
                rows={6}
                tooltip="Paste recent match results list (e.g., 'Team C 0-0 Team D') to calculate volatility."
              />
            </div>

            <button
              onClick={handleGenerateProfile}
              disabled={isGenerating}
              aria-label="Generate football trading profile"
              aria-busy={isGenerating}
              className="w-full flex items-center justify-center p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {isGenerating ? "Generating..." : "Generate Profile (with News)"}
            </button>
          </CollapsibleContent>
        </Collapsible>

        {/* Output Section */}
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
              {/* Save button (Enabled locally) */}
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

              {/* Tabs */}
              <div className="flex border-b border-gray-700 mb-4 flex-wrap">
                <TabButton
                  label="Full Report"
                  isActive={profile.activeTab === "report"}
                  onClick={() => profile.setActiveTab("report")}
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
                  label="My Profiles"
                  isActive={profile.activeTab === "myProfiles"}
                  onClick={() => profile.setActiveTab("myProfiles")}
                />
              </div>

              {/* Tab content */}
              <div className="p-4 bg-gray-800 rounded-md border border-gray-700 min-h-[400px]">
                {profile.activeTab === "report" && (
                  <RenderedProfile
                    markdownText={profile.profile.text}
                    ppgData={profile.ppgChartData}
                    segmentData={profile.fiveMinSegmentChartData}
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
                      {/* 1. Analytical Flags */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Key Analytical Flags
                        </h3>
                        <AnalyticalFlagDisplay />
                      </div>

                      {/* --- HEATMAP COMPONENT --- */}
                      <GoalHeatmap data={profile.fiveMinSegmentChartData} />
                      {/* ----------------------------- */}

                      {/* 2. Quadrant Chart */}
                      <LeagueStyleQuadrantChart
                        leagueTableData={profile.leagueTable}
                        homeTeamName={profile.teamA}
                        awayTeamName={profile.teamB}
                      />

                      {/* 3. Volatility Cards (UPDATED LAYOUT WITH MATCH CARD) */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Volatility & Goal Ranges
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <VolatilityCard
                            teamName={profile.teamA || "Home"}
                            volatilityData={profile.homeVolatility}
                          />
                          {/* Match Card in the middle */}
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

                      {/* 4. Markdown Heatmap (Kept as fallback/summary text) */}
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

                {/* --- MY PROFILES TAB (UPDATED TO USE LOCAL STORAGE) --- */}
                {profile.activeTab === "myProfiles" && (
                  <TabContent
                    isLoading={false} // Local load is instant
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
                {/* ---------------------------------------------------- */}
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
