import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Cell
} from "recharts";
import { RawResultsMatch } from "@/types";
import { parseTeamRanks } from "@/services/parsingService";

interface OpponentScatterProps {
  matches: RawResultsMatch[];
  leagueTable: string;
  targetTeamName: string; // "Home" or "Away" team name for context
  isHomeTeam: boolean; // To determine color theme
  description?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 p-2 rounded shadow-lg z-50 text-xs">
          <p className="font-bold text-white mb-1">{data.opponent}</p>
          <p className="text-gray-300">Rank: {data.y}</p>
          <p className="text-gray-300">Score: {data.score}</p>
          <p className={`font-bold ${data.gd > 0 ? 'text-green-400' : data.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {data.gd > 0 ? `Won by ${data.gd}` : data.gd < 0 ? `Lost by ${Math.abs(data.gd)}` : 'Draw'}
          </p>
        </div>
      );
    }
    return null;
  };

export const OpponentScatter = ({ matches, leagueTable, targetTeamName, isHomeTeam, description }: OpponentScatterProps) => {
  const rankMap = useMemo(() => parseTeamRanks(leagueTable), [leagueTable]);

  const data = useMemo(() => {
    return matches.map(m => {
        const opponentName = m.targetTeamLocation === "Home" ? m.awayTeam : m.homeTeam;
        let rank = 0; // 0 will mean unranked/unknown

        // Fuzzy Rank Logic
        const lowerOpName = opponentName.toLowerCase();
        if (rankMap[lowerOpName]) {
            rank = rankMap[lowerOpName];
        } else {
            const key = Object.keys(rankMap).find(k => k.includes(lowerOpName) || lowerOpName.includes(k));
            if (key) rank = rankMap[key];
        }

        // Filter out if no rank found (or handle gracefully)
        if (!rank) return null;

        const gd = m.goalsFor - m.goalsAgainst;

        return {
            x: gd,
            y: rank,
            opponent: opponentName,
            score: m.ftScore,
            result: m.targetTeamResult,
        };
    }).filter(Boolean);
  }, [matches, rankMap]);

  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-500 text-xs">No Data</div>;

  // Colors
  const winColor = isHomeTeam ? "#34d399" : "#60a5fa";
  const lossColor = "#f87171";
  const drawColor = "#9ca3af";

  return (
    <div className="w-full h-80 bg-gray-800/30 p-2 rounded border border-gray-700/50 flex flex-col">
        {description && (
            <div className="mb-2 text-[10px] text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                <span className="font-semibold text-indigo-400">How to read:</span> {description}
            </div>
        )}
        <h4 className="text-xs font-semibold text-gray-300 text-center mb-2">
            {isHomeTeam ? "Home" : "Away"} Perf. vs Rank
        </h4>
        <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                {/* X Axis is Goal Difference */}
                <XAxis
                    type="number"
                    dataKey="x"
                    name="Goal Diff"
                    stroke="#6B7280"
                    tick={{ fontSize: 10 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                >
                    <Label value="Goal Difference" offset={-5} position="insideBottom" style={{ fill: '#4B5563', fontSize: 10 }} />
                </XAxis>

                {/* Y Axis is Rank (Reversed) */}
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Rank"
                    stroke="#6B7280"
                    reversed={true}
                    domain={[1, 20]}
                    tick={{ fontSize: 10 }}
                    width={30}
                >
                    <Label value="Opponent Rank" angle={-90} position="insideLeft" style={{ fill: '#4B5563', fontSize: 10 }} />
                </YAxis>

                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                <ReferenceLine x={0} stroke="#4B5563" strokeWidth={2} />

                <Scatter name="Matches" data={data as any} shape="circle">
                    {data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.x > 0 ? winColor : entry.x < 0 ? lossColor : drawColor} />
                    ))}
                </Scatter>
            </ScatterChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
