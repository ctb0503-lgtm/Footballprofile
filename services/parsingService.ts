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
  FiveMinFlagsData,
  TradingStrategy,
  OpponentQualityStats,
  RawResultsMatches,
  RawResultsMatch,
  TradingAngle
} from "@/types";
import { FIVE_MIN_SEGMENTS, LATE_SEGMENTS } from "@/utils/constants";

// --- Helper: Safe ID Generator ---
const generateSafeId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Helper: Parse League Table Size ---
export const parseLeagueTable = (data: string): number | null => {
  if (!data) return null;
  const lines = data.split("\n");
  let teamCount = 0;
  const tableEntryRegex = /^\s*(\d+)\.?\s+/;
  lines.forEach((line) => {
    if (line.trim().match(tableEntryRegex)) teamCount++;
  });
  return teamCount > 0 ? teamCount : null;
};

// --- Helper: Parse Team Ranks Map ---
export const parseTeamRanks = (data: string): Record<string, number> => {
    const rankMap: Record<string, number> = {};
    if (!data) return rankMap;

    const lines = data.split("\n");
    const tableRegex = /^\s*(\d+)\.?\s+(.+?)\s+(\d+)\s+/;

    lines.forEach(line => {
        const match = line.trim().match(tableRegex);
        if (match) {
        rankMap[match[2].trim().toLowerCase()] = parseInt(match[1], 10);
        }
    });
    return rankMap;
};

// --- NEW: Extract Custom Strategies (Section 13) ---
export const extractStrategiesFromMarkdown = (
    markdownText: string
): { name: string; status: string; reasoning: string }[] => {
    const strategies: { name: string; status: string; reasoning: string }[] = [];
    if (!markdownText) return strategies;

    const lines = markdownText.split('\n');
    let inStrategySection = false;

    lines.forEach(line => {
        if (line.includes("13. Custom Strategy Analysis")) {
            inStrategySection = true;
        } else if (line.startsWith("### 14") || line.startsWith("### 14.")) {
            inStrategySection = false;
        }

        if (inStrategySection) {
            if (line.toUpperCase().includes("MATCH") && !line.toUpperCase().includes("NO MATCH")) {
                const nameMatch = line.match(/\*\*(.*?)\*\*/);
                if (nameMatch) {
                    strategies.push({
                        name: nameMatch[1].replace('Strategy Name:', '').trim(),
                        status: "MATCH",
                        reasoning: line.replace(/\*\*/g, '').replace(/^-/, '').trim()
                    });
                }
            }
        }
    });

    return strategies;
};

// --- NEW: Extract Trading Angles (Section 10) ---
export const extractTradingAngles = (markdownText: string): TradingAngle[] => {
  const angles: TradingAngle[] = [];
  if (!markdownText) return angles;

  const sectionRegex = /###\s*(?:10\.?|Primary Trading Angles)[\s\S]*?(?=###|$)/i;
  const match = markdownText.match(sectionRegex);

  if (match) {
    const sectionContent = match[0];
    const bulletRegex = /^[\*\-]\s+(.+)$/gm;
    const numberedRegex = /^\d+\.\s+(.+)$/gm;
    let bulletMatch;

    while ((bulletMatch = bulletRegex.exec(sectionContent)) !== null) {
      if(!bulletMatch[1].trim().startsWith('**')) {
          angles.push({
            id: generateSafeId(),
            description: bulletMatch[1].trim(),
            status: 'pending'
          });
      }
    }

    if (angles.length === 0) {
         while ((bulletMatch = numberedRegex.exec(sectionContent)) !== null) {
            angles.push({
                id: generateSafeId(),
                description: bulletMatch[1].trim(),
                status: 'pending'
            });
        }
    }
  }
  return angles.slice(0, 5);
};

export const parseResults = (rawData: string, targetTeamName: string): RawResultsMatches => {
    const matches: RawResultsMatches = [];
    if (!rawData) return matches;
    const dateRegex = /(\d{2}\s+[A-Za-z]{3})/g;
    let match;
    const indices: number[] = [];
    while ((match = dateRegex.exec(rawData)) !== null) indices.push(match.index);
    if (indices.length === 0) return matches;

    for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        const end = indices[i+1] || rawData.length;
        const chunk = rawData.slice(start, end).trim();
        const dateMatch = chunk.match(/^(\d{2}\s+[A-Za-z]{3})/);
        const date = dateMatch ? dateMatch[1] : "";
        const vsMatch = chunk.match(/([A-Za-z0-9& \.\-]+?)\s+v\s+([A-Za-z0-9& \.\-]+?)\s+(\d+)-(\d+)/);

        if (vsMatch) {
            const homeTeam = vsMatch[1].trim();
            const awayTeam = vsMatch[2].trim();
            const ftHomeScore = parseInt(vsMatch[3], 10);
            const ftAwayScore = parseInt(vsMatch[4], 10);
            const htMatch = chunk.match(/\((\d+)-(\d+)\)/);
            const htHomeScore = htMatch ? parseInt(htMatch[1], 10) : 0;
            const htAwayScore = htMatch ? parseInt(htMatch[2], 10) : 0;

            let location: 'Home' | 'Away' | 'N/A' = 'N/A';
            let result: 'W' | 'D' | 'L' | 'N/A' = 'N/A';
            let goalsFor = 0;
            let goalsAgainst = 0;

            const isHome = homeTeam.toLowerCase().includes(targetTeamName.toLowerCase()) || targetTeamName.toLowerCase().includes(homeTeam.toLowerCase());
            const isAway = awayTeam.toLowerCase().includes(targetTeamName.toLowerCase()) || targetTeamName.toLowerCase().includes(awayTeam.toLowerCase());

            if (isHome) {
                location = 'Home'; goalsFor = ftHomeScore; goalsAgainst = ftAwayScore;
                result = ftHomeScore > ftAwayScore ? 'W' : ftHomeScore < ftAwayScore ? 'L' : 'D';
            } else if (isAway) {
                location = 'Away'; goalsFor = ftAwayScore; goalsAgainst = ftHomeScore;
                result = ftAwayScore > ftHomeScore ? 'W' : ftAwayScore < ftHomeScore ? 'L' : 'D';
            }

            if(location !== 'N/A') {
                matches.push({ date, homeTeam, awayTeam, ftScore: `${ftHomeScore}-${ftAwayScore}`, htScore: htMatch ? `${htHomeScore}-${htAwayScore}` : "", targetTeamLocation: location, targetTeamResult: result, goalsFor, goalsAgainst });
            }
        }
    }
    return matches;
};

export const parseOpponentQualityResults = (leagueTableData: string, teamRawResults: string, teamName: string, opponentName: string, opponentRank: number | null): OpponentQualityStats => {
  const rankBandwidth = 3;
  const defaultStats: OpponentQualityStats = { rank: opponentRank ?? 'N/A', category: opponentRank ? `Rank ${opponentRank} (Band ±${rankBandwidth})` : 'Unknown Rank', similarMatchCount: 0, W: 0, D: 0, L: 0, };
  if (!leagueTableData || !teamRawResults || !opponentRank) return defaultStats;
  const rankMap = parseTeamRanks(leagueTableData);
  const getRankFuzzy = (name: string) => {
      const lowerName = name.toLowerCase();
      if (rankMap[lowerName]) return rankMap[lowerName];
      const key = Object.keys(rankMap).find(k => k.includes(lowerName) || lowerName.includes(k));
      return key ? rankMap[key] : undefined;
  };
  const rankMin = opponentRank - rankBandwidth;
  const rankMax = opponentRank + rankBandwidth;
  const matchResults = parseResults(teamRawResults, teamName);
  const analysis = { W: 0, D: 0, L: 0, count: 0 };
  matchResults.forEach(match => {
    const historicalOpponent = match.targetTeamLocation === 'Home' ? match.awayTeam : match.homeTeam;
    const historicalOpponentRank = getRankFuzzy(historicalOpponent);
    if (!historicalOpponentRank) return;
    const isSimilarRank = historicalOpponentRank >= rankMin && historicalOpponentRank <= rankMax;
    if (isSimilarRank) {
      analysis.count++;
      if (match.targetTeamResult === 'W') analysis.W++;
      else if (match.targetTeamResult === 'D') analysis.D++;
      else if (match.targetTeamResult === 'L') analysis.L++;
    }
  });
  return { ...defaultStats, rank: opponentRank, similarMatchCount: analysis.count, W: analysis.W, D: analysis.D, L: analysis.L };
};

export const parsePpgBlock = (data: string, teamA?: string, teamB?: string): PPGParseResult => { if (!data) return { chartData: [], fullBlock: "", home: "", away: "" }; const lines = data.split("\n"); let homeStats = { name: teamA || "Home", PPG: 0, "PPG L8": 0, "Opp PPG L8": 0, "PPG Bias": 0, }; let awayStats = { name: teamB || "Away", PPG: 0, "PPG L8": 0, "Opp PPG L8": 0, "PPG Bias": 0, }; let homeText: string[] = [], awayText: string[] = []; lines.forEach((line) => { const trimmed = line.trim(); const match = trimmed.match(/^([\s\S]+?)\s{2,}([0-9\.-]+)\s{2,}([0-9\.-]+)$/); if (match) { const statName = match[1].trim(); const homeVal = parseFloat(match[2]); const awayVal = parseFloat(match[3]); try { if (statName.startsWith("PPG") && !statName.includes("Opp")) { homeStats.PPG = homeVal; awayStats.PPG = awayVal; homeText.push(`${statName}: ${homeVal}`); awayText.push(`${statName}: ${awayVal}`); } else if (statName.startsWith("PPG L8")) { homeStats["PPG L8"] = homeVal; awayStats["PPG L8"] = awayVal; homeText.push(`${statName}: ${homeVal}`); awayText.push(`${statName}: ${awayVal}`); } else if (statName.startsWith("Opp PPG L8")) { homeStats["Opp PPG L8"] = homeVal; awayStats["Opp PPG L8"] = awayVal; homeText.push(`${statName}: ${homeVal}`); awayText.push(`${statName}: ${awayVal}`); } else if (statName.startsWith("PPG Bias")) { homeStats["PPG Bias"] = homeVal; awayStats["PPG Bias"] = awayVal; homeText.push(`${statName}: ${homeVal}`); awayText.push(`${statName}: ${awayVal}`); } } catch (e) { console.error("Error parsing PPG line:", line, e); } } }); return { chartData: [homeStats, awayStats], fullBlock: data, home: homeText.join("\n"), away: awayText.join("\n"), }; };

export const parseIndexBlock = (data: string): IndexParseResult => { if (!data) return { fullBlock: "", home: "", away: "", shared: "" }; let homeText: string[] = []; let awayText: string[] = []; let sharedText: string[] = []; const lines = data.split("\n"); let foundNewFormat = false; lines.forEach((line) => { const trimmed = line.trim(); const parts = trimmed.split(/\s{2,}/); if (parts.length < 2) return; const value = parts[parts.length - 1]; const statName = parts.slice(0, -1).join(" "); if (statName.startsWith("Home")) { homeText.push(`${statName}: ${value}`); foundNewFormat = true; } else if (statName.startsWith("Away")) { awayText.push(`${statName}: ${value}`); foundNewFormat = true; } else if (statName.startsWith("H v A") || statName.startsWith("Goal Edge")) { sharedText.push(trimmed); foundNewFormat = true; } }); if (!foundNewFormat) { lines.forEach((line) => { const trimmed = line.trim(); const parts = trimmed.split(/\s{2,}/); if (parts.length >= 4) { const statName = parts[0]; const homeVal = parts[parts.length - 2]; const awayVal = parts[parts.length - 1]; homeText.push(`${statName}: ${homeVal}`); awayText.push(`${statName}: ${awayVal}`); } else if ( parts.length === 2 && (parts[0].startsWith("H v A") || parts[0].startsWith("Goal Edge")) ) { sharedText.push(trimmed); } }); } return { fullBlock: data, home: homeText.join("\n"), away: awayText.join("\n"), shared: sharedText.join("\n"), }; };

export const parseNewFiveMinSegmentData = (homeData: string, awayData: string): FiveMinParseResult => { if (!homeData || !awayData) { return { chartData: [], homeLines: "", awayLines: "", homeTotalGoals: "Scored: 0, Conceded: 0", awayTotalGoals: "Scored: 0, Conceded: 0", }; } let chartData = FIVE_MIN_SEGMENTS.map((s) => ({ segment: s, "Home Scored": 0, "Home Conceded": 0, "Home Scored Overall": 0, "Home Conceded Overall": 0, "Away Scored": 0, "Away Conceded": 0, "Away Scored Overall": 0, "Away Conceded Overall": 0, })); let homeLines: string[] = [], awayLines: string[] = []; let homeTotalScored = 0, homeTotalConceded = 0; let awayTotalScored = 0, awayTotalConceded = 0; const parseBlock = (data: string, context: "home" | "away") => { const lines = data.split("\n"); lines.forEach((line) => { const trimmedLine = line.trim(); const statName = FIVE_MIN_SEGMENTS.find( (s) => trimmedLine.startsWith(s + " ") || trimmedLine.startsWith(s + "\t"), ); if (statName) { const parts = trimmedLine.split(/\s{2,}/); if (parts.length >= 4) { const col2 = parts[2].split("-"); const col3 = parts[3].split("-"); const col2Scored = parseFloat(col2[0]) || 0; const col2Conceded = parseFloat(col2[1]) || 0; const col3Scored = parseFloat(col3[0]) || 0; const col3Conceded = parseFloat(col3[1]) || 0; const chartEntry = chartData.find((c) => c.segment === statName); if (chartEntry) { if (context === "home") { chartEntry["Home Scored"] = col2Scored; chartEntry["Home Conceded"] = col2Conceded; chartEntry["Home Scored Overall"] = col2Scored + col3Scored; chartEntry["Home Conceded Overall"] = col2Conceded + col3Conceded; homeTotalScored += col2Scored; homeTotalConceded += col2Conceded; homeLines.push(`${statName}: ${parts[2]}`); } else { chartEntry["Away Scored"] = col3Scored; chartEntry["Away Conceded"] = col3Conceded; chartEntry["Away Scored Overall"] = col2Scored + col3Scored; chartEntry["Away Conceded Overall"] = col2Conceded + col3Conceded; awayTotalScored += col3Scored; awayTotalConceded += col3Conceded; awayLines.push(`${statName}: ${parts[3]}`); } } } } }); }; parseBlock(homeData, "home"); parseBlock(awayData, "away"); return { chartData, homeLines: homeLines.join("\n"), awayLines: awayLines.join("\n"), homeTotalGoals: `Scored: ${homeTotalScored}, Conceded: ${homeTotalConceded}`, awayTotalGoals: `Scored: ${awayTotalScored}, Conceded: ${awayTotalConceded}`, }; };

export const parseHalfDataBlock = (data: string): HalfDataParseResult => { if (!data) { return { homeH2H: "", awayA2A: "", venue: "", homeSeason: "", awaySeason: "", avg: "", }; } const lines = data.split("\n"); let homeH2HLines: string[] = [], awayA2ALines: string[] = [], venueLines: string[] = [], homeSeasonLines: string[] = [], awaySeasonLines: string[] = [], avgLines: string[] = []; let currentSection: string | null = null; lines.forEach((line) => { const trimmed = line.trim(); if (trimmed.startsWith("H@H:")) currentSection = "homeH2H"; else if (trimmed.startsWith("A@A:")) currentSection = "awayA2A"; else if (trimmed.startsWith("Venue:")) currentSection = "venue"; else if (trimmed.startsWith("Home Season:")) currentSection = "homeSeason"; else if (trimmed.startsWith("Away Season:")) currentSection = "awaySeason"; else if (trimmed.startsWith("Avg:")) currentSection = "avg"; else if (currentSection && trimmed) { switch (currentSection) { case "homeH2H": homeH2HLines.push(trimmed); break; case "awayA2A": awayA2ALines.push(trimmed); break; case "venue": venueLines.push(trimmed); break; case "homeSeason": homeSeasonLines.push(trimmed); break; case "awaySeason": awaySeasonLines.push(trimmed); break; case "avg": avgLines.push(trimmed); break; } } }); return { homeH2H: homeH2HLines.join("\n"), awayA2A: awayA2ALines.join("\n"), venue: venueLines.join("\n"), homeSeason: homeSeasonLines.join("\n"), awaySeason: awaySeasonLines.join("\n"), avg: avgLines.join("\n"), }; };

export const calculateStdDev = (arr: number[]) => { if (!arr || arr.length < 2) return { mean: 0, stdDev: 0 }; const mean = arr.reduce((a, b) => a + b, 0) / arr.length; const variance = arr.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (arr.length - 1); const stdDev = Math.sqrt(variance); return { mean, stdDev }; };

export const parseRawResultsData = (rawResults: string, teamName: string): RawResultsStats => { const defaultStats = { ppgL4: 0, ppgL8: 0, ppgL12: 0, gamesFound: 0, cleanSheetStreak: 0, failedToScoreStreak: 0, scoringStreak: 0, winStreak: 0, lossStreak: 0, mostCommonScore: 'N/A', matches: [] as RawResultsMatches, bttsPercentage: 0, avgMatchGoals: 0, cleanSheetPercentage: 0 }; if (!rawResults || !teamName) return defaultStats; const matches = parseResults(rawResults, teamName); if (matches.length === 0) return defaultStats; const points = matches.map(m => m.targetTeamResult === 'W' ? 3 : m.targetTeamResult === 'D' ? 1 : 0); const calculatePpg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; let csStreak = 0, ftsStreak = 0, scoringStreak = 0, wStreak = 0, lStreak = 0; let activeCS = true, activeFTS = true, activeScoring = true, activeW = true, activeL = true; let bttsCount = 0, totalGoals = 0, cleanSheetCount = 0; for (const m of matches) { if (m.goalsFor > 0 && m.goalsAgainst > 0) bttsCount++; if (m.goalsAgainst === 0) cleanSheetCount++; totalGoals += (m.goalsFor + m.goalsAgainst); if (activeCS) { if (m.goalsAgainst === 0) csStreak++; else activeCS = false; } if (activeFTS) { if (m.goalsFor === 0) ftsStreak++; else activeFTS = false; } if (activeScoring) { if (m.goalsFor > 0) scoringStreak++; else activeScoring = false; } if (activeW) { if (m.targetTeamResult === 'W') wStreak++; else activeW = false; } if (activeL) { if (m.targetTeamResult === 'L') lStreak++; else activeL = false; } } const scoreCounts: { [key: string]: number } = {}; matches.forEach(m => { const score = `${m.goalsFor}-${m.goalsAgainst}`; scoreCounts[score] = (scoreCounts[score] || 0) + 1; }); let mostCommonScore = 'N/A'; let maxCount = 0; for (const [score, count] of Object.entries(scoreCounts)) { if (count > maxCount) { maxCount = count; mostCommonScore = `${score} (${Math.round((count / matches.length) * 100)}%)`; } } return { ppgL4: calculatePpg(points.slice(0, 4)), ppgL8: calculatePpg(points.slice(0, 8)), ppgL12: calculatePpg(points.slice(0, 12)), gamesFound: matches.length, cleanSheetStreak: csStreak, failedToScoreStreak: ftsStreak, scoringStreak, winStreak: wStreak, lossStreak: lStreak, mostCommonScore, matches, bttsPercentage: matches.length > 0 ? Math.round((bttsCount / matches.length) * 100) : 0, avgMatchGoals: matches.length > 0 ? parseFloat((totalGoals / matches.length).toFixed(2)) : 0, cleanSheetPercentage: matches.length > 0 ? Math.round((cleanSheetCount / matches.length) * 100) : 0 }; };

export const parseVolatilityData = (rawResults: string, teamName: string) => { const defaultStats = { volatilityPercent: 0, meanScored: 0, stdDevScored: 0, scoredCV: 0, meanConceded: 0, stdDevConceded: 0, concededCV: 0 }; if (!rawResults || !teamName) return defaultStats; const matches = parseResults(rawResults, teamName); const goalsScored = matches.map(m => m.goalsFor); const goalsConceded = matches.map(m => m.goalsAgainst); if (goalsScored.length < 2) return defaultStats; const scoredStats = calculateStdDev(goalsScored); const concededStats = calculateStdDev(goalsConceded); const scoredCV = scoredStats.mean > 0 ? scoredStats.stdDev / scoredStats.mean : 0; const concededCV = concededStats.mean > 0 ? concededStats.stdDev / concededStats.mean : 0; const avgCV = (scoredCV + concededCV) / 2; const volatilityPercent = Math.min(avgCV * 100, 150); return { volatilityPercent, meanScored: scoredStats.mean, stdDevScored: scoredStats.stdDev, scoredCV, meanConceded: concededStats.mean, stdDevConceded: concededStats.stdDev, concededCV }; };

export const parsePpgForFlags = (ppgBlock: string): PPGFlagsData => { const lines = (ppgBlock || "").split("\n"); let homeBias = 0, awayBias = 0; let homeL8 = 0, awayL8 = 0; lines.forEach(line => { const match = line.match(/PPG Bias.*?([\-0-9\.]+).*?([\-0-9\.]+)/i); if (match) { homeBias = parseFloat(match[1]) || 0; awayBias = parseFloat(match[2]) || 0; } const matchL8 = line.match(/PPG L8.*?([\-0-9\.]+).*?([\-0-9\.]+)/i); if (matchL8) { homeL8 = parseFloat(matchL8[1]) || 0; awayL8 = parseFloat(matchL8[2]) || 0; } }); return { homeL8, awayL8, homeBias, awayBias }; };

export const parseVenueForFlags = (atVenueStats: string): VenueFlagsData => { const tokens = (atVenueStats || "").split(/\s+/); let homePpg = 0, awayPpg = 0, homeFTS = 0, awayFTS = 0, homeFTC = 0, awayFTC = 0; let homeFHG = 0, awayFHG = 0, homeCleanSheet = 0, awayCleanSheet = 0; let homeScoringRate = 0, awayScoringRate = 0; let homeSHG = 0, awaySHG = 0, homeConcedingRate = 0, awayConcedingRate = 0; let homeBTTS = 0, awayBTTS = 0; let homeAvgGoals = 0, awayAvgGoals = 0; const findValues = (keywords: string[]) => { for (let i = 0; i < tokens.length - keywords.length + 1; i++) { let match = true; for(let k=0; k<keywords.length; k++) { if(!tokens[i+k].toLowerCase().includes(keywords[k].toLowerCase())) match = false; } if (match) { let vals = []; for (let j = i + keywords.length; j < Math.min(tokens.length, i + keywords.length + 10) && vals.length < 2; j++) { let cleanVal = tokens[j].replace(/[^0-9\.\-]/g, ''); if(cleanVal === "") continue; const val = parseFloat(cleanVal); if (!isNaN(val)) vals.push(val); } if(vals.length === 2) return vals; } } return [0, 0]; }; const ppg = findValues(["PPG"]); homePpg = ppg[0]; awayPpg = ppg[1]; const fts = findValues(["First", "to", "score"]); homeFTS = fts[0]; awayFTS = fts[1]; const ftc = findValues(["First", "to", "concede"]); homeFTC = ftc[0]; awayFTC = ftc[1]; const fhg = findValues(["Games", "with", "a", "FHG"]); homeFHG = fhg[0]; awayFHG = fhg[1]; const shg = findValues(["Games", "with", "a", "SHG"]); homeSHG = shg[0]; awaySHG = shg[1]; const cs = findValues(["Clean", "sheets"]); homeCleanSheet = cs[0]; awayCleanSheet = cs[1]; let btts = findValues(["Both", "teams", "to", "score"]); if(btts[0] === 0 && btts[1] === 0) btts = findValues(["BTTS"]); if(btts[0] === 0 && btts[1] === 0) btts = findValues(["Both", "Teams", "Score"]); homeBTTS = btts[0]; awayBTTS = btts[1]; let avgGoals = findValues(["Avg", "Goals"]); if(avgGoals[0] === 0 && avgGoals[1] === 0) avgGoals = findValues(["Match", "Goals"]); if(avgGoals[0] === 0 && avgGoals[1] === 0) avgGoals = findValues(["Avg", "Total", "Goals"]); if(avgGoals[0] === 0 && avgGoals[1] === 0) avgGoals = findValues(["Total", "Goals"]); homeAvgGoals = avgGoals[0]; awayAvgGoals = avgGoals[1]; for (let i = 0; i < tokens.length - 2; i++) { if (tokens[i] === "Scoring" && tokens[i+1] === "Rate") { let vals = []; for (let j = i + 2; j < tokens.length && vals.length < 2; j++) { const val = parseFloat(tokens[j].replace(/[^0-9\.\-]/g, '')); if (!isNaN(val)) vals.push(val); } if(vals.length === 2) { homeScoringRate = vals[0]; awayScoringRate = vals[1]; } break; } } for (let i = 0; i < tokens.length - 2; i++) { if (tokens[i] === "Conceding" && tokens[i+1] === "Rate") { let vals = []; for (let j = i + 2; j < tokens.length && vals.length < 2; j++) { const val = parseFloat(tokens[j].replace(/[^0-9\.\-]/g, '')); if (!isNaN(val)) vals.push(val); } if(vals.length === 2) { homeConcedingRate = vals[0]; awayConcedingRate = vals[1]; } break; } } return { homePpg, awayPpg, homeFTS, awayFTS, homeFTC, awayFTC, homeFHG, awayFHG, homeCleanSheet, awayCleanSheet, homeScoringRate, awayScoringRate, homeSHG, awaySHG, homeConcedingRate, awayConcedingRate, homeBTTS, awayBTTS, homeAvgGoals, awayAvgGoals }; };
export const parseIndexForFlags = (indexBlock: string): IndexFlagsData => { const tokens = (indexBlock || "").split(/\s+/); let homeOffence = 0, homeDefence = 0, awayOffence = 0, awayDefence = 0, hva = 0, goalEdge = 0; const findVal = (keywords: string[]) => { for (let i = 0; i < tokens.length - keywords.length; i++) { let match = true; for(let k=0; k<keywords.length; k++) { if(!tokens[i+k].toLowerCase().includes(keywords[k].toLowerCase())) match = false; } if (match) { for (let j = i + keywords.length; j < tokens.length; j++) { const val = parseFloat(tokens[j]); if (!isNaN(val)) return val; } } } return 0; }; homeOffence = findVal(["Home", "Offence"]); homeDefence = findVal(["Home", "Defence"]); awayOffence = findVal(["Away", "Offence"]); awayDefence = findVal(["Away", "Defence"]); hva = findVal(["H", "v", "A"]); goalEdge = findVal(["Goal", "Edge"]); return { homeOffence, homeDefence, awayOffence, awayDefence, hva, goalEdge }; };
export const parse5MinForFlags = (home5min: string, away5min: string): FiveMinFlagsData => { let homeScoredLate = 0, homeConcededLate = 0; let awayScoredLate = 0, awayConcededLate = 0; const parseBlock = (data: string, context: "home" | "away") => { if (!data) return { scored: 0, conceded: 0 }; let scored = 0, conceded = 0; const lines = data.split("\n"); lines.forEach((line) => { const trimmedLine = line.trim(); const statName = LATE_SEGMENTS.find( (s) => trimmedLine.startsWith(s + " ") || trimmedLine.startsWith(s + "\t"), ); if (statName) { const parts = trimmedLine.split(/\s{2,}/); if (parts.length >= 4) { const targetColIndex = (context === "home" ? 2 : 3); if (parts.length > targetColIndex) { const val = parts[targetColIndex]; const score = val.split("-"); if (score.length === 2) { scored += parseFloat(score[0]) || 0; conceded += parseFloat(score[1]) || 0; } } } } }); return { scored, conceded }; }; const homeLate = parseBlock(home5min, "home"); const awayLate = parseBlock(away5min, "away"); return { homeScoredLate: homeLate.scored, homeConcededLate: homeLate.conceded, awayScoredLate: awayLate.scored, awayConcededLate: awayLate.conceded, }; };

// --- RE-ADDED MISSING FUNCTION ---
export const parseResilienceForFlags = (homeRawResults: string, awayRawResults: string, homeTeamName: string, awayTeamName: string): ResilienceStats => { const parseTeamResilience = (rawResults: string, teamName: string) => { if (!rawResults || !teamName) return { comebackRate: 0, droppedPointsRate: 0 }; const matches = parseResults(rawResults, teamName); let htLead = 0, htLead_DroppedPoints = 0; let htLoss = 0, htLoss_Comeback = 0; for (const m of matches) { const [homeHt, awayHt] = m.htScore.split('-').map(Number); if (isNaN(homeHt) || isNaN(awayHt)) continue; let htResultDiff = 0; if (m.targetTeamLocation === 'Home') { htResultDiff = homeHt - awayHt; } else { htResultDiff = awayHt - homeHt; } if (htResultDiff > 0) { htLead++; if (m.targetTeamResult !== 'W') htLead_DroppedPoints++; } else if (htResultDiff < 0) { htLoss++; if (m.targetTeamResult !== 'L') htLoss_Comeback++; } } const comebackRate = htLoss > 0 ? (htLoss_Comeback / htLoss) * 100 : 0; const droppedPointsRate = htLead > 0 ? (htLead_DroppedPoints / htLead) * 100 : 0; return { comebackRate, droppedPointsRate }; }; const homeResilience = parseTeamResilience(homeRawResults, homeTeamName); const awayResilience = parseTeamResilience(awayRawResults, awayTeamName); return { homeComeback: homeResilience.comebackRate, homeDropped: homeResilience.droppedPointsRate, awayComeback: awayResilience.comebackRate, awayDropped: awayResilience.droppedPointsRate }; };

export const parseHalfDataForFlags = (scoredBlock: string, concededBlock: string): HalfDataStats => { const defaultStats = { firstHalfOver05: 0, goals1stHalfPct: 0, goals2ndHalfPct: 0, firstHalfAvg: 0, secondHalfAvg: 0, details: [] as string[], disparityDetails: [] as string[], }; const parseBlock = (block: string) => { const stats = { ...defaultStats, details: [] as string[], disparityDetails: [] as string[] }; if (!block) return stats; const lines = block.split("\n"); lines.forEach((line) => { const trimmed = line.trim(); const matchMulti = trimmed.match(/^([\s\S]+?)\s{2,}((?:[0-9\.-]+%?\s*)+)$/); if (matchMulti) { const statName = matchMulti[1].trim(); const valuesStr = matchMulti[2].trim(); const values = valuesStr.split(/\s+/).map(v => parseFloat(v.replace('%', ''))).filter(n => !isNaN(n)); if (values.length > 1) { const minVal = Math.min(...values); const maxVal = Math.max(...values); const diff = maxVal - minVal; if (diff > 15) { stats.disparityDetails.push(`Significant disparity in '${statName}': Range [${minVal}% - ${maxVal}%] (Var: ${diff.toFixed(1)})`); } stats.details.push(`${statName}: ${values.map(v => v + '%').join(', ')}`); } else { stats.details.push(trimmed); } } const matchSpecific = trimmed.match(/^([\s\S]+?)\s{2,}([0-9\.-]+)%?$/); let value = 0; let foundStat = false; if (matchMulti) { const values = matchMulti[2].trim().split(/\s+/).map(v => parseFloat(v.replace('%', ''))); if (values.length > 0) { value = values[0]; foundStat = true; } } else if (matchSpecific) { value = parseFloat(matchSpecific[2]); foundStat = true; } if (foundStat) { const statName = (matchMulti ? matchMulti[1] : (matchSpecific ? matchSpecific![1] : "")).trim().toLowerCase(); if (statName.includes("1st half") && statName.includes("0.5+")) stats.firstHalfOver05 = value; else if (statName.includes("% goals 1st half")) stats.goals1stHalfPct = value; else if (statName.includes("% goals 2nd half")) stats.goals2ndHalfPct = value; else if (statName.includes("1st half") && statName.includes("avg")) stats.firstHalfAvg = value; else if (statName.includes("2nd half") && statName.includes("avg")) stats.secondHalfAvg = value; } }); return stats; }; const homeScoredStats = parseBlock(scoredBlock); const homeConcededStats = parseBlock(concededBlock); const awayConcededStats = parseBlock(concededBlock); return { homeScoredHalf2Pct: homeScoredStats.goals2ndHalfPct, homeScored1stHalfOvers: homeScoredStats.firstHalfOver05, homeScored1stHalfPct: homeScoredStats.goals1stHalfPct, homeConcededHalf2Pct: homeConcededStats.goals2ndHalfPct, homeConceded1stHalfOvers: homeConcededStats.firstHalfOver05, homeConceded1stHalfPct: homeConcededStats.goals1stHalfPct, awayConcededHalf2Pct: homeConcededStats.goals2ndHalfPct, awayScoredHalf2Pct: awayConcededStats.goals2ndHalfPct, awayConceded1stHalfOvers: awayConcededStats.firstHalfOver05, awayConceded1stHalfPct: awayConcededStats.goals1stHalfPct, awayScored1stHalfOvers: homeScoredStats.firstHalfOver05, awayScored1stHalfPct: homeScoredStats.goals1stHalfPct, scoredHalfDetails: homeScoredStats.details.join('\n'), concededHalfDetails: homeConcededStats.details.join('\n'), disparityDetails: [...homeScoredStats.disparityDetails.map(s => `(Home Scored) ${s}`), ...homeConcededStats.disparityDetails.map(s => `(Home Conceded) ${s}`)].join('\n') }; };
