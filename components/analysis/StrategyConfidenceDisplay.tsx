import { StrategyEvaluation } from "../../types"; // Adjusted import path
import { CheckCircle2, XCircle, AlertTriangle, PlusCircle } from "lucide-react";
import { useDailyPlan } from "../../hooks/useDailyPlan"; // Adjusted import path
import { useToast } from "../../hooks/use-toast"; // Adjusted import path

interface StrategyConfidenceDisplayProps {
  evaluations: StrategyEvaluation[];
  matchTitle: string;
}

export const StrategyConfidenceDisplay = ({ evaluations, matchTitle }: StrategyConfidenceDisplayProps) => {
  const dailyPlan = useDailyPlan();
  const { toast } = useToast();

  if (evaluations.length === 0) return <div className="text-gray-500 p-6 text-center italic">No strategy evaluation data available. Please generate a profile first.</div>;

  const getBadgeColor = (conf: string) => {
    switch (conf) {
      case "High": return "bg-green-600 text-white";
      case "Medium": return "bg-yellow-500 text-black";
      case "Low": return "bg-orange-500 text-white";
      case "Avoid": return "bg-red-600 text-white";
      default: return "bg-gray-600";
    }
  };

  const getConfidenceIcon = (conf: string) => {
    switch (conf) {
      case "High": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "Medium": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Low": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "Avoid": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {evaluations.map((strat) => (
        <div key={strat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col shadow-xl hover:shadow-2xl transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {getConfidenceIcon(strat.confidence)}
                    {strat.name}
                </h3>
                <span className="text-xs text-gray-500">{strat.type} | Score: {strat.score.toFixed(0)}%</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${getBadgeColor(strat.confidence)}`}>
              {strat.confidence}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-4 h-10 overflow-hidden">{strat.reasoning}</p>

          <div className="flex-1 space-y-2 mb-4 p-3 bg-gray-950 rounded-lg border border-gray-800">
             <h4 className="text-xs font-semibold text-gray-400 mb-1 border-b border-gray-700 pb-1">Confidence Criteria ({strat.criteria.filter(c => c.passed).length}/{strat.criteria.length} passed)</h4>
             {strat.criteria.map((crit, idx) => (
                 <div key={idx} className="flex justify-between items-center text-xs">
                     <span className={`w-3/5 truncate ${crit.passed ? 'text-green-300' : 'text-red-400'}`}>{crit.label}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-mono text-right w-16">{crit.value}</span>
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
                    notes: `Auto-Rating: ${strat.confidence} (${strat.score.toFixed(0)}%). ${strat.reasoning}`
                 });
                 toast({ title: "Added to Journal", description: `${strat.name} added to Daily Plan.` });
             }}
             disabled={strat.confidence === 'Avoid'}
             className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto"
          >
             <PlusCircle className="h-4 w-4" /> Add to Plan
          </button>
        </div>
      ))}
    </div>
  );
};
