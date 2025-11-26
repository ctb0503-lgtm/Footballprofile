export interface BenchmarkRow {
  metric: string;
  high: string;
  medium: string;
  low: string;
}

export interface StrategyBenchmark {
  id: string;
  name: string;
  description: string;
  benchmarks: BenchmarkRow[];
}

export const STRATEGY_BENCHMARKS: StrategyBenchmark[] = [
  {
    id: "btts",
    name: "Both Teams To Score (BTTS)",
    description: "Backing both teams to find the net at least once.",
    benchmarks: [
      {
        metric: "Combined BTTS %",
        high: "> 65%",
        medium: "50% - 65%",
        low: "< 50%",
      },
      {
        metric: "Home Scoring Rate",
        high: "> 1.60 avg goals",
        medium: "1.20 - 1.60 avg goals",
        low: "< 1.20 avg goals",
      },
      {
        metric: "Away Scoring Rate",
        high: "> 1.40 avg goals",
        medium: "1.10 - 1.40 avg goals",
        low: "< 1.10 avg goals",
      },
      {
        metric: "Combined Clean Sheet %",
        high: "< 30% (Leaky Defences)",
        medium: "30% - 50%",
        low: "> 50% (Strong Defences)",
      },
    ],
  },
  {
    id: "o25",
    name: "Over 2.5 Goals",
    description: "Looking for 3 or more goals in the match.",
    benchmarks: [
      {
        metric: "Match Avg Goals",
        high: "> 3.00",
        medium: "2.60 - 3.00",
        low: "< 2.60",
      },
      {
        metric: "Combined Over 2.5 %",
        high: "> 60%",
        medium: "45% - 60%",
        low: "< 45%",
      },
      {
        metric: "Volatility Score",
        high: "> 50% (High Chaos)",
        medium: "35% - 50%",
        low: "< 35% (Controlled)",
      },
      {
        metric: "Recent 0-0s (Last 5)",
        high: "0 games",
        medium: "1 game",
        low: "2+ games",
      },
    ],
  },
  {
    id: "lay_draw",
    name: "Lay The Draw",
    description: "Betting against the draw, usually hoping for a favorite win.",
    benchmarks: [
      {
        metric: "Combined Draw %",
        high: "< 20%",
        medium: "20% - 28%",
        low: "> 28%",
      },
      {
        metric: "Favorite PPG (Venue)",
        high: "> 2.00",
        medium: "1.70 - 2.00",
        low: "< 1.70",
      },
      {
        metric: "Scoring Rate Diff",
        high: "> 0.80 (Mismatch)",
        medium: "0.40 - 0.80",
        low: "< 0.40 (Tight game)",
      },
      {
        metric: "Underdog Away Loss %",
        high: "> 60%",
        medium: "40% - 60%",
        low: "< 40%",
      },
    ],
  },
  {
    id: "fast_start",
    name: "The Fast Start (FHG)",
    description: "Betting on a goal to be scored in the First Half (Over 0.5 FHG).",
    benchmarks: [
      {
        metric: "Combined 1H Goal %",
        high: "> 80%",
        medium: "65% - 80%",
        low: "< 65%",
      },
      {
        metric: "Home Team FTS %",
        high: "> 70%",
        medium: "55% - 70%",
        low: "< 55%",
      },
      {
        metric: "0-15min Activity",
        high: "> 3 combined goals",
        medium: "1-2 combined goals",
        low: "0 goals",
      },
      {
        metric: "Avg Time of 1st Goal",
        high: "< 30 mins",
        medium: "30 - 45 mins",
        low: "> 45 mins",
      },
    ],
  },
  {
    id: "fortress",
    name: "The Fortress (Home Win)",
    description: "Backing a strong Home team against a weak traveler.",
    benchmarks: [
      {
        metric: "Home PPG (Venue)",
        high: "> 2.20",
        medium: "1.80 - 2.20",
        low: "< 1.80",
      },
      {
        metric: "Away PPG (Venue)",
        high: "< 0.80",
        medium: "0.80 - 1.10",
        low: "> 1.10",
      },
      {
        metric: "Home Scoring Rate",
        high: "> 2.00 avg",
        medium: "1.50 - 2.00 avg",
        low: "< 1.50 avg",
      },
      {
        metric: "Home Conceding Rate",
        high: "< 0.80 avg",
        medium: "0.80 - 1.10 avg",
        low: "> 1.10 avg",
      },
    ],
  },
  {
    id: "cs_king",
    name: "Clean Sheet King",
    description: "Backing the favorite to win to nil (Win + Clean Sheet).",
    benchmarks: [
      {
        metric: "Favorite Clean Sheet %",
        high: "> 45% (At Venue)",
        medium: "30% - 45%",
        low: "< 30%",
      },
      {
        metric: "Underdog Scoring Rate",
        high: "< 0.80 avg",
        medium: "0.80 - 1.00 avg",
        low: "> 1.10 avg",
      },
      {
        metric: "Underdog Failed to Score",
        high: "> 40% of games",
        medium: "25% - 40%",
        low: "< 25%",
      },
      {
        metric: "Opponent Quality",
        high: "Conceded 0 vs similar rank",
        medium: "Conceded < 0.5 avg",
        low: "Concedes vs lower teams",
      },
    ],
  },
  {
    id: "late_show",
    name: "Late Show Scalp",
    description: "Looking for a goal in the final 15 minutes (76-90).",
    benchmarks: [
      {
        metric: "Combined 76-90 Goals",
        high: "> 5 goals (Season)",
        medium: "3-4 goals",
        low: "< 3 goals",
      },
      {
        metric: "2nd Half Goal Share",
        high: "> 60% of total goals",
        medium: "50% - 60%",
        low: "< 50%",
      },
      {
        metric: "Bench Impact",
        high: "High depth / frequent subs",
        medium: "Average",
        low: "Weak bench",
      },
    ],
  },
  {
    id: "slow_burner",
    name: "The Slow Burner",
    description: "Expecting a 0-0 HT score or very low early activity, then 2H goals.",
    benchmarks: [
      {
        metric: "1st Half Goal Share",
        high: "< 35%",
        medium: "35% - 45%",
        low: "> 45%",
      },
      {
        metric: "Combined 0-15m Goals",
        high: "0 goals",
        medium: "1 goal",
        low: "2+ goals",
      },
      {
        metric: "HT Draw %",
        high: "> 50%",
        medium: "40% - 50%",
        low: "< 40%",
      },
    ],
  },
];
