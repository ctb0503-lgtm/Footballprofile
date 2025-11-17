// Profile types
export interface Profile {
  text: string;
  sources: GroundingAttribution[];
}

export interface GroundingAttribution {
  uri?: string;
  title?: string;
}

export interface SavedProfile {
  id: string;
  teamA: string;
  teamB: string;
  profileText: string;
  sources: GroundingAttribution[];
  createdAt?: { seconds: number };
  inputs: ProfileInputs;
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
  "Away Scored": number;
  "Away Conceded": number;
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

// Parsing result types
export interface PPGParseResult {
  chartData: PPGChartData[];
  fullBlock: string;
  home: string;
  away: string;
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

// Raw results parsing
export interface RawResultsStats {
  ppgL4: number;
  ppgL8: number;
  ppgL12: number;
  gamesFound: number;
}

export interface ResilienceStats {
  homeComeback: number;
  homeDropped: number;
  awayComeback: number;
  awayDropped: number;
}

export interface HalfDataStats {
  homeScoredHalf2Pct: number;
  awayScoredHalf2Pct: number;
  homeConcededHalf2Pct: number;
  awayConcededHalf2Pct: number;
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
  homeCleanSheet: number;
  awayCleanSheet: number;
  homeScoringRate: number;
  awayScoringRate: number;
}

export interface IndexFlagsData {
  homeOffence: number;
  homeDefence: number;
  awayOffence: number;
  awayDefence: number;
  hva: number;
  goalEdge: number;
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
