import { Download } from "lucide-react";
import { TabButton } from "@/components/tabs/TabButton";
import { TabContent } from "@/components/tabs/TabContent";
import { RenderedProfile } from "@/components/analysis/RenderedProfile";
import { LeagueStyleQuadrantChart } from "@/components/charts";
import { VolatilityCard } from "@/components/cards/VolatilityCard";
import { StatsTextarea } from "@/components/forms/StatsTextarea";
import { ComparisonView } from "@/components/analysis/ComparisonView";
import { StrategyConfidenceDisplay } from "@/components/analysis/StrategyConfidenceDisplay";
import {
  SaveIcon,
  LoadIcon,
  DeleteIcon,
} from "@/components/icons";

interface AnalysisOutputProps {
  profile: any;
  api: any;
  firebase: any;
  constructRawData: () => string;
  handleSaveProfile: () => void;
  handleLoadProfile: (prof: any) => void;
  isSaving: boolean;
  FOLLOW_UP_SYSTEM_PROMPT: string;
}

export const AnalysisOutput = ({
  profile,
  api,
  firebase,
  constructRawData,
  handleSaveProfile,
  handleLoadProfile,
  isSaving,
  FOLLOW_UP_SYSTEM_PROMPT,
}: AnalysisOutputProps) => {
  const handlePdfExport = () => {
    window.print();
  };

  return (
    <div className="bg-gray-900 p-5 rounded-lg shadow-lg border border-gray-800 space-y-6 print:shadow-none print:border-none print:bg-white print:text-black">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 print:hidden">
        <h2 className="text-xl font-semibold text-white">Analyst Report</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePdfExport}
            className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            title="Export to PDF (Print)"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || !firebase.isAuthenticated}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-500 text-sm"
          >
            {isSaving ? (
              <span className="mr-2">Saving...</span>
            ) : (
              <>
                <SaveIcon />
                <span className="ml-2">Save Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-700 mb-4 flex-wrap print:hidden">
        <TabButton
          label="Full Report"
          isActive={profile.activeTab === "report"}
          onClick={() => profile.setActiveTab("report")}
        />
        <TabButton
          label="Head-to-Head"
          isActive={profile.activeTab === "comparison"}
          onClick={() => profile.setActiveTab("comparison")}
        />
        <TabButton
          label="Key Charts"
          isActive={profile.activeTab === "charts"}
          onClick={() => profile.setActiveTab("charts")}
        />
        <TabButton
          label="Visualisations"
          isActive={profile.activeTab === "visualisations"}
          onClick={() => profile.setActiveTab("visualisations")}
        />
        <TabButton
          label="Strategies"
          isActive={profile.activeTab === "strategies"}
          onClick={() => profile.setActiveTab("strategies")}
        />
        <TabButton
          label="Analyst Q&A"
          isActive={profile.activeTab === "analyst"}
          onClick={() => profile.setActiveTab("analyst")}
        />
        <TabButton
          label="Learnings"
          isActive={profile.activeTab === "learnings"}
          onClick={() => profile.setActiveTab("learnings")}
        />
        {firebase.isAuthenticated && (
          <TabButton
            label="My Profiles"
            isActive={profile.activeTab === "myProfiles"}
            onClick={() => profile.setActiveTab("myProfiles")}
          />
        )}
      </div>

      {/* Tab Content Area */}
      <div className="p-4 bg-gray-800 rounded-md border border-gray-700 min-h-[400px] print:bg-white print:border-none print:p-0">
        {/* REPORT TAB */}
        {profile.activeTab === "report" && (
          <div className="print:block">
            <RenderedProfile
              markdownText={profile.profile.text}
              ppgData={profile.ppgChartData}
              segmentData={profile.fiveMinSegmentChartData}
            />
          </div>
        )}

        {/* COMPARISON TAB */}
        {profile.activeTab === "comparison" && (
          <ComparisonView
            teamA={profile.teamA}
            teamB={profile.teamB}
            ppgData={profile.ppgChartData}
          />
        )}

        {/* CHARTS TAB */}
        {profile.activeTab === "charts" && (
          <TabContent
            isLoading={api.chartsLoading}
            error={api.chartsError}
            data={profile.keyCharts || !api.chartsLoading}
          >
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              {profile.keyCharts}
            </div>
          </TabContent>
        )}

        {/* VISUALISATIONS TAB */}
        {profile.activeTab === "visualisations" && (
          <TabContent
            isLoading={api.visualisationsLoading}
            error={api.visualisationsError}
            data={profile.keyVisualisations || !api.visualisationsLoading}
          >
            <LeagueStyleQuadrantChart
              leagueTableData={profile.leagueTable}
              homeTeamName={profile.teamA}
              awayTeamName={profile.teamB}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <VolatilityCard
                teamName={profile.teamA || "Home"}
                volatilityData={profile.homeVolatility}
              />
              <VolatilityCard
                teamName={profile.teamB || "Away"}
                volatilityData={profile.awayVolatility}
              />
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 mt-4">
              {profile.keyVisualisations}
            </div>
          </TabContent>
        )}

        {/* STRATEGIES TAB */}
        {profile.activeTab === "strategies" && (
          <TabContent
            isLoading={false} // Calculated synchronously or via separate loading state if async
            error={null}
            data={profile.strategyEvaluations && profile.strategyEvaluations.length > 0}
          >
            <StrategyConfidenceDisplay
              evaluations={profile.strategyEvaluations}
              matchTitle={`${profile.teamA} vs ${profile.teamB}`}
            />
          </TabContent>
        )}

        {/* ANALYST Q&A TAB */}
        {profile.activeTab === "analyst" && (
          <div className="space-y-4 print:hidden">
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
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-gray-900 p-4 rounded border border-gray-700">
                {profile.followUpAnswer}
              </div>
            </TabContent>
          </div>
        )}

        {/* LEARNINGS TAB */}
        {profile.activeTab === "learnings" && (
          <TabContent
            isLoading={api.learningsLoading}
            error={api.learningsError}
            data={profile.keyLearnings || !api.learningsLoading}
          >
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              {profile.keyLearnings}
            </div>
          </TabContent>
        )}

        {/* SAVED PROFILES TAB */}
        {firebase.isAuthenticated && profile.activeTab === "myProfiles" && (
          <TabContent
            isLoading={firebase.isLoadingProfiles}
            error={firebase.profilesError}
            data={true}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">
              My Saved Profiles
            </h3>
            {firebase.myProfiles.length === 0 &&
              !firebase.isLoadingProfiles && (
                <p className="text-gray-400">You have no saved profiles yet.</p>
              )}
            <div className="space-y-3">
              {firebase.myProfiles.map((prof: any) => (
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
                        ? new Date(prof.createdAt.seconds * 1000).toLocaleString()
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
  );
};
