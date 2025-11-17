import { VolatilityStats } from '@/types';
import { VolatilityIcon } from '@/components/icons';

interface VolatilityCardProps {
  teamName: string;
  volatilityData: VolatilityStats;
}

export const VolatilityCard = ({ teamName, volatilityData }: VolatilityCardProps) => {
  const { volatilityPercent, meanScored, stdDevScored, scoredCV, meanConceded, stdDevConceded, concededCV } = volatilityData;

  let color = 'text-yellow-400';
  let label = 'Moderate';
  if (volatilityPercent > 75) {
    color = 'text-red-400';
    label = 'High';
  } else if (volatilityPercent < 35) {
    color = 'text-green-400';
    label = 'Low';
  }

  return (
    <div className="relative group">
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center space-x-4 cursor-help">
        <div className={`p-2 bg-gray-800 rounded-full ${color}`}>
          <VolatilityIcon />
        </div>
        <div>
          <h4 className="text-sm text-gray-400 font-medium">{teamName} Volatility</h4>
          <p className={`text-2xl font-bold ${color}`}>{volatilityPercent.toFixed(0)}%</p>
          <p className={`text-sm font-semibold ${color}`}>({label})</p>
        </div>
      </div>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-950 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-gray-700">
        <h5 className="font-bold text-sm mb-2 text-center border-b border-gray-700 pb-1">Volatility Breakdown</h5>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="text-gray-400">Avg. Scored:</span> <span className="text-white font-mono">{meanScored.toFixed(2)}</span>
          <span className="text-gray-400">Std. Dev. Scored:</span> <span className="text-white font-mono">{stdDevScored.toFixed(2)}</span>
          <span className="text-gray-400">Scored CV:</span> <span className="text-white font-mono font-bold">{(scoredCV * 100).toFixed(0)}%</span>
          
          <span className="text-gray-400 mt-2">Avg. Conceded:</span> <span className="text-white font-mono mt-2">{meanConceded.toFixed(2)}</span>
          <span className="text-gray-400">Std. Dev. Conceded:</span> <span className="text-white font-mono">{stdDevConceded.toFixed(2)}</span>
          <span className="text-gray-400">Conceded CV:</span> <span className="text-white font-mono font-bold">{(concededCV * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
