import { StrategyBenchmark } from "@/utils/strategyBenchmarks";
import { Badge } from "@/components/ui/badge";

interface StrategyBenchmarkCardProps {
  strategy: StrategyBenchmark;
}

export const StrategyBenchmarkCard = ({ strategy }: StrategyBenchmarkCardProps) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-lg font-bold text-white mb-1">{strategy.name}</h3>
        <p className="text-xs text-gray-400">{strategy.description}</p>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pl-2 font-medium w-1/4">Metric</th>
                <th className="pb-3 font-medium text-green-400 w-1/4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> High
                  </span>
                </th>
                <th className="pb-3 font-medium text-yellow-400 w-1/4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> Med
                  </span>
                </th>
                <th className="pb-3 font-medium text-red-400 w-1/4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Low
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {strategy.benchmarks.map((row, idx) => (
                <tr key={idx} className="group hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 pl-2 font-medium text-gray-300">{row.metric}</td>
                  <td className="py-3 text-gray-400 group-hover:text-green-200 transition-colors font-mono">{row.high}</td>
                  <td className="py-3 text-gray-400 group-hover:text-yellow-200 transition-colors font-mono">{row.medium}</td>
                  <td className="py-3 text-gray-400 group-hover:text-red-200 transition-colors font-mono">{row.low}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
