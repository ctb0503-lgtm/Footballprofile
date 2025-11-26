// Profile types
 export interface Profile {
   text: string;
   sources: GroundingAttribution[];
 }

 export interface GroundingAttribution {
   uri?: string;
   title?: string;
 }

 // NEW: Trading Angle Status Type
 export type TradeStatus = 'pending' | 'won' | 'lost' | 'void';

 export interface TradingAngle {
   id: string;
   description: string;
   status: TradeStatus;
   notes?: string;
 }

 export interface SavedProfile {
   id: string;
   teamA: string;
   teamB: string;
   profileText: string;
   sources: GroundingAttribution[];
   createdAt?: { seconds: number };
   inputs: ProfileInputs;
   tradingAngles?: TradingAngle[]; // NEW: Store angles with the profile
 }

 export interface ProfileInputs {
   ppgBlock: string;
   indexBlock: string;
   homeFiveMinSegmentBlock: string;
   awayFiveMinSegmentBlock: string;
   halfDataScoredBlock: string;
   halfDataConcededBlock: string;
   overallStats: string;
   atVenueStats: string;
   leagueTable: string;
   homeRawResults: string;
   awayRawResults: string;
 }

 // Chart data types
 export interface PPGChartData {
   name: string;
   PPG: number;
   "PPG L8": number;
   "Opp PPG L8": number;
   "PPG Bias": number;
 }

 export interface SegmentChartData {
   segment: string;
   "Home Scored": number;
   "Home Conceded": number;
   "Home Scored Overall": number;
   "Home Conceded Overall": number;
   "Away Scored": number;
   "Away Conceded": number;
   "Away Scored Overall": number;
   "Away Conceded Overall": number;
   "Away Scored Overall": number;
   "Away Conceded Overall": number;
 }

 export interface FormTrendChartData {
   name: string;
   "L4 (Raw)"?: number;
   "L8 (Raw)"?: number;
   "L12 (Raw)"?: number;
   "L8 (Stats)"?: number;
   "Season (Stats)"?: number;
 }

 export interface VenueChartData {
   stat: string;
   Overall: number;
   Venue: number;
 }

 export interface QuadrantTeam {
   name: string;
   x: number;
   y: number;
   fill: string;
   shape: string;
   size: number;
 }

 export interface QuadrantChartData {
   teams: QuadrantTeam[];
   avgGF: number;
   avgGA: number;
 }

 export interface HeatmapCellData {
   segment: string;
   homeScored: number;
   homeConceded: number;
   awayScored: number;
   awayConceded: number;
 }

 // Flag types
 export interface AnalyticalFlag {
   id: string;
   type: "good" | "bad" | "clash" | "alert";
   title: string;
   desc: string;
 }

 // Volatility types
 export interface VolatilityStats {
   volatilityPercent: number;
   meanScored: number;
   stdDevScored: number;
   scoredCV: number;
   meanConceded: number;
   stdDevConceded: number;
   concededCV: number;
 }

 // Strategy types (NEW)
 export interface TradingStrategy {
   id: string;
   title: string;
   type: "pre-match" | "in-play" | "avoid";
   triggerCondition: string;
   action: string;
   confidence: "High" | "Medium" | "Low";
   reasoning: string;
 }

 // Parsing result types
 export interface PPGParseResult {
   chartData: PPGChartData[];
   fullBlock: string;
   home: string;
   away: string;
   shared: string;
 }

 export interface IndexParseResult {
   fullBlock: string;
   home: string;
   away: string;
   shared: string;
 }

 export interface FiveMinParseResult {
   chartData: SegmentChartData[];
   homeLines: string;
   awayLines: string;
   homeTotalGoals: string;
   awayTotalGoals: string;
 }

 export interface HalfDataParseResult {
   homeH2H: string;
   awayA2A: string;
   venue: string;
   homeSeason: string;
   awaySeason: string;
   avg: string;
 }

 // Match Parsing Types
 export interface RawResultsMatch {
     date: string;
     homeTeam: string;
     awayTeam: string;
     ftScore: string;
     htScore: string;
     targetTeamLocation: 'Home' | 'Away' | 'N/A';
     targetTeamResult: 'W' | 'D' | 'L' | 'N/A';
     goalsFor: number;
     goalsAgainst: number;
 }

 export type RawResultsMatches = RawResultsMatch[];

 // Raw results parsing - EXTENDED
 export interface RawResultsStats {
   ppgL4: number;
   ppgL8: number;
   ppgL12: number;
   gamesFound: number;
   // New Granular Stats
   cleanSheetStreak: number;
   failedToScoreStreak: number;
   scoringStreak: number; // NEW: Goal Scoring Streak
   winStreak: number;
   lossStreak: number;
   mostCommonScore: string;
   matches: RawResultsMatches;
   // NEW CALCULATED STATS
   bttsPercentage: number;
   avgMatchGoals: number;
   cleanSheetPercentage: number;
 }

 export interface ResilienceStats {
   homeComeback: number;
   homeDropped: number;
   awayComeback: number;
   awayDropped: number;
 }

 // --- UPDATED HALF DATA STATS ---
 export interface HalfDataStats {
   // Home Scored Stats (from Scored Block)
   homeScoredHalf2Pct: number;
   homeScored1stHalfOvers: number;
   homeScored1stHalfPct: number;

   // Home Conceded Stats (from Conceded Block)
   homeConcededHalf2Pct: number;
   homeConceded1stHalfOvers: number;
   homeConceded1stHalfPct: number;

   // Away Scored Stats (needs to be implemented in parsingService)
   awayScoredHalf2Pct: number;
   awayScored1stHalfOvers: number;
   awayScored1stHalfPct: number;

   // Away Conceded Stats (needs to be implemented in parsingService)
   awayConcededHalf2Pct: number;
   awayConceded1stHalfOvers: number;
   awayConceded1stHalfPct: number;

   // NEW: Full Text Breakdown
   scoredHalfDetails: string;
   concededHalfDetails: string;

   // NEW: Disparity Analysis (Season vs Venue, L8 trends)
   disparityDetails: string;
 }

 export interface PPGFlagsData {
   homeL8: number;
   awayL8: number;
   homeBias: number;
   awayBias: number;
 }

 export interface VenueFlagsData {
   homePpg: number;
   awayPpg: number;
   homeFTS: number;
   awayFTS: number;
   homeFTC: number;
   awayFTC: number;
   homeFHG: number;
   awayFHG: number;
   homeSHG: number;
   awaySHG: number;
   homeConcedingRate: number;
   awayConcedingRate: number;
   homeCleanSheet: number;
   awayCleanSheet: number;
   homeScoringRate: number;
   awayScoringRate: number;
   // NEW FIELDS
   homeBTTS: number;
   awayBTTS: number;
   homeAvgGoals: number;
   awayAvgGoals: number;
 }

 export interface IndexFlagsData {
   homeOffence: number;
   homeDefence: number;
   awayOffence: number;
   awayDefence: number;
   hva: number;
   goalEdge: number;
 }

 // NEW INTERFACE FOR OPPONENT QUALITY
 export interface OpponentQualityStats {
   rank: number | 'N/A';
   category: string;
   similarMatchCount: number;
   W: number;
   D: number;
   L: number;
 }

 // API response types
 export interface GeminiResponse {
   candidates?: Array<{
     content?: {
       parts?: Array<{ text: string }>;
     };
     groundingMetadata?: {
       groundingAttributions?: Array<{
         web?: { uri?: string; title?: string };
       }>;
     };
     finishReason?: string;
     safetyRatings?: unknown;
   }>;
 }

 // Firebase auth types
 export type FirebaseAuthState = {
   isAuthenticated: boolean;
   userId: string | null;
   isLoading: boolean;
   error: string | null;
 };

 export type FirebaseDBState = {
   isReady: boolean;
   isLoading: boolean;
   error: string | null;
 };

 // Placeholder for the missing 5-minute data structure
 export interface FiveMinFlagsData {
     homeScoredLate: number;
     homeConcededLate: number;
     awayScoredLate: number;
     awayConcededLate: number;
 }

// --- ADDED TYPES FOR STRATEGY EVALUATION ---
export interface StrategyCriteriaResult {
  label: string;
  value: string | number;
  threshold: string;
  passed: boolean;
}

export interface StrategyEvaluation {
  id: string;
  name: string;
  type: string; // e.g. "Goal Market", "Match Winner"
  confidence: "High" | "Medium" | "Low" | "Avoid";
  score: number; // 0-100 internal score
  criteria: StrategyCriteriaResult[];
  reasoning: string; // Short summary
}
