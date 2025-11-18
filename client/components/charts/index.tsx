import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Label,
} from "recharts";
import { PPGChartData, SegmentChartData } from "@/types";

// --- Export the new heatmap component ---
export { GoalHeatmap } from "./GoalHeatmap";
// ----------------------------------------

interface PpgChartProps {
  data: PPGChartData[];
}

export const PpgChart = ({ data }: PpgChartProps) => (
  <div className="w-full h-64 bg-gray-800 p-4 rounded-lg border border-gray-700 my-4">
    <h3 className="text-sm font-medium text-center text-gray-300 mb-2">
      Venue Form & Bias (PPG)
    </h3>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
        <XAxis dataKey="name" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
          }}
          labelStyle={{ color: "#F9FAFB" }}
        />
        <Legend />
        <Bar dataKey="PPG" fill="#8884d8" />
        <Bar dataKey="PPG L8" fill="#82ca9d" />
        <Bar dataKey="Opp PPG L8" fill="#ffc658" />
        <Bar dataKey="PPG Bias" fill="#f472b6" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

interface FiveMinSegmentChartProps {
  data: SegmentChartData[];
}

export const FiveMinSegmentChart = ({ data }: FiveMinSegmentChartProps) => (
  <div className="w-full h-72 bg-gray-800 p-4 rounded-lg border border-gray-700 my-4">
    <h3 className="text-sm font-medium text-center text-gray-300 mb-2">
      5-Min Goal Segments (Scored vs Conceded)
    </h3>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
        <XAxis
          dataKey="segment"
          stroke="#9CA3AF"
          angle={-45}
          textAnchor="end"
          interval={0}
          fontSize="10px"
        />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
          }}
          labelStyle={{ color: "#F9FAFB" }}
        />
        <Legend wrapperStyle={{ bottom: 0 }} />
        <Bar dataKey="Home Scored" name="Home Scored (H@H)" fill="#34D399" />
        <Bar
          dataKey="Home Conceded"
          name="Home Conceded (H@H)"
          fill="#F87171"
        />
        <Bar dataKey="Away Scored" name="Away Scored (A@A)" fill="#60A5FA" />
        <Bar
          dataKey="Away Conceded"
          name="Away Conceded (A@A)"
          fill="#FCD34D"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

interface CustomQuadrantTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: any }>;
}

const CustomQuadrantTooltip = ({
  active,
  payload,
}: CustomQuadrantTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white p-3 rounded-md border border-gray-700 shadow-lg opacity-95">
        <p className="font-bold text-sm mb-1">{data.name}</p>
        <p className="text-xs">Goals For (per game): {data.x.toFixed(2)}</p>
        <p className="text-xs">Goals Against (per game): {data.y.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

interface LeagueStyleQuadrantChartProps {
  leagueTableData?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}

export const LeagueStyleQuadrantChart = ({
  leagueTableData,
  homeTeamName,
  awayTeamName,
}: LeagueStyleQuadrantChartProps) => {
  const chartData = useMemo(() => {
    if (!leagueTableData) return { teams: [], avgGF: 0, avgGA: 0 };

    let teams = [];
    let totalGF = 0;
    let totalGA = 0;
    let totalGP = 0;

    const regex =
      /^\s*\d+\.?\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    const lines = leagueTableData.split("\n");

    lines.forEach((line) => {
      const match = line.trim().match(regex);
      if (match) {
        try {
          const teamName = match[1].trim();
          const gp = parseInt(match[2]);
          const gf = parseInt(match[6]);
          const ga = parseInt(match[7]);

          if (gp > 0) {
            const gfPerGame = gf / gp;
            const gaPerGame = ga / gp;

            totalGF += gf;
            totalGA += ga;
            totalGP += gp;

            let fill = "#60A5FA";
            let shape = "circle";
            let size = 60;

            if (
              homeTeamName &&
              teamName.toLowerCase().includes(homeTeamName.toLowerCase())
            ) {
              fill = "#34D399";
              shape = "star";
              size = 150;
            } else if (
              awayTeamName &&
              teamName.toLowerCase().includes(awayTeamName.toLowerCase())
            ) {
              fill = "#F87171";
              shape = "star";
              size = 150;
            }

            teams.push({
              name: teamName,
              x: gfPerGame,
              y: gaPerGame,
              fill,
              shape,
              size,
            });
          }
        } catch (e) {
          console.error("Error parsing league table line:", line, e);
        }
      }
    });

    const avgGF = totalGP > 0 ? totalGF / totalGP : 0;
    const avgGA = totalGP > 0 ? totalGA / totalGP : 0;

    return { teams, avgGF, avgGA };
  }, [leagueTableData, homeTeamName, awayTeamName]);

  if (chartData.teams.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4 text-center text-gray-400">
        Paste a league table to activate the League Style Quadrant.
      </div>
    );
  }

  const leagueTeams = chartData.teams.filter((t) => t.fill === "#60A5FA");
  const homeTeam = chartData.teams.filter((t) => t.fill === "#34D399");
  const awayTeam = chartData.teams.filter((t) => t.fill === "#F87171");

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4 relative">
      <h3 className="text-lg font-semibold text-white text-center mb-2">
        League Style Quadrant
      </h3>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none p-12">
        <span className="absolute top-0 left-0 text-xs font-bold text-gray-600">
          Strugglers (Low Atk, Weak Def)
        </span>
        <span className="absolute top-0 right-0 text-xs font-bold text-gray-600">
          All-Out Attack (High Atk, Weak Def)
        </span>
        <span className="absolute bottom-0 left-0 text-xs font-bold text-gray-600">
          Defensive (Low Atk, Strong Def)
        </span>
        <span className="absolute bottom-0 right-0 text-xs font-bold text-gray-600">
          Elite (High Atk, Strong Def)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis
            type="number"
            dataKey="x"
            name="Goals For (per game)"
            stroke="#9CA3AF"
            label={{
              value: "Goals For (per game)",
              position: "bottom",
              offset: 0,
              fill: "#9CA3AF",
            }}
            domain={[0, "dataMax + 0.2"]}
            tickCount={6}
            tickFormatter={(tick) => tick.toFixed(1)}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Goals Against (per game)"
            stroke="#9CA3AF"
            label={{
              value: "Goals Against (per game)",
              angle: -90,
              position: "insideLeft",
              fill: "#9CA3AF",
            }}
            domain={[0, "dataMax + 0.2"]}
            tickCount={6}
            tickFormatter={(tick) => tick.toFixed(1)}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={<CustomQuadrantTooltip />}
          />

          <ReferenceLine
            x={chartData.avgGF}
            stroke="#a78bfa"
            strokeDasharray="4 4"
          >
            <Label
              value="Avg. GF"
              position="top"
              fill="#a78bfa"
              fontSize="10"
            />
          </ReferenceLine>
          <ReferenceLine
            y={chartData.avgGA}
            stroke="#f472b6"
            strokeDasharray="4 4"
          >
            <Label
              value="Avg. GA"
              position="right"
              fill="#f472b6"
              fontSize="10"
            />
          </ReferenceLine>

          <Scatter
            name="League Teams"
            data={leagueTeams}
            fill="#60A5FA"
            shape="circle"
          />
          <Scatter
            name={homeTeamName || "Home"}
            data={homeTeam}
            fill="#34D399"
            shape="star"
            size={150}
          />
          <Scatter
            name={awayTeamName || "Away"}
            data={awayTeam}
            fill="#F87171"
            shape="star"
            size={150}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 text-center mt-2">
        <span
          className="inline-block w-3 h-3 align-middle bg-green-400 mr-1"
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        ></span>{" "}
        Home: {homeTeamName || "N/A"}
        <span
          className="inline-block w-3 h-3 align-middle bg-red-400 ml-4 mr-1"
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        ></span>{" "}
        Away: {awayTeamName || "N/A"}
        <span className="inline-block w-3 h-3 align-middle rounded-full bg-blue-400 ml-4 mr-1"></span>{" "}
        League
      </p>
    </div>
  );
};
