import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { SegmentChartData } from "@/types";

interface KillZoneRadarProps {
  data: SegmentChartData[];
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-lg z-50 text-xs">
          <p className="text-white font-bold mb-2">{label} Mins</p>
          {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-4 mb-1" style={{ color: entry.color }}>
                  <span>{entry.name}:</span>
                  <span className="font-mono font-bold">{entry.value}</span>
              </div>
          ))}
        </div>
      );
    }
    return null;
  };

export const KillZoneRadar = ({ data, description }: KillZoneRadarProps) => {
  const chartData = useMemo(() => {
    // Aggregate 5-min segments into 15-min chunks for cleaner Radar
    // Segments: "1-5", "6-10", "11-15" -> "0-15"
    const chunks = [
        { name: "0-15", segments: ["1-5", "6-10", "11-15"] },
        { name: "16-30", segments: ["16-20", "21-25", "26-30"] },
        { name: "31-45", segments: ["31-35", "36-40", "41-45"] },
        { name: "46-60", segments: ["46-50", "51-55", "56-60"] },
        { name: "61-75", segments: ["61-65", "66-70", "71-75"] },
        { name: "76-90+", segments: ["76-80", "81-85", "86-90"] },
    ];

    return chunks.map(chunk => {
        let homeScored = 0;
        let awayConceded = 0;
        let awayScored = 0;
        let homeConceded = 0;

        chunk.segments.forEach(seg => {
            const d = data.find(item => item.segment.startsWith(seg));
            if (d) {
                homeScored += d["Home Scored"];
                awayConceded += d["Away Conceded"];
                awayScored += d["Away Scored"];
                homeConceded += d["Home Conceded"];
            }
        });

        return {
            time: chunk.name,
            // Metric 1: Home Attack Threat (Home Scored + Away Conceded)
            homeThreat: homeScored + awayConceded,
            // Metric 2: Away Attack Threat (Away Scored + Home Conceded)
            awayThreat: awayScored + homeConceded,
            fullMark: Math.max(homeScored + awayConceded, awayScored + homeConceded) + 2 // For scaling
        };
    });
  }, [data]);

  return (
    <div className="w-full h-96 bg-gray-800/50 p-4 rounded-lg border border-gray-700 relative flex flex-col">
      {description && (
        <div className="mb-4 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50 relative z-10">
            <span className="font-semibold text-indigo-400">How to read:</span> {description}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-200 mb-2 text-center">
        Goal Threat Zones (15-min Blocks)
      </h3>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute top-0 right-0 flex flex-col gap-1 text-[10px] text-gray-400 z-10">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500/50 rounded-full"></div>Home Threat</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/50 rounded-full"></div>Away Threat</div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="time" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />

            <Radar
                name="Home Threat"
                dataKey="homeThreat"
                stroke="#10b981"
                strokeWidth={2}
                fill="#10b981"
                fillOpacity={0.3}
            />
            <Radar
                name="Away Threat"
                dataKey="awayThreat"
                stroke="#ef4444"
                strokeWidth={2}
                fill="#ef4444"
                fillOpacity={0.3}
            />
            <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
