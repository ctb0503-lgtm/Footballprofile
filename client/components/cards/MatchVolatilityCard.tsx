import { VolatilityStats } from "@/types";
import { Activity } from "lucide-react";

interface MatchVolatilityCardProps {
  homeData: VolatilityStats;
  awayData: VolatilityStats;
}

export const MatchVolatilityCard = ({
  homeData,
  awayData,
}: MatchVolatilityCardProps) => {
  // 1. Combined Volatility (Average)
  const combinedVolatility =
    (homeData.volatilityPercent + awayData.volatilityPercent) / 2;

  // 2. Combined Match Goals (Average Total Goals appearing in Home games vs Away games)
  const homeAvgTotal = homeData.meanScored + homeData.meanConceded;
  const awayAvgTotal = awayData.meanScored + awayData.meanConceded;
  const matchAvgTotal = (homeAvgTotal + awayAvgTotal) / 2;

  // 3. Match Range (Combining the ranges)
  // Lower: Average of (Home Lower + Away Lower)
  // Upper: Average of (Home Upper + Away Upper)
  const homeLower = Math.max(0, homeAvgTotal - (homeData.stdDevScored + homeData.stdDevConceded)); // Approximation for display
  const homeUpper = homeAvgTotal + (homeData.stdDevScored + homeData.stdDevConceded);

  const awayLower = Math.max(0, awayAvgTotal - (awayData.stdDevScored + awayData.stdDevConceded));
  const awayUpper = awayAvgTotal + (awayData.stdDevScored + awayData.stdDevConceded);

  const matchLower = (homeLower + awayLower) / 2;
  const matchUpper = (homeUpper + awayUpper) / 2;

  const getColor = (val: number) => {
    if (val < 40) return "text-green-400";
    if (val < 70) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="bg-gray-900 border-2 border-indigo-500/30 p-4 rounded-lg shadow-lg relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-md font-bold text-indigo-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" /> Match Volatility
        </h3>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getColor(combinedVolatility)}`}>
            {combinedVolatility.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="bg-indigo-950/30 p-3 rounded border border-indigo-500/20">
          <p className="text-xs text-indigo-300 uppercase font-semibold mb-2">
            Combined Goal Expectancy
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-400">Mean Total Goals</p>
              <p className="text-xl font-mono text-white">
                {matchAvgTotal.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Expected Range</p>
              <p className="text-xl font-mono text-indigo-200">
                {matchLower.toFixed(1)} - {matchUpper.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div className="bg-gray-900/50 p-2 rounded border border-gray-800">
            Home Involvement: {homeAvgTotal.toFixed(2)} avg goals
          </div>
          <div className="bg-gray-900/50 p-2 rounded border border-gray-800 text-right">
            Away Involvement: {awayAvgTotal.toFixed(2)} avg goals
          </div>
        </div>
      </div>
    </div>
  );
};
