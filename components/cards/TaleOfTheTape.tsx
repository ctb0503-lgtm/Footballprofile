import { useMemo } from "react";
import { VenueFlagsData, PPGFlagsData } from "@/types";

interface TaleOfTheTapeProps {
  homeName: string;
  awayName: string;
  venueData: VenueFlagsData;
  ppgData: PPGFlagsData;
}

interface StatRowProps {
  label: string;
  homeValue: number;
  awayValue: number;
  format?: (val: number) => string;
  inverse?: boolean; // If true, lower is better (e.g. Conceding Rate)
}

const StatRow = ({ label, homeValue, awayValue, format = (v) => v.toFixed(2), inverse = false }: StatRowProps) => {
  const total = homeValue + awayValue || 1;
  const homeWidth = (homeValue / total) * 100;
  const awayWidth = (awayValue / total) * 100;

  // Determine winner color
  const homeWins = inverse ? homeValue < awayValue : homeValue > awayValue;
  const isDraw = homeValue === awayValue;

  const homeColor = isDraw ? "bg-gray-500" : homeWins ? "bg-green-500" : "bg-gray-700";
  const awayColor = isDraw ? "bg-gray-500" : !homeWins ? "bg-green-500" : "bg-gray-700";

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1 uppercase font-semibold tracking-wider">
        <span>{format(homeValue)}</span>
        <span>{label}</span>
        <span>{format(awayValue)}</span>
      </div>
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-800">
        <div
            style={{ width: `${homeWidth}%` }}
            className={`h-full ${homeColor} transition-all duration-500`}
        />
        <div
            style={{ width: `${awayWidth}%` }}
            className={`h-full ${awayColor} transition-all duration-500`}
        />
      </div>
    </div>
  );
};

export const TaleOfTheTape = ({ homeName, awayName, venueData, ppgData }: TaleOfTheTapeProps) => {
    if (!venueData || !ppgData) return null;

  return (
    <div className="w-full bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-800">
         <h3 className="text-lg font-bold text-white">{homeName}</h3>
         <span className="text-gray-500 text-xs font-mono">VS</span>
         <h3 className="text-lg font-bold text-white text-right">{awayName}</h3>
      </div>

      <div className="space-y-4">
        <StatRow
            label="Points Per Game (Venue)"
            homeValue={venueData.homePpg}
            awayValue={venueData.awayPpg}
        />
        <StatRow
            label="Avg Match Goals"
            homeValue={venueData.homeAvgGoals}
            awayValue={venueData.awayAvgGoals}
        />
        <StatRow
            label="Scoring Rate"
            homeValue={venueData.homeScoringRate}
            awayValue={venueData.awayScoringRate}
        />
        <StatRow
            label="Conceding Rate"
            homeValue={venueData.homeConcedingRate}
            awayValue={venueData.awayConcedingRate}
            inverse={true}
        />
        <StatRow
            label="Both Teams To Score %"
            homeValue={venueData.homeBTTS}
            awayValue={venueData.awayBTTS}
            format={(v) => `${v}%`}
        />
        <StatRow
            label="Clean Sheet %"
            homeValue={venueData.homeCleanSheet}
            awayValue={venueData.awayCleanSheet}
            format={(v) => `${v}%`}
        />
        <StatRow
            label="Failed to Score % (FTS)"
            homeValue={venueData.homeFTS}
            awayValue={venueData.awayFTS}
            inverse={true}
            format={(v) => `${v}%`}
        />
         <StatRow
            label="PPG Bias (Form)"
            homeValue={ppgData.homeBias}
            awayValue={ppgData.awayBias}
        />
      </div>
    </div>
  );
};
