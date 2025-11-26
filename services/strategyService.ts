import {
  VenueFlagsData,
  RawResultsStats,
  VolatilityStats,
  HalfDataStats,
  StrategyEvaluation,
  StrategyCriteriaResult,
  SegmentChartData,
  OpponentQualityStats
} from "@/types";

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
      if (ratio >= 0.8) return "High";
      if (ratio >= 0.5) return "Medium";
      return "Avoid"; // Strict low confidence
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
      if(d) earlyGoals += (d["Home Scored"] + d["Away Conceded"]); // Home perspective vs Away
  });

  fastCriteria.push(check("Home 1H Over 0.5 %", home1HOver, 75, '>=', `${home1HOver}%`));
  fastCriteria.push(check("Away 1H Over 0.5 %", away1HOver, 70, '>=', `${away1HOver}%`));
  fastCriteria.push(check("Home FTS %", venue.homeFTS, 65, '>=', `${venue.homeFTS}%`));
  fastCriteria.push(check("Early Goal Activity (1-15m)", earlyGoals, 2, '>=', `${earlyGoals} goals`));

  evaluations.push({
    id: "fast_start",
    name: "The Fast Start (FHG)",
    type: "In-Play",
    confidence: getConf(fastCriteria.filter(c => c.passed).length, 4),
    score: (fastCriteria.filter(c => c.passed).length / 4) * 100,
    criteria: fastCriteria,
    reasoning: "Targeting early action based on FTS and segment data."
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
  const homeO15 = homeExt.matches.filter(m => (m.goalsFor + m.goalsAgainst) > 1.5).length;
  const homeO15Pct = homeExt.gamesFound > 0 ? (homeO15 / homeExt.gamesFound) * 100 : 75;
  const awayO15 = awayExt.matches.filter(m => (m.goalsFor + m.goalsAgainst) > 1.5).length;
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
      if(d) startActivity += (d["Home Scored"] + d["Home Conceded"] + d["Away Scored"] + d["Away Conceded"]);
  });

  slowCriteria.push(check("Home 1H Goal Share", home1HGoalsPct, 35, '<=', `${home1HGoalsPct}%`));
  slowCriteria.push(check("Away 1H Goal Share", away1HGoalsPct, 40, '<=', `${away1HGoalsPct}%`));
  slowCriteria.push(check("Combined 0-15m Goals", startActivity, 1, '<=', `${startActivity} goals`));

  evaluations.push({
    id: "slow_burner",
    name: "The Slow Burner (2H Goals)",
    type: "In-Play",
    confidence: getConf(slowCriteria.filter(c => c.passed).length, 3),
    score: (slowCriteria.filter(c => c.passed).length / 3) * 100,
    criteria: slowCriteria,
    reasoning: "Teams score late and start slow. Look to enter market after 20 mins."
  });

  // --- 8. CLEAN SHEET KING (Win to Nil) ---
  const csCriteria: StrategyCriteriaResult[] = [];
  const favIsHome = venue.homePpg >= venue.awayPpg;

  // Determine who is the "King" candidates
  const kingCleanSheet = favIsHome ? venue.homeCleanSheet : venue.awayCleanSheet;
  const peasantScoring = favIsHome ? venue.awayScoringRate : venue.homeScoringRate;
  const peasantFTS = favIsHome ? venue.awayFTS : venue.homeFTS;

  csCriteria.push(check("Favorite Clean Sheet %", kingCleanSheet, 40, '>=', `${kingCleanSheet}%`));
  csCriteria.push(check("Underdog Scoring Rate", peasantScoring, 0.90, '<='));
  csCriteria.push(check("Underdog FTS %", peasantFTS, 35, '>=', `${peasantFTS}%`));

  evaluations.push({
    id: "cs_king",
    name: "Clean Sheet King (Win to Nil)",
    type: "Match Winner",
    confidence: getConf(csCriteria.filter(c => c.passed).length, 3),
    score: (csCriteria.filter(c => c.passed).length / 3) * 100,
    criteria: csCriteria,
    reasoning: `Backing ${favIsHome ? 'Home' : 'Away'} to win to nil against a weak attack.`
  });

  // --- 9. LATE SHOW SCALP (Late Goals) ---
  const lateCriteria: StrategyCriteriaResult[] = [];
  let lateGoals = 0;
  ["76-80", "81-85", "86-90"].forEach(seg => {
      const d = fiveMinData.find(item => item.segment.startsWith(seg));
      if(d) lateGoals += (d["Home Scored"] + d["Home Conceded"] + d["Away Scored"] + d["Away Conceded"]);
  });

  // 2H Overs Proxy
  const home2HGoalsPct = halfData?.homeScoredHalf2Pct || 50; // Note: parsing naming might differ, verifying logic
  // Actually parsing service returns goals2ndHalfPct as 'homeScoredHalf2Pct' for home.

  lateCriteria.push(check("Combined 76-90m Goals", lateGoals, 4, '>=', `${lateGoals} goals`));
  lateCriteria.push(check("Home 2H Goal Share", home2HGoalsPct, 55, '>=', `${home2HGoalsPct}%`));

  evaluations.push({
    id: "late_show",
    name: "Late Show Scalp",
    type: "In-Play",
    confidence: getConf(lateCriteria.filter(c => c.passed).length, 2),
    score: (lateCriteria.filter(c => c.passed).length / 2) * 100,
    criteria: lateCriteria,
    reasoning: "High activity in final 15 mins suggests late value."
  });

  // --- 10. ASIAN HANDICAP VALUE ---
  const ahCriteria: StrategyCriteriaResult[] = [];

  // PPG Bias is the key here (Performance vs Expectation)
  // Parse PPG Bias from raw text is hard, we rely on flags parsed
  // Assuming ppgBias is available in a param we missed?
  // Ah, we don't have PPG Bias passed in directly in the function signature above easily
  // BUT we parse it in parsingService. Let's assume we pass it in via 'venue' or we need to parse it.
  // Actually, it's in `PPGParseResult` but we aren't passing that full object.
  // However, we passed `halfData`.
  // Let's use Opponent Quality as a proxy for "Value".

  let strongVsSimilar = false;
  if (quality) {
     const homeWinRateVsSimilar = quality.homeVsSimilarAway.similarMatchCount > 0
        ? quality.homeVsSimilarAway.W / quality.homeVsSimilarAway.similarMatchCount
        : 0;
     strongVsSimilar = homeWinRateVsSimilar > 0.60;

     ahCriteria.push(check("Home Win % vs Similar Rank", homeWinRateVsSimilar * 100, 60, '>=', `${(homeWinRateVsSimilar*100).toFixed(0)}%`));
  } else {
      ahCriteria.push(check("Opponent Quality Data", 0, 1, '>=', "Missing"));
  }

  ahCriteria.push(check("Home PPG (Venue)", venue.homePpg, 1.8, '>'));

  evaluations.push({
    id: "ah_value",
    name: "Asian Handicap Value",
    type: "Value Play",
    confidence: getConf(ahCriteria.filter(c => c.passed).length, 2),
    score: (ahCriteria.filter(c => c.passed).length / 2) * 100,
    criteria: ahCriteria,
    reasoning: "Strong record against similar opposition suggests handicap value."
  });

  return evaluations.sort((a, b) => b.score - a.score);
};
