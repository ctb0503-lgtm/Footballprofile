import { StrategyEvaluation } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle, PlusCircle } from "lucide-react";
import { useDailyPlan } from "@/hooks/useDailyPlan";
import { useToast } from "@/hooks/use-toast";

interface StrategyConfidenceDisplayProps {
  evaluations: StrategyEvaluation[];
  matchTitle: string;
}

export const StrategyConfidenceDisplay = ({ evaluations, matchTitle }: StrategyConfidenceDisplayProps) => {
  const dailyPlan = useDailyPlan();
  const { toast } = useToast();

  if (evaluations.length === 0) return <div className="text-gray-500">No strategy data available.</div>;

  const getBadgeColor = (conf: string) => {
    switch (conf) {
      case "High": return "bg-green-500 text-black";
      case "Medium": return "bg-yellow-500 text-black";
      case "Low": return "bg-orange-500 text-white";
      case "Avoid": return "bg-red-600 text-white";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {evaluations.map((strat) => (
        <div key={strat.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="text-white font-bold text-sm">{strat.name}</h3>
                <span className="text-xs text-gray-500">{strat.type}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getBadgeColor(strat.confidence)}`}>
              {strat.confidence}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-4 h-8">{strat.reasoning}</p>

          <div className="flex-1 space-y-2 mb-4">
             {strat.criteria.map((crit, idx) => (
                 <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-800 pb-1">
                     <span className="text-gray-400">{crit.label}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{crit.value}</span>
                        {crit.passed ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                        )}
                     </div>
                 </div>
             ))}
          </div>

          <button
             onClick={() => {
                 dailyPlan.addToPlan({
                    match: matchTitle,
                    strategy: strat.name,
                    confidence: strat.confidence,
                    notes: `Auto-Rating: ${strat.confidence}. ${strat.reasoning}`
                 });
                 toast({ title: "Added to Journal", description: `${strat.name} added.` });
             }}
             disabled={strat.confidence === 'Avoid'}
             className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
          >
             <PlusCircle className="h-4 w-4" /> Add to Plan
          </button>
        </div>
      ))}
    </div>
  );
};
