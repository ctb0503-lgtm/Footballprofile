import { TradePlanItem } from "@/hooks/useDailyPlan";
import { Trash2, AlertCircle, XCircle, Clock } from "lucide-react";

interface DailyTradingPlanProps {
  plan: TradePlanItem[];
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: TradePlanItem["status"]) => void;
  onClear: () => void;
}

export const DailyTradingPlan = ({ plan, onRemove, onUpdateStatus, onClear }: DailyTradingPlanProps) => {
  if (plan.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-gray-400">Your trading journal is empty.</p>
        <p className="text-sm text-gray-500 mt-2">Generate a profile and add strategies or angles to build your plan.</p>
      </div>
    );
  }

  const getStatusColor = (status: TradePlanItem["status"]) => {
      switch(status) {
          case 'won': return 'bg-green-900/20 border-green-700/50';
          case 'lost': return 'bg-red-900/20 border-red-700/50';
          case 'void': return 'bg-gray-800/50 border-gray-600';
          case 'active': return 'bg-blue-900/20 border-blue-700/50';
          case 'skipped': return 'bg-gray-900/30 border-gray-800 opacity-60';
          default: return 'bg-gray-900 border-gray-700';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Trading Journal ({plan.length})</h2>
        <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
        >
            <Trash2 className="h-3 w-3" /> Clear All
        </button>
      </div>

      <div className="grid gap-4">
        {plan.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border transition-all ${getStatusColor(item.status)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg">{item.match}</h3>
                <p className="text-indigo-400 font-semibold text-sm">{item.strategy}</p>
              </div>
              <div className="flex gap-2 items-center">
                 <select
                    value={item.status}
                    onChange={(e) => onUpdateStatus(item.id, e.target.value as any)}
                    className="bg-gray-950 text-xs text-white border border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                 >
                     <option value="pending">⏳ Pending</option>
                     <option value="active">▶️ Active</option>
                     <option value="won">✅ Won</option>
                     <option value="lost">❌ Lost</option>
                     <option value="void">🚫 Void</option>
                     <option value="skipped">⏭️ Skipped</option>
                 </select>
                 <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-red-400 p-1">
                     <XCircle className="h-5 w-5" />
                 </button>
              </div>
            </div>

            {item.notes && (
                <div className="mt-3 text-sm text-gray-300 bg-black/20 p-2 rounded border border-white/5">
                    {item.notes}
                </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Confidence: {item.confidence}
                </span>
                {item.kickOff && (
                     <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> KO: {item.kickOff}
                    </span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
