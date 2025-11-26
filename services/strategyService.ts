import {
  VenueFlagsData,
  RawResultsStats,
  VolatilityStats,
  HalfDataStats,
  StrategyEvaluation,
  StrategyCriteriaResult,
  SegmentChartData,
  OpponentQualityStats
} from "../types"; // Adjusted path

const check = (label: string, value: number, threshold: number, operator: '>' | '<' | '>=' | '<=', displayVal?: string): StrategyCriteriaResult => {
  let passed = false;
  switch(operator) {
    case '>': passed = value > threshold; break;
    case '<': passed = value < threshold; break;
    case '>=': passed = value >= threshold; break;
    case '<=': passed = value <= threshold; break;
  }
  return {
    label,
    value: displayVal || value.toFixed(2),
    threshold: `${operator} ${threshold}`,
    passed
  };
};

export const evaluateStrategies = (
  venue: VenueFlagsData | undefined,
  homeExt: RawResultsStats,
  awayExt: RawResultsStats,
  homeVol: VolatilityStats,
  awayVol: VolatilityStats,
  halfData: HalfDataStats | undefined,
  fiveMinData: SegmentChartData[],
  quality: { homeVsSimilarAway: OpponentQualityStats; awayVsSimilarHome: OpponentQualityStats } | undefined
): StrategyEvaluation[] => {
  const evaluations: StrategyEvaluation[] = [];

  if (!venue) return evaluations;

  // --- HELPERS ---
  const homeBTTS = homeExt.gamesFound > 0 ? homeExt.bttsPercentage : venue.homeBTTS;
  const awayBTTS = awayExt.gamesFound > 0 ? awayExt.bttsPercentage : venue.awayBTTS;
  const combinedBTTS = (homeBTTS + awayBTTS) / 2;

  const homeAvg = homeExt.gamesFound > 0 ? homeExt.avgMatchGoals : venue.homeAvgGoals;
  const awayAvg = awayExt.gamesFound > 0 ? awayExt.avgMatchGoals : venue.awayAvgGoals;
  const combinedAvg = (homeAvg + awayAvg) / 2;

  const homeScoring = venue.homeScoringRate || homeVol.meanScored;
  const awayScoring = venue.awayScoringRate || awayVol.meanScored;
  const homeConceding = venue.homeConcedingRate || homeVol.meanConceded;
  const awayConceding = venue.awayConcedingRate || awayVol.meanConceded;

  const getConf = (passes: number, total: number): StrategyEvaluation['confidence'] => {
      const ratio = passes / total;
      // High: 80% or more criteria passed
      if (ratio >= 0.8) return "High";
      // Medium: 50% or more criteria passed
      if (ratio >= 0.5) return "Medium";
      // Low: Less than 50% criteria passed
      if (ratio > 0) return "Low";
      // Avoid: 0 criteria passed
      return "Avoid";
  };

  // --- 1. BOTH TEAMS TO SCORE (BTTS) ---
  const bttsCriteria: StrategyCriteriaResult[] = [];
  bttsCriteria.push(check("Combined BTTS %", combinedBTTS, 60, '>=', `${combinedBTTS.toFixed(0)}%`));
  bttsCriteria.push(check("Home Scoring Rate", homeScoring, 1.50, '>'));
  bttsCriteria.push(check("Away Scoring Rate", awayScoring, 1.20, '>'));
  bttsCriteria.push(check("Home Conceding Rate", homeConceding, 1.10, '>'));
  bttsCriteria.push(check("Away Conceding Rate", awayConceding, 1.20, '>'));

  evaluations.push({
    id: "btts",
    name: "Both Teams To Score",
    type: "Goal Market",
    confidence: getConf(bttsCriteria.filter(c => c.passed).length, 5),
    score: (bttsCriteria.filter(c => c.passed).length / 5) * 100,
    criteria: bttsCriteria,
    reasoning: "Requires both teams to have active attack and leaky defence."
  });

  // --- 2. OVER 2.5 GOALS ---
  const o25Criteria: StrategyCriteriaResult[] = [];
  o25Criteria.push(check("Combined Avg Goals", combinedAvg, 2.80, '>='));
  o25Criteria.push(check("Home Avg Goals", homeAvg, 2.5, '>'));
  o25Criteria.push(check("Away Avg Goals", awayAvg, 2.5, '>'));
  o25Criteria.push(check("Home Volatility %", homeVol.volatilityPercent, 45, '>=', `${homeVol.volatilityPercent.toFixed(0)}%`));

  evaluations.push({
    id: "o25",
    name: "Over 2.5 Goals",
    type: "Goal Market",
    confidence: getConf(o25Criteria.filter(c => c.passed).length, 4),
    score: (o25Criteria.filter(c => c.passed).length / 4) * 100,
    criteria: o25Criteria,
    reasoning: "High volatility and average goals point to an open game."
  });

  // --- 3. THE FAST START (FHG) ---
  const fastCriteria: StrategyCriteriaResult[] = [];
  const home1HOver = halfData?.homeScored1stHalfOvers || 0;
  const away1HOver = halfData?.awayScored1stHalfOvers || 0;

  // Calculate 1-15m activity
  let earlyGoals = 0;
  ["1-5", "6-10", "11-15"].forEach(seg => {
      const d = fiveMinData.find(item => item.segment.startsWith(seg));
      // Use the max of Scored or Conceded for the home side, and max for away side
      const homeActivity = d ? Math.max(d["Home Scored"], d["Home Conceded"]) : 0;
      const awayActivity = d ? Math.max(d["Away Scored"], d["Away Conceded"]) : 0;
      earlyGoals += (homeActivity + awayActivity);
  });

  fastCriteria.push(check("Home 1H Over 0.5 %", home1HOver, 75, '>=', `${home1HOver}%`));
  fastCriteria.push(check("Away 1H Over 0.5 %", away1HOver, 70, '>=', `${away1HOver}%`));
  fastCriteria.push(check("Home FTS %", venue.homeFTS, 65, '>=', `${venue.homeFTS}%`));
  fastCriteria.push(check("Early Goal Activity (1-15m)", earlyGoals, 2, '>=', `${earlyGoals.toFixed(0)} events`));

  evaluations.push({
    id: "fast_start",
    name: "The Fast Start (FHG)",
    type: "In-Play",
    confidence: getConf(fastCriteria.filter(c => c.passed).length, 4),
    score: (fastCriteria.filter(c => c.passed).length / 4) * 100,
    criteria: fastCriteria,
    reasoning: "Targeting early action based on 1H goals and segment data."
  });

  // --- 4. LAY THE DRAW ---
  const ltdCriteria: StrategyCriteriaResult[] = [];
  const homeDraws = homeExt.matches.filter(m => m.targetTeamResult === 'D').length;
  const homeDrawPct = homeExt.gamesFound > 0 ? (homeDraws / homeExt.gamesFound) * 100 : 25;
  const awayDraws = awayExt.matches.filter(m => m.targetTeamResult === 'D').length;
  const awayDrawPct = awayExt.gamesFound > 0 ? (awayDraws / awayExt.gamesFound) * 100 : 25;
  const combinedDrawPct = (homeDrawPct + awayDrawPct) / 2;
  const offenceDiff = Math.abs(homeScoring - awayScoring);

  ltdCriteria.push(check("Combined Draw %", combinedDrawPct, 22, '<=', `${combinedDrawPct.toFixed(0)}%`));
  ltdCriteria.push(check("Scoring Rate Diff", offenceDiff, 0.5, '>='));
  ltdCriteria.push(check("Home PPG", venue.homePpg, 1.8, '>'));

  evaluations.push({
    id: "ltd",
    name: "Lay The Draw",
    type: "Match Winner",
    confidence: getConf(ltdCriteria.filter(c => c.passed).length, 3),
    score: (ltdCriteria.filter(c => c.passed).length / 3) * 100,
    criteria: ltdCriteria,
    reasoning: "Low draw probability and mismatched offenses."
  });

  // --- 5. THE FORTRESS (Home Win) ---
  const homeWinCriteria: StrategyCriteriaResult[] = [];
  homeWinCriteria.push(check("Home PPG (Venue)", venue.homePpg, 2.00, '>='));
  homeWinCriteria.push(check("Away PPG (Venue)", venue.awayPpg, 1.00, '<='));
  homeWinCriteria.push(check("Home Scoring Rate", homeScoring, 1.80, '>='));
  homeWinCriteria.push(check("Home Conceding Rate", homeConceding, 1.00, '<='));

  evaluations.push({
    id: "home_win",
    name: "The Fortress (Home Win)",
    type: "Match Winner",
    confidence: getConf(homeWinCriteria.filter(c => c.passed).length, 4),
    score: (homeWinCriteria.filter(c => c.passed).length / 4) * 100,
    criteria: homeWinCriteria,
    reasoning: "Dominant home form vs weak traveller."
  });

  // --- 6. THE GOAL DIGGER (Over 1.5 Goals) ---
  const o15Criteria: StrategyCriteriaResult[] = [];
  const homeO15 = homeExt.matches.filter(m => (m.goalsFor + m.goalsAgainst) > 1).length; // Over 1.5 goals means >= 2 goals
  const homeO15Pct = homeExt.gamesFound > 0 ? (homeO15 / homeExt.gamesFound) * 100 : 75;
  const awayO15 = awayExt.matches.filter(m => (m.goalsFor + m.goalsAgainst) > 1).length;
  const awayO15Pct = awayExt.gamesFound > 0 ? (awayO15 / awayExt.gamesFound) * 100 : 75;
  const combinedO15 = (homeO15Pct + awayO15Pct) / 2;
  const combinedFTS = (venue.homeFTS + venue.awayFTS) / 2;

  // 0-0 check
  const home00 = homeExt.matches.filter(m => m.goalsFor === 0 && m.goalsAgainst === 0).length;
  const away00 = awayExt.matches.filter(m => m.goalsFor === 0 && m.goalsAgainst === 0).length;
  const recent00 = home00 + away00;

  o15Criteria.push(check("Combined O1.5 %", combinedO15, 85, '>=', `${combinedO15.toFixed(0)}%`));
  o15Criteria.push(check("Avg Match Goals", combinedAvg, 2.30, '>='));
  o15Criteria.push(check("Combined FTS %", combinedFTS, 20, '<=', `${combinedFTS}%`));
  o15Criteria.push(check("Recent 0-0 Draws", recent00, 0, '<=', `${recent00} games`));

  evaluations.push({
    id: "goal_digger",
    name: "The Goal Digger (Over 1.5)",
    type: "Goal Market",
    confidence: getConf(o15Criteria.filter(c => c.passed).length, 4),
    score: (o15Criteria.filter(c => c.passed).length / 4) * 100,
    criteria: o15Criteria,
    reasoning: "High consistency of multi-goal games, avoiding 0-0 threats."
  });

  // --- 7. THE SLOW BURNER (2nd Half Goals) ---
  const slowCriteria: StrategyCriteriaResult[] = [];
  const home1HGoalsPct = halfData?.homeScored1stHalfPct || 40;
  const away1HGoalsPct = halfData?.awayScored1stHalfPct || 40;

  // Look at 1-15 min activity (Should be low)
  let startActivity = 0;
  ["1-5", "6-10", "11-15"].forEach(seg => {
      const d = fiveMinData.find(item => item.segment.startsWith(seg));
      // Sum all goals scored/conceded by both teams in the first 15 mins
      if(d) startActivity += (d["Home Scored"] + d["Home Conceded"] + d["Away Scored"] + d["Away Conceded"]);
  });

  slowCriteria.push(check("Home 1H Goal Share", home1HGoalsPct, 35, '<=', `${home1HGoalsPct}%`));
  slowCriteria.push(check("Away 1H Goal Share", away1HGoalsPct, 40, '<=', `${away1HGoalsPct}%`));
  slowCriteria.push(check("Combined 0-15m Goals", startActivity, 1, '<=', `${startActivity} goals`));

  evaluations.push({
    id: "slow_burner",
    name
