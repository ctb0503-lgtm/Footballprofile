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
  IndexFlagsData
} from '@/types';
import { FIVE_MIN_SEGMENTS, LATE_SEGMENTS } from '@/utils/constants';

export const parsePpgBlock = (data: string, teamA?: string, teamB?: string): PPPParseResult => {
  if (!data) return { chartData: [], fullBlock: '', home: '', away: '' };
  const lines = data.split('\n');
  let homeStats = { name: teamA || 'Home', PPG: 0, 'PPG L8': 0, 'Opp PPG L8': 0, 'PPG Bias': 0 };
  let awayStats = { name: teamB || 'Away', PPG: 0, 'PPG L8': 0, 'Opp PPG L8': 0, 'PPG Bias': 0 };
  let homeText = [], awayText = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 6) {
      const statName = parts[0];
      try {
        const homeVal = parseFloat(parts[parts.length - 3]);
        const awayVal = parseFloat(parts[parts.length - 2]);

        if (statName.startsWith('PPG') && !statName.includes('Opp')) {
          homeStats.PPG = homeVal;
          awayStats.PPG = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith('PPG L8')) {
          homeStats['PPG L8'] = homeVal;
          awayStats['PPG L8'] = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith('Opp PPG L8')) {
          homeStats['Opp PPG L8'] = homeVal;
          awayStats['Opp PPG L8'] = awayVal;
          homeText.push(`${statName}: ${homeVal}`);
          awayText.push(`${statName}: ${awayVal}`);
        } else if (statName.startsWith('PPG Bias')) {
          homeStats['PPG Bias'] = homeVal;
          awayStats['PPG Bias'] = awayVal;
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
    home: homeText.join('\n'),
    away: awayText.join('\n')
  };
};

export const parseIndexBlock = (data: string): IndexParseResult => {
  if (!data) return { fullBlock: '', home: '', away: '', shared: '' };
  let homeText = [], awayText = [], sharedText = [];
  const lines = data.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 4) {
      const statName = parts[0];
      const homeVal = parts[parts.length - 2];
      const awayVal = parts[parts.length - 1];
      homeText.push(`${statName}: ${homeVal}`);
      awayText.push(`${statName}: ${awayVal}`);
    } else if (parts.length === 2 && (parts[0].startsWith('H v A') || parts[0].startsWith('Goal Edge'))) {
      sharedText.push(trimmed);
    }
  });

  return {
    fullBlock: data,
    home: homeText.join('\n'),
    away: awayText.join('\n'),
    shared: sharedText.join('\n')
  };
};

export const parseNewFiveMinSegmentData = (homeData: string, awayData: string): FiveMinParseResult => {
  if (!homeData || !awayData) {
    return {
      chartData: [],
      homeLines: '',
      awayLines: '',
      homeTotalGoals: 'Scored: 0, Conceded: 0',
      awayTotalGoals: 'Scored: 0, Conceded: 0'
    };
  }

  let chartData = FIVE_MIN_SEGMENTS.map(s => ({
    segment: s,
    'Home Scored': 0, 'Home Conceded': 0,
    'Away Scored': 0, 'Away Conceded': 0
  }));

  let homeLines = [], awayLines = [];
  let homeTotalScored = 0, homeTotalConceded = 0;
  let awayTotalScored = 0, awayTotalConceded = 0;

  const parseBlock = (data: string, context: 'home' | 'away') => {
    const lines = data.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      const statName = FIVE_MIN_SEGMENTS.find(
        s => trimmedLine.startsWith(s + ' ') || trimmedLine.startsWith(s + '\t')
      );
      if (statName) {
        const parts = trimmedLine.split(/\s{2,}/);
        if (parts.length >= 4) {
          const val = parts[context === 'home' ? 2 : 3];
          const score = val.split('-');
          if (score.length === 2) {
            const scored = parseFloat(score[0]) || 0;
            const conceded = parseFloat(score[1]) || 0;
            const chartEntry = chartData.find(c => c.segment === statName);
            if (chartEntry) {
              if (context === 'home') {
                chartEntry['Home Scored'] = scored;
                chartEntry['Home Conceded'] = conceded;
                homeTotalScored += scored;
                homeTotalConceded += conceded;
                homeLines.push(`${statName}: ${val}`);
              } else {
                chartEntry['Away Scored'] = scored;
                chartEntry['Away Conceded'] = conceded;
                awayTotalScored += scored;
                awayTotalConceded += conceded;
                awayLines.push(`${statName}: ${val}`);
              }
            }
          }
        }
      }
    });
  };

  parseBlock(homeData, 'home');
  parseBlock(awayData, 'away');

  return {
    chartData,
    homeLines: homeLines.join('\n'),
    awayLines: awayLines.join('\n'),
    homeTotalGoals: `Scored: ${homeTotalScored}, Conceded: ${homeTotalConceded}`,
    awayTotalGoals: `Scored: ${awayTotalScored}, Conceded: ${awayTotalConceded}`
  };
};

export const parseHalfDataBlock = (data: string): HalfDataParseResult => {
  if (!data) {
    return {
      homeH2H: '',
      awayA2A: '',
      venue: '',
      homeSeason: '',
      awaySeason: '',
      avg: ''
    };
  }
  const lines = data.split('\n');
  let homeH2HLines = [], awayA2ALines = [], venueLines = [], homeSeasonLines = [], awaySeasonLines = [], avgLines = [];
  let currentSection: string | null = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('H@H:')) currentSection = 'homeH2H';
    else if (trimmed.startsWith('A@A:')) currentSection = 'awayA2A';
    else if (trimmed.startsWith('Venue:')) currentSection = 'venue';
    else if (trimmed.startsWith('Home Season:')) currentSection = 'homeSeason';
    else if (trimmed.startsWith('Away Season:')) currentSection = 'awaySeason';
    else if (trimmed.startsWith('Avg:')) currentSection = 'avg';
    else if (currentSection && trimmed) {
      switch (currentSection) {
        case 'homeH2H': homeH2HLines.push(trimmed); break;
        case 'awayA2A': awayA2ALines.push(trimmed); break;
        case 'venue': venueLines.push(trimmed); break;
        case 'homeSeason': homeSeasonLines.push(trimmed); break;
        case 'awaySeason': awaySeasonLines.push(trimmed); break;
        case 'avg': avgLines.push(trimmed); break;
      }
    }
  });

  return {
    homeH2H: homeH2HLines.join('\n'),
    awayA2A: awayA2ALines.join('\n'),
    venue: venueLines.join('\n'),
    homeSeason: homeSeasonLines.join('\n'),
    awaySeason: awaySeasonLines.join('\n'),
    avg: avgLines.join('\n')
  };
};

export const parseLeagueTable = (data: string): number | null => {
  if (!data) return null;
  const lines = data.split('\n');
  let teamCount = 0;
  lines.forEach(line => {
    if (line.trim().match(/^\d+\s+/)) teamCount++;
  });
  return teamCount > 0 ? teamCount : null;
};

export const calculateStdDev = (arr: number[]) => {
  if (!arr || arr.length === 0) return { mean: 0, stdDev: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (mean === 0) return { mean: 0, stdDev: 0 };

  const stdDev = Math.sqrt(
    arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / arr.length
  );
  return { mean, stdDev };
};

export const parseRawResultsData = (rawResults: string, teamName: string, context: 'home' | 'away'): RawResultsStats => {
  if (!rawResults || !teamName) return { ppgL4: 0, ppgL8: 0, ppgL12: 0, gamesFound: 0 };
  const lines = rawResults.split('\n').filter(Boolean);
  const points = [];
  const lowerTeamName = teamName.toLowerCase();

  for (const line of lines) {
    const match = line.match(/^(?:[\d\s\w]+\s+)?(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)/);
    if (!match) continue;

    try {
      const homeTeam = match[1].trim();
      const awayTeam = match[2].trim();
      const homeScore = parseInt(match[3]);
      const awayScore = parseInt(match[4]);

      let teamPoints = -1;

      if (context === 'home' && homeTeam.toLowerCase().includes(lowerTeamName)) {
        if (homeScore > awayScore) teamPoints = 3;
        else if (homeScore === awayScore) teamPoints = 1;
        else teamPoints = 0;
      } else if (context === 'away' && awayTeam.toLowerCase().includes(lowerTeamName)) {
        if (awayScore > homeScore) teamPoints = 3;
        else if (awayScore === homeScore) teamPoints = 1;
        else teamPoints = 0;
      }

      if (teamPoints !== -1) points.push(teamPoints);
    } catch (e) {
      console.error("Error parsing raw result line:", line, e);
    }
  }

  const calculatePpg = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const l4 = points.slice(0, 4);
  const l8 = points.slice(0, 8);
  const l12 = points.slice(0, 12);

  return {
    ppgL4: calculatePpg(l4),
    ppgL8: calculatePpg(l8),
    ppgL12: calculatePpg(l12),
    gamesFound: points.length
  };
};

export const parseVolatilityData = (rawResults: string, teamName: string, context: 'home' | 'away') => {
  const defaultStats = {
    volatilityPercent: 0,
    meanScored: 0,
    stdDevScored: 0,
    scoredCV: 0,
    meanConceded: 0,
    stdDevConceded: 0,
    concededCV: 0
  };

  if (!rawResults || !teamName) return defaultStats;

  const lines = (rawResults || "").split('\n').filter(Boolean);
  const goalsScored: number[] = [];
  const goalsConceded: number[] = [];
  const lowerTeamName = (teamName || "").toLowerCase();

  if (!lowerTeamName) return defaultStats;

  for (const line of lines) {
    const match = line.match(/^(?:[\d\s\w]+\s+)?(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)/);
    if (!match) continue;

    try {
      const homeTeam = match[1].trim();
      const awayTeam = match[2].trim();
      const homeScore = parseInt(match[3]);
      const awayScore = parseInt(match[4]);

      if (context === 'home' && homeTeam.toLowerCase().includes(lowerTeamName)) {
        goalsScored.push(homeScore);
        goalsConceded.push(awayScore);
      } else if (context === 'away' && awayTeam.toLowerCase().includes(lowerTeamName)) {
        goalsScored.push(awayScore);
        goalsConceded.push(homeScore);
      }
    } catch (e) {
      console.error("Error parsing raw result line for volatility:", line, e);
    }
  }

  if (goalsScored.length < 5) return defaultStats;

  const scoredStats = calculateStdDev(goalsScored);
  const concededStats = calculateStdDev(goalsConceded);

  const scoredCV = (scoredStats.mean > 0) ? (scoredStats.stdDev / scoredStats.mean) : 0;
  const concededCV = (concededStats.mean > 0) ? (concededStats.stdDev / concededStats.mean) : 0;

  const avgCV = (scoredCV + concededCV) / 2;
  const volatilityPercent = Math.min(avgCV / 1.0, 1.5) * 100;

  return {
    volatilityPercent,
    meanScored: scoredStats.mean,
    stdDevScored: scoredStats.stdDev,
    scoredCV,
    meanConceded: concededStats.mean,
    stdDevConceded: concededStats.stdDev,
    concededCV
  };
};

export const parsePpgForFlags = (ppgBlock: string): PPGFlagsData => {
  const lines = (ppgBlock || '').split('\n');
  let homeL8 = 0, awayL8 = 0, homeBias = 0, awayBias = 0;
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('PPG L8')) {
      const parts = trimmedLine.split(/\s{2,}/);
      if (parts.length >= 6) {
        homeL8 = parseFloat(parts[parts.length - 3] || 0);
        awayL8 = parseFloat(parts[parts.length - 2] || 0);
      }
    } else if (trimmedLine.startsWith('PPG Bias')) {
      const parts = trimmedLine.split(/\s{2,}/);
      if (parts.length >= 6) {
        homeBias = parseFloat(parts[parts.length - 3] || 0);
        awayBias = parseFloat(parts[parts.length - 2] || 0);
      }
    }
  });
  return { homeL8, awayL8, homeBias, awayBias };
};

export const parseVenueForFlags = (atVenueStats: string): VenueFlagsData => {
  const lines = (atVenueStats || '').split('\n');
  let homePpg = 0, awayPpg = 0, homeFTS = 0, awayFTS = 0, homeFTC = 0, awayFTC = 0;
  let homeFHG = 0, awayFHG = 0, homeCleanSheet = 0, awayCleanSheet = 0, homeScoringRate = 0, awayScoringRate = 0;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    const parts = trimmedLine.split(/\s{2,}/);
    if (parts.length >= 3) {
      const statName = parts[0];
      const homeVal = parseFloat(parts[1] || 0);
      const awayVal = parseFloat(parts[2] || 0);

      if (statName.startsWith('PPG')) {
        homePpg = homeVal;
        awayPpg = awayVal;
      } else if (statName.startsWith('First to score (%)')) {
        homeFTS = homeVal;
        awayFTS = awayVal;
      } else if (statName.startsWith('First to concede (%)')) {
        homeFTC = homeVal;
        awayFTC = awayVal;
      } else if (statName.startsWith('Games with a FHG (%)')) {
        homeFHG = homeVal;
        awayFHG = awayVal;
      } else if (statName.startsWith('Clean sheets (%)')) {
        homeCleanSheet = homeVal;
        awayCleanSheet = awayVal;
      } else if (statName.startsWith('Scoring Rate') && !statName.includes('L8') && !statName.includes('Half')) {
        homeScoringRate = homeVal;
        awayScoringRate = awayVal;
      }
    }
  });

  return {
    homePpg, awayPpg, homeFTS, awayFTS, homeFTC, awayFTC,
    homeFHG, awayFHG, homeCleanSheet, awayCleanSheet, homeScoringRate, awayScoringRate
  };
};

export const parseIndexForFlags = (indexBlock: string): IndexFlagsData => {
  const lines = (indexBlock || '').split('\n');
  let homeOffence = 0, homeDefence = 0, awayOffence = 0, awayDefence = 0;
  let hva = 0, goalEdge = 0;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    const parts = trimmedLine.split(/\s{2,}/);

    if (trimmedLine.startsWith('Offence') && parts.length >= 3) {
      homeOffence = parseFloat(parts[1] || 0);
      awayOffence = parseFloat(parts[2] || 0);
    } else if (trimmedLine.startsWith('Defence') && parts.length >= 3) {
      homeDefence = parseFloat(parts[1] || 0);
      awayDefence = parseFloat(parts[2] || 0);
    } else if (trimmedLine.startsWith('H v A') && parts.length >= 2) {
      hva = parseFloat(parts[1] || 0);
    } else if (trimmedLine.startsWith('Goal Edge') && parts.length >= 2) {
      goalEdge = parseFloat(parts[1] || 0);
    }
  });

  return { homeOffence, homeDefence, awayOffence, awayDefence, hva, goalEdge };
};

export const parse5MinForFlags = (home5min: string, away5min: string) => {
  let homeScoredLate = 0, homeConcededLate = 0;
  let awayScoredLate = 0, awayConcededLate = 0;

  const parseBlock = (data: string, context: 'home' | 'away') => {
    if (!data) return { scored: 0, conceded: 0 };
    let scored = 0, conceded = 0;
    const lines = data.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      const statName = LATE_SEGMENTS.find(s => trimmedLine.startsWith(s + ' ') || trimmedLine.startsWith(s + '\t'));
      if (statName) {
        const parts = trimmedLine.split(/\s{2,}/);
        if (parts.length >= 4) {
          const val = parts[context === 'home' ? 2 : 3];
          const score = val.split('-');
          if (score.length === 2) {
            scored += parseFloat(score[0]) || 0;
            conceded += parseFloat(score[1]) || 0;
          }
        }
      }
    });
    return { scored, conceded };
  };

  const homeLate = parseBlock(home5min, 'home');
  const awayLate = parseBlock(away5min, 'away');

  return {
    homeScoredLate: homeLate.scored,
    homeConcededLate: homeLate.conceded,
    awayScoredLate: awayLate.scored,
    awayConcededLate: awayLate.conceded
  };
};

export const parseResilienceForFlags = (
  homeRawResults: string,
  awayRawResults: string,
  homeTeamName: string,
  awayTeamName: string
): ResilienceStats => {
  const parseTeamResilience = (rawResults: string, teamName: string, context: 'home' | 'away') => {
    if (!rawResults || !teamName) return { comebackRate: 0, droppedPointsRate: 0 };
    const lines = rawResults.split('\n').filter(Boolean);
    const lowerTeamName = teamName.toLowerCase();

    let htLead = 0, htLead_DroppedPoints = 0;
    let htLoss = 0, htLoss_Comeback = 0;

    for (const line of lines) {
      const match = line.match(/^(.*?)\s+v\s+(.*?)\s+(\d+)-(\d+)\s+\((\d+)-(\d+)\)/);
      if (!match) continue;

      try {
        const homeTeam = match[1].trim();
        const awayTeam = match[2].trim();
        const homeFT = parseInt(match[3]);
        const awayFT = parseInt(match[4]);
        const homeHT = parseInt(match[5]);
        const awayHT = parseInt(match[6]);

        let htResult, ftResult;

        if (context === 'home' && homeTeam.toLowerCase().includes(lowerTeamName)) {
          htResult = homeHT - awayHT;
          ftResult = homeFT - awayFT;
        } else if (context === 'away' && awayTeam.toLowerCase().includes(lowerTeamName)) {
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

    const comebackRate = (htLoss > 0) ? (htLoss_Comeback / htLoss) * 100 : 0;
    const droppedPointsRate = (htLead > 0) ? (htLead_DroppedPoints / htLead) * 100 : 0;

    return { comebackRate, droppedPointsRate };
  };

  const homeResilience = parseTeamResilience(homeRawResults, homeTeamName, 'home');
  const awayResilience = parseTeamResilience(awayRawResults, awayTeamName, 'away');

  return {
    homeComeback: homeResilience.comebackRate,
    homeDropped: homeResilience.droppedPointsRate,
    awayComeback: awayResilience.comebackRate,
    awayDropped: awayResilience.droppedPointsRate
  };
};

export const parseHalfDataForFlags = (scoredBlock: string, concededBlock: string): HalfDataStats => {
  const parseBlock = (block: string, category: string) => {
    if (!block) return { homePct: 0, awayPct: 0 };
    const lines = block.split('\n');
    let homeH2HLine = lines.find(l => l.trim().startsWith('H@H:') && l.includes('GOALS BY HALF'));
    let awayA2ALine = lines.find(l => l.trim().startsWith('A@A:') && l.includes('GOALS BY HALF'));

    let homePct = 0, awayPct = 0;

    if (homeH2HLine) {
      const match = homeH2HLine.match(/2nd\s+(\d+)%/);
      if (match) homePct = parseFloat(match[1] || 0);
    }
    if (awayA2ALine) {
      const match = awayA2ALine.match(/2nd\s+(\d+)%/);
      if (match) awayPct = parseFloat(match[1] || 0);
    }
    return { homePct, awayPct };
  };

  const scoredData = parseBlock(scoredBlock, 'scored');
  const concededData = parseBlock(concededBlock, 'conceded');

  return {
    homeScoredHalf2Pct: scoredData.homePct,
    awayScoredHalf2Pct: scoredData.awayPct,
    homeConcededHalf2Pct: concededData.homePct,
    awayConcededHalf2Pct: concededData.awayPct
  };
};
