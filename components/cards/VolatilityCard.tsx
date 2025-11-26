import { VolatilityStats } from "@/types";
import { VolatilityIcon } from "@/components/icons";

interface VolatilityCardProps {
  teamName: string;
  volatilityData: VolatilityStats;
}

export const VolatilityCard = ({
  teamName,
  volatilityData,
}: VolatilityCardProps) => {
  const {
    volatilityPercent,
    meanScored,
    stdDevScored,
    scoredCV,
    meanConceded,
    stdDevConceded,
    concededCV,
  } = volatilityData;

  // Helper to calculate range (Mean +/- 1 SD), clamped at 0
  const getRange = (mean: number, sd: number) => {
    const low = Math.max(0, mean - sd).toFixed(1);
    const high = (mean + sd).toFixed(1);
    return `${low} - ${high}`;
  };

  // Determine color based on volatility
  const getColor = (val: number) => {
    if (val < 35) return "text-green-400"; // Consistent/Predictable
    if (val < 65) return "text-yellow-400"; // Moderate
    return "text-red-400"; // Volatile
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-bold text-white flex items-center gap-2">
          <VolatilityIcon /> {teamName}
        </h3>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getColor(volatilityPercent)}`}>
            {volatilityPercent.toFixed(0)}%
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            Volatility Score
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scored Section */}
        <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-green-400 uppercase">
              Scoring Performance
            </span>
            <span className="text-xs text-gray-500">CV: {scoredCV.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Mean Goals</p>
              <p className="text-lg font-mono text-white">{meanScored.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Expected Range</p>
              <p className="text-lg font-mono text-white">
                {getRange(meanScored, stdDevScored)}
              </p>
            </div>
          </div>
        </div>

        {/* Conceded Section */}
        <div className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase">
              Defense Performance
            </span>
            <span className="text-xs text-gray-500">CV: {concededCV.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Mean Conceded</p>
              <p className="text-lg font-mono text-white">{meanConceded.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Expected Range</p>
              <p className="text-lg font-mono text-white">
                {getRange(meanConceded, stdDevConceded)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
