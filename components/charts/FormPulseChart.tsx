import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";
import { RawResultsMatch } from "@/types";
import { parseTeamRanks } from "@/services/parsingService";

interface FormPulseChartProps {
  matches: RawResultsMatch[];
  leagueTable: string;
  targetTeamName: string;
  currentOpponentName?: string;
  description?: string; // New prop for explanation
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    // Explicitly map single-char result to full word
    let resultText = "Draw";
    let resultClass = "text-gray-400";

    if (data.result === 'W') {
        resultText = "Win";
        resultClass = "text-green-400";
    } else if (data.result === 'L') {
        resultText = "Loss";
        resultClass = "text-red-400";
    }

    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-lg z-50">
        <p className="text-white font-bold mb-1">{data.date}</p>
        <p className="text-gray-300 text-sm">
          vs <span className="font-semibold text-white">{data.opponent}</span> ({data.location === "Home" ? "H" : "A"})
        </p>
        <p className="text-gray-400 text-xs mb-2">Opponent Rank: {data.rank}</p>
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-700">
          <span className={`font-bold ${resultClass}`}>
            Result: {resultText}
          </span>
          <span className="font-mono text-white">{data.score}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const FormPulseChart = ({ matches, leagueTable, targetTeamName, currentOpponentName, description }: FormPulseChartProps) => {
  const rankMap = useMemo(() => parseTeamRanks(leagueTable), [leagueTable]);

  const data = useMemo(() => {
    // Take last 10 matches max, reverse to show chronological order (oldest -> newest)
    const recentMatches = [...matches].slice(0, 10).reverse();

    return recentMatches.map((m, idx) => {
      const opponentName = m.targetTeamLocation === "Home" ? m.awayTeam : m.homeTeam;

      // Fuzzy rank lookup
      let rank = 10; // Default to mid-table if not found
      const lowerOpName = opponentName.toLowerCase();

      if (rankMap[lowerOpName]) {
        rank = rankMap[lowerOpName];
      } else {
        // Try fuzzy
        const key = Object.keys(rankMap).find(k => k.includes(lowerOpName) || lowerOpName.includes(k));
        if (key) rank = rankMap[key];
      }

      return {
        index: idx,
        date: m.date,
        opponent: opponentName,
        rank: rank,
        result: m.targetTeamResult,
        score: m.ftScore,
        location: m.targetTeamLocation,
        // Visual helpers
        color: m.targetTeamResult === 'W' ? '#4ade80' : m.targetTeamResult === 'D' ? '#9ca3af' : '#f87171',
      };
    });
  }, [matches, rankMap]);

  // Get current opponent rank for reference line
  const currentOpponentRank = useMemo(() => {
     if(!currentOpponentName) return null;
     const lower = currentOpponentName.toLowerCase();
     if (rankMap[lower]) return rankMap[lower];
     const key = Object.keys(rankMap).find(k => k.includes(lower) || lower.includes(k));
     return key ? rankMap[key] : null;
  }, [currentOpponentName, rankMap]);

  if (data.length === 0) {
      return <div className="text-center text-gray-500 py-10">No raw match results available.</div>
  }

  return (
    <div className="w-full h-96 bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
       {description && (
        <div className="mb-4 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
            <span className="font-semibold text-indigo-400">How to read:</span> {description}
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-200">Form Pulse (Opponent Difficulty)</h3>
        <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Win</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Draw</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Loss</div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {/* UPDATED MARGIN: Changed left from -20 to 0 to prevent axis cutoff */}
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            type="number"
            domain={[1, 20]}
            reversed={true}
            hide={false}
            width={30}
            stroke="#9CA3AF"
            tick={{ fontSize: 10 }}
            label={{ value: 'Opponent Rank', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontSize: 10 } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4B5563', strokeWidth: 1, strokeDasharray: '4 4' }} />

          {currentOpponentRank && (
            <ReferenceLine y={currentOpponentRank} stroke="#6366f1" strokeDasharray="3 3" isFront={true} />
          )}

          <Line
            type="monotone"
            dataKey="rank"
            stroke="#4B5563"
            strokeWidth={1}
            dot={false}
            activeDot={false}
          />

          <Scatter dataKey="rank">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};
