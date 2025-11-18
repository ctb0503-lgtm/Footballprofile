import {
  PPGParseResult,
  IndexParseResult,
  FiveMinParseResult,
  HalfDataParseResult,
  RawResultsStats,
  ResilienceStats,
  HalfDataStats,
  PPGFlagsData,
  VenueFlagsData,
  IndexFlagsData,
  FiveMinFlagsData, // NEW
  TradingStrategy, // NEW
} from "@/types";
import { FIVE_MIN_SEGMENTS, LATE_SEGMENTS } from "@/utils/constants";

// --- New Interfaces for Detailed Match Parsing ---

/** Defines the structure for a single parsed football match result. */
export interface RawResultsMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    ftScore: string;
    htScore: string;
    targetTeamLocation: 'Home' | 'Away' | 'N/A';
    targetTeamResult: 'W' | 'D' | 'L' | 'N/A';
}

/** Defines the type for an array of detailed match results. */
export type RawResultsMatches = RawResultsMatch[];

// --- New Detailed Match Parser Function ---

/**
 * Parses raw, heavily-formatted football results data.
 * The script uses a robust regular expression to extract match details,
 * cleans the extracted team names, and calculates the result (W/D/L)
 * relative to the target team.
 *
 * @param rawData The raw string containing match results.
 * @param targetTeamName The team to calculate the result (W/D/L) relative to.
 * @returns An array of parsed match result objects.
 */
export const parseResults = (
    rawData: string,
    targetTeamName: string
): RawResultsMatches => {
    // Condensed regex:
    // Capture 1: Date (e.g., 08 Nov)
    // Skip junk ([\s\S]+?)
    // Capture 2 & 3: Home Team v Away Team (([\s\S]+?)v([\s\S]+?))
    // Capture 4 & 5: Full Time Scores (\d+)-(\d+)
    // Skip junk ([\s\S]+?)
    // Capture 6 & 7: Half Time Scores ((\d+)-(\d+))
    const regex = /(\d{2} [A-Za-z]{3})[\s\S]+?([\s\S]+?)v([\s\S]+?)\s*(\d+)-(\d+)\s*[\s\S]+?\((\d+)-(\d+)\)/gm;

    let matches: RawResultsMatches = [];
    let match: RegExpExecArray | null;

    // Use regex.exec() in a loop to find all matches in the global/multiline string
    while ((match = regex.exec(rawData)) !== null) {
        // match[1] to match[7] are the captured groups
        const date = match[1];
        // The captured team names often include leading/trailing whitespace/newlines.
        const homeTeam = match[2].trim();
        const awayTeam = match[3].trim();
        const ftHomeScore = parseInt(match[4], 10);
        const ftAwayScore = parseInt(match[5], 10);
        const htHomeScore = parseInt(match[6], 10);
        const htAwayScore = parseInt(match[7], 10);

        // --- Result Analysis Relative to Target Team ---
        let location: 'Home' | 'Away' | 'N/A' = 'N/A';
        let result: 'W' | 'D' | 'L' | 'N/A' = 'N/A';

        if (homeTeam === targetTeamName) {
            location = 'Home';
            if (ftHomeScore > ftAwayScore) {
                result = 'W'; // Win
            } else if (ftHomeScore < ftAwayScore) {
                result = 'L'; // Loss
            } else {
                result = 'D'; // Draw
            }
        } else if (awayTeam === targetTeamName) {
            location = 'Away';
            if (ftAwayScore > ftHomeScore) {
                result = 'W'; // Win
            } else if (ftAwayScore < ftHomeScore) {
                result = 'L'; // Loss
            } else {
                result = 'D'; // Draw
            }
        }

        matches.push({
            date,
            homeTeam,
            awayTeam,
            ftScore: `${ftHomeScore}-${ftAwayScore}`,
            htScore: `${htHomeScore}-${htAwayScore}`,
            targetTeamLocation: location,
            targetTeamResult: result,
        });
    }

    return matches;
};

// --- Existing Parsing Functions Follow ---

export const parsePpgBlock = (
  data: string,
  teamA?: string,
  teamB?: string,
): PPGParseResult => {
  if (!data) return { chartData: [], fullBlock: "", home: "", away: "" };
  const lines = data.split("\n");
  let homeStats = {
    name: teamA || "Home",
    PPG: 0,
    "PPG L8": 0,
    "Opp PPG L8": 0,
    "PPG Bias": 0,
  };
  let awayStats = {
    name: teamB || "Away",
    PPG: 0,
    "PPG L8": 0,
    "Opp PPG L8": 0,
    "PPG Bias": 0,
  };
  let homeText: string[] = [],
    awayText: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 6) {
      const statName = parts[0];
      try {
        const homeVal = parseFloat(parts[parts.length - 3]);
        const awayVal = parseFloat(parts[parts.length - 2]);

        if (statName.startsWith("PPG") && !statName.includes("Opp")) {
          homeStats.PPG = homeVal;
          awayStats.PPG = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith("PPG L8")) {
          homeStats["PPG L8"] = homeVal;
          awayStats["PPG L8"] = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith("Opp PPG L8")) {
          homeStats["Opp PPG L8"] = homeVal;
          awayStats["Opp PPG L8"] = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith("PPG Bias")) {
          homeStats["PPG Bias"] = homeVal;
          awayStats["PPG Bias"] = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        }
      } catch (e) {
        console.error("Error parsing PPG line:", line, e);
      }
    }
  });

  return {
    chartData: [homeStats, awayStats],
    fullBlock: data,
    home: homeText.join("\n"),
    away: awayText.join("\n"),
  };
};

export const parseIndexBlock = (data: string): IndexParseResult => {
  if (!data) return { fullBlock: "", home: "", away: "", shared: "" };
  let homeText: string[] = [];
  let awayText: string[] = [];
  let sharedText: string[] = [];
  const lines = data.split("\n");
  let foundNewFormat = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length < 2) return; // Not a key-value pair

    const value = parts[parts.length - 1];
    const statName = parts.slice(0, -1).join(" ");

    if (statName.startsWith("Home")) {
      homeText.push(`${statName}: ${value}`);
      foundNewFormat = true;
    } else if (statName.startsWith("Away")) {
      awayText.push(`${statName}: ${value}`);
      foundNewFormat = true;
    } else if (statName.startsWith("H v A") || statName.startsWith("Goal Edge")) {
      sharedText.push(trimmed);
      foundNewFormat = true;
    }
  });

  // Fallback for old table format if new format isn't detected
  if (!foundNewFormat) {
    lines.forEach((line) => {
      const trimmed = line.trim();
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 4) {
        const statName = parts[0];
        const homeVal = parts[parts.length - 2];
        const awayVal = parts[parts.length - 1];
        homeText.push(`${statName}: ${homeVal}`);
        awayText.push(`${statName}: ${awayVal}`);
      } else if (
        parts.length === 2 &&
        (parts[0].startsWith("H v A") || parts[0].startsWith("Goal Edge"))
      ) {
        sharedText.push(trimmed);
      }
    });
  }

  return {
    fullBlock: data,
    home: homeText.join("\n"),
    away: awayText.join("\n"),
    shared: sharedText.join("\n"),
  };
};

export const parseNewFiveMinSegmentData = (
  homeData: string,
  awayData: string,
): FiveMinParseResult => {
  if (!homeData || !awayData) {
    return {
      chartData: [],
      homeLines: "",
      awayLines: "",
      homeTotalGoals: "Scored: 0, Conceded: 0",
      awayTotalGoals: "Scored: 0, Conceded: 0",
    };
  }

  let chartData = FIVE_MIN_SEGMENTS.map((s) => ({
    segment: s,
    "Home Scored": 0,
    "Home Conceded": 0,
    "Home Scored Overall": 0,
    "Home Conceded Overall": 0,
    "Away Scored": 0,
    "Away Conceded": 0,
    "Away Scored Overall": 0,
    "Away Conceded Overall": 0,
  }));

  let homeLines: string[] = [],
    awayLines: string[] = [];
  let homeTotalScored = 0,
    homeTotalConceded = 0;
  let awayTotalScored = 0,
    awayTotalConceded = 0;

  const parseBlock = (data: string, context: "home" | "away") => {
    const lines = data.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      const statName = FIVE_MIN_SEGMENTS.find(
        (s) =>
          trimmedLine.startsWith(s + " ") || trimmedLine.startsWith(s + "\t"),
      );
      if (statName) {
        const parts = trimmedLine.split(/\s{2,}/);
        if (parts.length >= 4) {
          const col2 = parts[2].split("-");
          const col3 = parts[3].split("-");

          const col2Scored = parseFloat(col2[0]) || 0;
          const col2Conceded = parseFloat(col2[1]) || 0;

          const col3Scored = parseFloat(col3[0]) || 0;
          const col3Conceded = parseFloat(col3[1]) || 0;

          const chartEntry = chartData.find((c) => c.segment === statName);
          if (chartEntry) {
            if (context === "home") {
              chartEntry["Home Scored"] = col2Scored;
              chartEntry["Home Conceded"] = col2Conceded;
              chartEntry["Home Scored Overall"] = col2Scored + col3Scored;
              chartEntry["Home Conceded Overall"] = col2Conceded + col3Conceded;
              homeTotalScored += col2Scored;
              homeTotalConceded += col2Conceded;
              homeLines.push(`${statName}: ${parts[2]}`);
            } else {
              chartEntry["Away Scored"] = col3Scored;
              chartEntry["Away Conceded"] = col3Conceded;
              chartEntry["Away Scored Overall"] = col2Scored + col3Scored;
              chartEntry["Away Conceded Overall"] = col2Conceded + col3Conceded;
              awayTotalScored += col3Scored;
              awayTotalConceded += col3Conceded;
              awayLines.push(`${statName}: ${parts[3]}`);
            }
          }
        }
      }
    });
  };

  parseBlock(homeData, "home");
  parseBlock(awayData, "away");

  return {
    chartData,
    homeLines: homeLines.join("\n"),
    awayLines: awayLines.join("\n"),
    homeTotalGoals: `Scored: ${homeTotalScored}, Conceded: ${homeTotalConceded}`,
    awayTotalGoals: `Scored: ${awayTotalScored}, Conceded: ${awayTotalConceded}`,
  };
};

export const parseHalfDataBlock = (data: string): HalfDataParseResult => {
  if (!data) {
    return {
      homeH2H: "",
      awayA2A: "",
      venue: "",
      homeSeason: "",
      awaySeason: "",
      avg: "",
    };
  }
  const lines = data.split("\n");
  let homeH2HLines: string[] = [],
    awayA2ALines: string[] = [],
    venueLines: string[] = [],
    homeSeasonLines: string[] = [],
    awaySeasonLines: string[] = [],
    avgLines: string[] = [];
  let currentSection: string | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("H@H:")) currentSection = "homeH2H";
    else if (trimmed.startsWith("A@A:")) currentSection = "awayA2A";
    else if (trimmed.startsWith("Venue:")) currentSection = "venue";
    else if (trimmed.startsWith("Home Season:")) currentSection = "homeSeason";
    else if (trimmed.startsWith("Away Season:")) currentSection = "awaySeason";
    else if (trimmed.startsWith("Avg:")) currentSection = "avg";
    else if (currentSection && trimmed) {
      switch (currentSection) {
        case "homeH2H":
          homeH2HLines.push(trimmed);
          break;
        case "awayA2A":
          awayA2ALines.push(trimmed);
          break;
        case "venue":
          venueLines.push(trimmed);
          break;
        case "homeSeason":
          homeSeasonLines.push(trimmed);
          break;
        case "awaySeason":
          awaySeasonLines.push(trimmed);
          break;
        case "avg":
          avgLines.push(trimmed);
          break;
      }
    }
  });

  return {
    homeH2H: homeH2HLines.join("\n"),
    awayA2A: awayA2ALines.join("\n"),
    venue: venueLines.join("\n"),
    homeSeason: homeSeasonLines.join("\n"),
    awaySeason: awaySeasonLines.join("\n"),
    avg: avgLines.join("\n"),
  };
};

export const parseLeagueTable = (data: string): number | null => {
  if (!data) return null;
  const lines = data.split("\n");
  let teamCount = 0;
  lines.forEach((line) => {
    if (line.trim().match(/^\d+\s+/)) teamCount++;
  });
  return teamCount > 0 ? teamCount : null;
};

export const calculateStdDev = (arr: number[]) => {
  if (!arr || arr.length < 2) return { mean: 0, stdDev: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance =
    arr.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
    (arr.length - 1);
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
};

export const parseRawResultsData = (
  rawResults: string,
  teamName: string,
): RawResultsStats => {
  if (!rawResults || !teamName)
    return { ppgL4: 0, ppgL8: 0, ppgL12: 0, gamesFound: 0 };
  const lines = rawResults.split("\n").filter(Boolean);
  const points: number[] = [];
  const lowerTeamName = teamName.toLowerCase();

  for (const line of lines) {
    // FIX: Anchored regex to ensure correct parsing of team names and score.
    // Captures: [1] Team A, [2] Team B, [3] Score A, [4] Score B. Allows optional HT score at the end.
    const match = line.match(
      /^(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?$/,
    );
    if (!match) continue;

    try {
      const homeTeam = match[1].trim();
      const awayTeam = match[2].trim();
      const homeScore = parseInt(match[3]);
      const awayScore = parseInt(match[4]);

      let teamPoints = -1;

      if (homeTeam.toLowerCase().includes(lowerTeamName)) {
        if (homeScore > awayScore) teamPoints = 3;
        else if (homeScore === awayScore) teamPoints = 1;
        else teamPoints = 0;
      } else if (awayTeam.toLowerCase().includes(lowerTeamName)) {
        if (awayScore > homeScore) teamPoints = 3;
        else if (awayScore === homeScore) teamPoints = 1;
        else teamPoints = 0;
      }

      if (teamPoints !== -1) points.push(teamPoints);
    } catch (e) {
      console.error("Error parsing raw result line:", line, e);
    }
  }

  const calculatePpg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const l4 = points.slice(0, 4);
  const l8 = points.slice(0, 8);
  const l12 = points.slice(0, 12);

  return {
    ppgL4: calculatePpg(l4),
    ppgL8: calculatePpg(l8),
    ppgL12: calculatePpg(l12),
    gamesFound: points.length,
  };
};

export const parseVolatilityData = (
  rawResults: string,
  teamName: string,
) => {
  const defaultStats = {
    volatilityPercent: 0,
    meanScored: 0,
    stdDevScored: 0,
    scoredCV: 0,
    meanConceded: 0,
    stdDevConceded: 0,
    concededCV: 0,
  };

  if (!rawResults || !teamName) return defaultStats;

  const lines = (rawResults || "").split("\n").filter(Boolean);
  const goalsScored: number[] = [];
  const goalsConceded: number[] = [];
  const lowerTeamName = (teamName || "").toLowerCase();

  if (!lowerTeamName) return defaultStats;

  for (const line of lines) {
    // FIX: Anchored regex to ensure correct parsing of team names and score.
    // Captures: [1] Team A, [2] Team B, [3] Score A, [4] Score B. Allows optional HT score at the end.
    const match = line.match(
      /^(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)(?:\s+\(\d+-\d+\))?$/,
    );
    if (!match) continue;

    try {
      const homeTeam = match[1].trim();
      const awayTeam = match[2].trim();
      const homeScore = parseInt(match[3]);
      const awayScore = parseInt(match[4]);

      if (homeTeam.toLowerCase().includes(lowerTeamName)) {
        goalsScored.push(homeScore);
        goalsConceded.push(awayScore);
      } else if (awayTeam.toLowerCase().includes(lowerTeamName)) {
        goalsScored.push(awayScore);
        goalsConceded.push(homeScore);
      }
    } catch (e) {
      console.error("Error parsing raw result line for volatility:", line, e);
    }
  }

  if (goalsScored.length < 2) return defaultStats;

  const scoredStats = calculateStdDev(goalsScored);
  const concededStats = calculateStdDev(goalsConceded);

  const scoredCV =
    scoredStats.mean > 0 ? scoredStats.stdDev / scoredStats.mean : 0;
  const concededCV =
    concededStats.mean > 0 ? concededStats.stdDev / concededStats.mean : 0;

  const avgCV = (scoredCV + concededCV) / 2;
  const volatilityPercent = Math.min(avgCV * 100, 150);

  return {
    volatilityPercent,
    meanScored: scoredStats.mean,
    stdDevScored: scoredStats.stdDev,
    scoredCV,
    meanConceded: concededStats.mean,
    stdDevConceded: concededStats.stdDev,
    concededCV,
  };
};

export const parsePpgForFlags = (ppgBlock: string): PPGFlagsData => {
  const lines = (ppgBlock || "").split("\n");
  let homeL8 = 0, awayL8 = 0, homeBias = 0, awayBias = 0;

  const tokens = (ppgBlock || "").split(/\s+/);
  for(let i=0; i<tokens.length; i++) {
      if(tokens[i] === "PPG" && tokens[i+1] === "L8") {
          let found = 0;
          for(let j=i+2; j<tokens.length && found < 2; j++) {
              const val = parseFloat(tokens[j]);
              if(!isNaN(val)) {
                  if(found === 0) homeL8 = val;
                  if(found === 1) awayL8 = val;
                  found++;
              }
          }
      }
      if(tokens[i] === "PPG" && tokens[i+1] === "Bias") {
          let found = 0;
          for(let j=i+2; j<tokens.length && found < 2; j++) {
              const val = parseFloat(tokens[j]);
              if(!isNaN(val)) {
                  if(found === 0) homeBias = val;
                  if(found === 1) awayBias = val;
                  found++;
              }
          }
      }
  }

  return { homeL8, awayL8, homeBias, awayBias };
};

export const parseVenueForFlags = (atVenueStats: string): VenueFlagsData => {
  const tokens = (atVenueStats || "").split(/\s+/);
  let homePpg = 0, awayPpg = 0, homeFTS = 0, awayFTS = 0, homeFTC = 0, awayFTC = 0;
  let homeFHG = 0, awayFHG = 0, homeCleanSheet = 0, awayCleanSheet = 0;
  let homeScoringRate = 0, awayScoringRate = 0;
  let homeSHG = 0, awaySHG = 0, homeConcedingRate = 0, awayConcedingRate = 0;

  const findValues = (keywords: string[]) => {
    for (let i = 0; i < tokens.length - keywords.length; i++) {
        let match = true;
        for(let k=0; k<keywords.length; k++) {
            if(tokens[i+k] !== keywords[k] && !tokens[i+k].startsWith(keywords[k])) match = false;
        }
        if (match) {
            let vals = [];
            for (let j = i + keywords.length; j < tokens.length && vals.length < 2; j++) {
                let cleanVal = tokens[j].replace('%', '');
                const val = parseFloat(cleanVal);
                if (!isNaN(val)) vals.push(val);
            }
            return vals;
        }
    }
    return [0, 0];
  };

  const ppg = findValues(["PPG"]);
  homePpg = ppg[0]; awayPpg = ppg[1];

  const fts = findValues(["First", "to", "score"]);
  homeFTS = fts[0]; awayFTS = fts[1];

  const ftc = findValues(["First", "to", "concede"]);
  homeFTC = ftc[0]; awayFTC = ftc[1];

  const fhg = findValues(["Games", "with", "a", "FHG"]);
  homeFHG = fhg[0]; awayFHG = fhg[1];

  const shg = findValues(["Games", "with", "a", "SHG"]);
  homeSHG = shg[0]; awaySHG = shg[1];

  const cs = findValues(["Clean", "sheets"]);
  homeCleanSheet = cs[0]; awayCleanSheet = cs[1];

  for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i] === "Scoring" && tokens[i+1] === "Rate" &&
          tokens[i+2] !== "L8" && tokens[i+2] !== "1st" && tokens[i+2] !== "2nd") {
          let vals = [];
          for (let j = i + 2; j < tokens.length && vals.length < 2; j++) {
              const val = parseFloat(tokens[j]);
              if (!isNaN(val)) vals.push(val);
          }
          if(vals.length === 2) {
              homeScoringRate = vals[0];
              awayScoringRate = vals[1];
          }
          break;
      }
  }

  for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i] === "Conceding" && tokens[i+1] === "Rate" &&
          tokens[i+2] !== "L8" && tokens[i+2] !== "1st" && tokens[i+2] !== "2nd") {
          let vals = [];
          for (let j = i + 2; j < tokens.length && vals.length < 2; j++) {
              const val = parseFloat(tokens[j]);
              if (!isNaN(val)) vals.push(val);
          }
          if(vals.length === 2) {
              homeConcedingRate = vals[0];
              awayConcedingRate = vals[1];
          }
          break;
      }
  }

  return {
    homePpg, awayPpg, homeFTS, awayFTS, homeFTC, awayFTC,
    homeFHG, awayFHG, homeCleanSheet, awayCleanSheet,
    homeScoringRate, awayScoringRate,
    homeSHG, awaySHG, homeConcedingRate, awayConcedingRate
  };
};

export const parseIndexForFlags = (indexBlock: string): IndexFlagsData => {
  const tokens = (indexBlock || "").split(/\s+/);
  let homeOffence = 0, homeDefence = 0, awayOffence = 0, awayDefence = 0, hva = 0, goalEdge = 0;

  const findVal = (keywords: string[]) => {
          for (let i = 0; i < tokens.length - keywords.length; i++) {
          let match = true;
          for(let k=0; k<keywords.length; k++) {
              if(tokens[i+k] !== keywords[k]) match = false;
          }
          if (match) {
               for (let j = i + keywords.length; j < tokens.length; j++) {
                       const val = parseFloat(tokens[j]);
                       if (!isNaN(val)) return val;
               }
          }
      }
    return 0;
  };

  homeOffence = findVal(["Home", "Offence", "Index"]);
  homeDefence = findVal(["Home", "Defence", "Index"]);
  awayOffence = findVal(["Away", "Offence", "Index"]);
  awayDefence = findVal(["Away", "Defence", "Index"]);
  hva = findVal(["H", "v", "A"]);
  goalEdge = findVal(["Goal", "Edge"]);

  return { homeOffence, homeDefence, awayOffence, awayDefence, hva, goalEdge };
};

// --- UPDATED: Added return type ---
export const parse5MinForFlags = (home5min: string, away5min: string): FiveMinFlagsData => {
  let homeScoredLate = 0,
    homeConcededLate = 0;
  let awayScoredLate = 0,
    awayConcededLate = 0;

  const parseBlock = (data: string, context: "home" | "away") => {
    if (!data) return { scored: 0, conceded: 0 };
    let scored = 0,
      conceded = 0;
    const lines = data.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      const statName = LATE_SEGMENTS.find(
        (s) =>
          trimmedLine.startsWith(s + " ") || trimmedLine.startsWith(s + "\t"),
      );
      if (statName) {
        const parts = trimmedLine.split(/\s{2,}/);
        if (parts.length >= 4) {
          const val = parts[context === "home" ? 2 : 3];
          const score = val.split("-");
          if (score.length === 2) {
            scored += parseFloat(score[0]) || 0;
            conceded += parseFloat(score[1]) || 0;
          }
        }
      }
    });
    return { scored, conceded };
  };

  const homeLate = parseBlock(home5min, "home");
  const awayLate = parseBlock(away5min, "away");

  return {
    homeScoredLate: homeLate.scored,
    homeConcededLate: homeLate.conceded,
    awayScoredLate: awayLate.scored,
    awayConcededLate: awayLate.conceded,
  };
};

export const parseResilienceForFlags = (
  homeRawResults: string,
  awayRawResults: string,
  homeTeamName: string,
  awayTeamName: string,
): ResilienceStats => {
  const parseTeamResilience = (
    rawResults: string,
    teamName: string,
  ) => {
    if (!rawResults || !teamName)
      return { comebackRate: 0, droppedPointsRate: 0 };
    const lines = rawResults.split("\n").filter(Boolean);
    const lowerTeamName = teamName.toLowerCase();

    let htLead = 0,
      htLead_DroppedPoints = 0;
    let htLoss = 0,
      htLoss_Comeback = 0;

    for (const line of lines) {
      // FIX: Anchored regex to ensure correct parsing of team names. This regex requires the HT score to be present.
      // Captures: [1] Team A, [2] Team B, [3] FT Score A, [4] FT Score B, [5] HT Score A, [6] HT Score B
      const match = line.match(
        /^(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)\s+\((\d+)-(\d+)\)$/,
      );
      if (!match) continue;

      try {
        const homeTeam = match[1].trim();
        const awayTeam = match[2].trim();
        const homeFT = parseInt(match[3]);
        const awayFT = parseInt(match[4]);
        const homeHT = parseInt(match[5]);
        const awayHT = parseInt(match[6]);

        let htResult, ftResult;

        if (homeTeam.toLowerCase().includes(lowerTeamName)) {
          // Team was at home (relative to the raw result line)
          htResult = homeHT - awayHT;
          ftResult = homeFT - awayFT;
        } else if (awayTeam.toLowerCase().includes(lowerTeamName)) {
          // Team was away (relative to the raw result line)
          htResult = awayHT - homeHT;
          ftResult = awayFT - homeFT;
        } else {
          continue;
        }

        if (htResult > 0) {
          htLead++;
          if (ftResult <= 0) htLead_DroppedPoints++;
        } else if (htResult < 0) {
          htLoss++;
          if (ftResult >= 0) htLoss_Comeback++;
        }
      } catch (e) {
        console.error("Error parsing resilience line:", line, e);
      }
    }

    const comebackRate = htLoss > 0 ? (htLoss_Comeback / htLoss) * 100 : 0;
    const droppedPointsRate =
      htLead > 0 ? (htLead_DroppedPoints / htLead) * 100 : 0;

    return { comebackRate, droppedPointsRate };
  };

  const homeResilience = parseTeamResilience(
    homeRawResults,
    homeTeamName,
  );
  const awayResilience = parseTeamResilience(
    awayRawResults,
    awayTeamName,
  );

  return {
    homeComeback: homeResilience.comebackRate,
    homeDropped: homeResilience.droppedPointsRate,
    awayComeback: awayResilience.comebackRate,
    awayDropped: awayResilience.droppedPointsRate,
  };
};

export const parseHalfDataForFlags = (
  scoredBlock: string,
  concededBlock: string,
): HalfDataStats => {
  // Helper to parse specific cells from the table
  const parseBlock = (block: string) => {
    if (!block) return {
      firstHalfOver05: 0,
      goals1stHalfPct: 0,
      firstHalfAvg: 0,
      secondHalfAvg: 0,
    };

    const lines = block.split("\n");
    let stats = {
      firstHalfOver05: 0,
      goals1stHalfPct: 0,
      firstHalfAvg: 0,
      secondHalfAvg: 0,
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Regex to find a stat name followed by a number/percentage, separated by two or more spaces
      // Captures: [1] Stat Name, [2] Numerical Value, [3] Optional '%'
      const match = trimmed.match(/^([\s\S]+?)\s{2,}([0-9\.]+)(%)?$/);

      if (match) {
        const statName = match[1].trim().toLowerCase();
        const value = parseFloat(match[2]);

        // 1st Half 0.5+ Goals %
        if (statName.includes("1st half") && statName.includes("0.5+")) {
          stats.firstHalfOver05 = value;
        }
        // % of Goals in 1st Half
        else if (statName.includes("% goals 1st half")) {
          stats.goals1stHalfPct = value;
        }
        // Average Goals in 1st Half
        else if (statName.includes("1st half") && statName.includes("avg")) {
          stats.firstHalfAvg = value;
        }
        // Average Goals in 2nd Half
        else if (statName.includes("2nd half") && statName.includes("avg")) {
          stats.secondHalfAvg = value;
        }
      }
    });
    return stats;
  };

  // Assume scoredBlock is Home Half Stats, and concededBlock is Away Half Stats
  const homeStats = parseBlock(scoredBlock);
  const awayStats = parseBlock(concededBlock);

  return {
    // Home Stats
    home1stHalfOver05: homeStats.firstHalfOver05,
    home1stHalfGoalPct: homeStats.goals1stHalfPct,
    home1stHalfAvg: homeStats.firstHalfAvg,
    home2ndHalfAvg: homeStats.secondHalfAvg,

    // Away Stats
    away1stHalfOver05: awayStats.firstHalfOver05,
    away1stHalfGoalPct: awayStats.goals1stHalfPct,
    away1stHalfAvg: awayStats.firstHalfAvg,
    away2ndHalfAvg: awayStats.secondHalfAvg,
  };
};
