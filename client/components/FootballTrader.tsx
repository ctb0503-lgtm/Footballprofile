import { useEffect, useCallback, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFirebase } from '@/hooks/useFirebase';
import { useAnalysisAPI } from '@/hooks/useAnalysisAPI';
import { SYSTEM_PROMPT, FOLLOW_UP_SYSTEM_PROMPT, KEY_LEARNINGS_SYSTEM_PROMPT, KEY_CHARTS_SYSTEM_PROMPT, KEY_VISUALISATIONS_SYSTEM_PROMPT } from '@/utils/constants';

// Icons
import { FootballIcon, LoadingIcon, ErrorIcon, SaveIcon, LoadIcon, DeleteIcon } from '@/components/icons';

// Form components
import { StatsTextarea } from '@/components/forms/StatsTextarea';

// Tab components
import { TabButton } from '@/components/tabs/TabButton';
import { TabContent } from '@/components/tabs/TabContent';

// Charts & analysis
import { RenderedProfile } from '@/components/analysis/RenderedProfile';
import { LeagueStyleQuadrantChart } from '@/components/charts';
import { VolatilityCard } from '@/components/cards/VolatilityCard';

const APP_ID = 'default-app-id'; // Should be from env

export const FootballTrader = () => {
  // Profile management
  const profile = useProfile();

  // Firebase integration
  const firebase = useFirebase(APP_ID);

  // API calls
  const api = useAnalysisAPI(
    (prof) => profile.setProfile(prof),
    (answer) => profile.setFollowUpAnswer(answer.text),
    (learnings) => profile.setKeyLearnings(learnings.text),
    (charts) => profile.setKeyCharts(charts.text),
    (visualisations) => profile.setKeyVisualisations(visualisations.text)
  );

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Lazy-load tabs
  useEffect(() => {
    if (profile.activeTab === 'charts' && !profile.keyCharts && profile.profile.text && !api.chartsLoading) {
      const rawData = constructRawData();
      api.generateCharts(profile.profile.text, rawData, KEY_CHARTS_SYSTEM_PROMPT, getApiKey());
    }
  }, [profile.activeTab, profile.profile.text]);

  useEffect(() => {
    if (profile.activeTab === 'learnings' && !profile.keyLearnings && profile.profile.text && !api.learningsLoading) {
      api.generateLearnings(profile.profile.text, constructRawData(), KEY_LEARNINGS_SYSTEM_PROMPT, getApiKey());
    }
  }, [profile.activeTab, profile.profile.text]);

  useEffect(() => {
    if (profile.activeTab === 'visualisations' && !profile.keyVisualisations && profile.profile.text && !api.visualisationsLoading) {
      api.generateVisualisations(profile.profile.text, constructRawData(), KEY_VISUALISATIONS_SYSTEM_PROMPT, getApiKey());
    }
  }, [profile.activeTab, profile.profile.text]);

  // Load profiles when authenticated
  useEffect(() => {
    if (profile.activeTab === 'myProfiles' && firebase.isAuthenticated) {
      // Profiles are loaded automatically by useFirebase hook
    }
  }, [profile.activeTab, firebase.isAuthenticated]);

  const getApiKey = () => {
    return (window as any).__gemini_api_key || '';
  };

  const constructRawData = () => {
    return `
    PPG Block: ${profile.ppgBlock || 'N/A'}
    Index Block: ${profile.indexBlock || 'N/A'}
    Home 5-Min: ${profile.homeFiveMinSegmentBlock || 'N/A'}
    Away 5-Min: ${profile.awayFiveMinSegmentBlock || 'N/A'}
    Overall Stats: ${profile.overallStats || 'N/A'}
    At Venue Stats: ${profile.atVenueStats || 'N/A'}
    `;
  };

  const handleGenerateProfile = async () => {
    setGeneralError(null);
    profile.resetProfile();

    try {
      const parsedData = profile.getParsedData();

      const userQuery = `
      Analyze the upcoming match: **${profile.teamA || 'Home Team'} vs ${profile.teamB || 'Away Team'}**.
      
      PPG Block: ${profile.ppgBlock || 'N/A'}
      Index Block: ${profile.indexBlock || 'N/A'}
      Home 5-Min: ${profile.homeFiveMinSegmentBlock || 'N/A'}
      Away 5-Min: ${profile.awayFiveMinSegmentBlock || 'N/A'}
      Overall Stats: ${profile.overallStats || 'N/A'}
      At Venue Stats: ${profile.atVenueStats || 'N/A'}
      League Table: ${profile.leagueTable || 'N/A'}
      Home Raw Results: ${profile.homeRawResults || 'N/A'}
      Away Raw Results: ${profile.awayRawResults || 'N/A'}
      `;

      await api.generateProfile(userQuery, SYSTEM_PROMPT, getApiKey());
      profile.updateChartData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setGeneralError(msg);
    }
  };

  const handleSaveProfile = async () => {
    if (!firebase.isAuthenticated || !profile.profile.text) return;

    setIsSaving(true);
    try {
      await firebase.saveProfile(
        profile.teamA,
        profile.teamB,
        profile.profile.text,
        profile.profile.sources,
        profile.getInputs()
      );
      // Success feedback could go here
    } catch (error) {
      setGeneralError('Failed to save profile');
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
      savedProfile.inputs
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="mb-6 flex items-center">
          <FootballIcon />
          <h1 className="text-3xl font-bold text-white">Football Trader Profile Tool</h1>
        </header>

        {/* Inputs Section */}
        <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Data Inputs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Home Team</label>
              <input
                type="text"
                value={profile.teamA}
                onChange={(e) => profile.setTeamA(e.target.value)}
                placeholder="e.g., Man City"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Away Team</label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <StatsTextarea
              label="PPG & GoalSense Block"
              value={profile.ppgBlock}
              onChange={profile.setPpgBlock}
              placeholder="Paste PPG block here..."
              rows={6}
            />
            <StatsTextarea
              label="Index & Edge Block"
              value={profile.indexBlock}
              onChange={profile.setIndexBlock}
              placeholder="Paste Index block here..."
              rows={6}
            />
            <StatsTextarea
              label="Home Team 5-Min Goal Segment Block"
              value={profile.homeFiveMinSegmentBlock}
              onChange={profile.setHomeFiveMinSegmentBlock}
              placeholder="Paste Home Team's 5-Min Segment block here..."
              rows={6}
            />
            <StatsTextarea
              label="Away Team 5-Min Goal Segment Block"
              value={profile.awayFiveMinSegmentBlock}
              onChange={profile.setAwayFiveMinSegmentBlock}
              placeholder="Paste Away Team's 5-Min Segment block here..."
              rows={6}
            />
            <StatsTextarea
              label="Half Data Block (SCORED)"
              value={profile.halfDataScoredBlock}
              onChange={profile.setHalfDataScoredBlock}
              placeholder="Paste the 'Scored' half data here..."
              rows={6}
            />
            <StatsTextarea
              label="Half Data Block (CONCEDED)"
              value={profile.halfDataConcededBlock}
              onChange={profile.setHalfDataConcededBlock}
              placeholder="Paste the 'Conceded' half data here..."
              rows={6}
            />
          </div>

          {/* Optional fields */}
          <StatsTextarea
            label="Optional: Paste League Table"
            value={profile.leagueTable}
            onChange={profile.setLeagueTable}
            placeholder="Paste league table here..."
            rows={6}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <StatsTextarea
              label="Optional: Paste Home Team Raw Results"
              value={profile.homeRawResults}
              onChange={profile.setHomeRawResults}
              placeholder="Paste Home Team's recent results..."
              rows={6}
            />
            <StatsTextarea
              label="Optional: Paste Away Team Raw Results"
              value={profile.awayRawResults}
              onChange={profile.setAwayRawResults}
              placeholder="Paste Away Team's recent results..."
              rows={6}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateProfile}
            disabled={api.profileLoading}
            className="w-full flex items-center justify-center p-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {api.profileLoading ? (
              <>
                <LoadingIcon />
                Generating...
              </>
            ) : (
              'Generate Profile'
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800 space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Analytical Profile</h2>

          {/* Loading state */}
          {api.profileLoading && (
            <div className="flex items-center justify-center p-6 bg-gray-800 rounded-md">
              <LoadingIcon />
              <span className="ml-2 text-gray-300">Generating profile...</span>
            </div>
          )}

          {/* Error state */}
          {(api.profileError || generalError) && !api.profileLoading && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-md">
              <div className="flex items-center mb-2">
                <ErrorIcon />
                <h3 className="text-lg font-bold text-red-200">Analysis Failed</h3>
              </div>
              <pre className="text-sm text-red-100 whitespace-pre-wrap font-mono">{api.profileError || generalError}</pre>
            </div>
          )}

          {/* Profile content */}
          {!api.profileLoading && !api.profileError && profile.profile.text && (
            <div>
              {/* Save button */}
              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !firebase.isAuthenticated}
                className="mb-4 w-full md:w-auto flex items-center justify-center p-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-500"
              >
                {isSaving ? (
                  <>
                    <LoadingIcon />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Save Profile
                  </>
                )}
              </button>

              {/* Tabs */}
              <div className="flex border-b border-gray-700 mb-4 flex-wrap">
                <TabButton
                  label="Full Report"
                  isActive={profile.activeTab === 'report'}
                  onClick={() => profile.setActiveTab('report')}
                />
                <TabButton
                  label="Key Charts & Stats"
                  isActive={profile.activeTab === 'charts'}
                  onClick={() => profile.setActiveTab('charts')}
                />
                <TabButton
                  label="Key Visualisations"
                  isActive={profile.activeTab === 'visualisations'}
                  onClick={() => profile.setActiveTab('visualisations')}
                />
                <TabButton
                  label="Analyst Q&A"
                  isActive={profile.activeTab === 'analyst'}
                  onClick={() => profile.setActiveTab('analyst')}
                />
                <TabButton
                  label="Key Learnings"
                  isActive={profile.activeTab === 'learnings'}
                  onClick={() => profile.setActiveTab('learnings')}
                />
                {firebase.isAuthenticated && (
                  <TabButton
                    label="My Profiles"
                    isActive={profile.activeTab === 'myProfiles'}
                    onClick={() => profile.setActiveTab('myProfiles')}
                  />
                )}
              </div>

              {/* Tab content */}
              <div className="p-4 bg-gray-800 rounded-md border border-gray-700 min-h-[400px]">
                {profile.activeTab === 'report' && (
                  <RenderedProfile
                    markdownText={profile.profile.text}
                    ppgData={profile.ppgChartData}
                    segmentData={profile.fiveMinSegmentChartData}
                  />
                )}

                {profile.activeTab === 'charts' && (
                  <TabContent isLoading={api.chartsLoading} error={api.chartsError} data={profile.keyCharts || !api.chartsLoading}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">{profile.keyCharts}</div>
                  </TabContent>
                )}

                {profile.activeTab === 'visualisations' && (
                  <TabContent isLoading={api.visualisationsLoading} error={api.visualisationsError} data={profile.keyVisualisations || !api.visualisationsLoading}>
                    <LeagueStyleQuadrantChart
                      leagueTableData={profile.leagueTable}
                      homeTeamName={profile.teamA}
                      awayTeamName={profile.teamB}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <VolatilityCard teamName={profile.teamA || 'Home'} volatilityData={{ volatilityPercent: 0, meanScored: 0, stdDevScored: 0, scoredCV: 0, meanConceded: 0, stdDevConceded: 0, concededCV: 0 }} />
                      <VolatilityCard teamName={profile.teamB || 'Away'} volatilityData={{ volatilityPercent: 0, meanScored: 0, stdDevScored: 0, scoredCV: 0, meanConceded: 0, stdDevConceded: 0, concededCV: 0 }} />
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">{profile.keyVisualisations}</div>
                  </TabContent>
                )}

                {profile.activeTab === 'analyst' && (
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
                        api.askFollowUp(profile.followUpQuestion, profile.profile.text + '\n\n' + rawData, FOLLOW_UP_SYSTEM_PROMPT, getApiKey());
                      }}
                      disabled={api.followUpLoading}
                      className="w-full flex items-center justify-center p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                    >
                      {api.followUpLoading ? <LoadingIcon /> : '💬'}
                      {api.followUpLoading ? 'Thinking...' : 'Ask Analyst'}
                    </button>
                    <TabContent isLoading={api.followUpLoading} error={api.followUpError} data={profile.followUpAnswer}>
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">{profile.followUpAnswer}</div>
                    </TabContent>
                  </div>
                )}

                {profile.activeTab === 'learnings' && (
                  <TabContent isLoading={api.learningsLoading} error={api.learningsError} data={profile.keyLearnings || !api.learningsLoading}>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">{profile.keyLearnings}</div>
                  </TabContent>
                )}

                {firebase.isAuthenticated && profile.activeTab === 'myProfiles' && (
                  <TabContent isLoading={firebase.isLoadingProfiles} error={firebase.profilesError} data={true}>
                    <h3 className="text-lg font-semibold mb-4 text-white">My Saved Profiles</h3>
                    {firebase.myProfiles.length === 0 && !firebase.isLoadingProfiles && (
                      <p className="text-gray-400">You have no saved profiles yet.</p>
                    )}
                    <div className="space-y-3">
                      {firebase.myProfiles.map((prof) => (
                        <div key={prof.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-gray-900 rounded-md border border-gray-700">
                          <div className="mb-2 md:mb-0">
                            <p className="font-semibold text-white">{prof.teamA} vs {prof.teamB}</p>
                            <p className="text-xs text-gray-400">
                              Saved: {prof.createdAt ? new Date(prof.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
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
                              onClick={() => firebase.deleteProfile(prof.id)}
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

          {!profile.profile.text && !api.profileLoading && !api.profileError && (
            <div className="text-center text-gray-500 p-6">
              Enter team names and paste data to generate a profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
