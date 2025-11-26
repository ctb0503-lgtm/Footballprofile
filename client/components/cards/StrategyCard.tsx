import { StrategyCard as StrategyCardType } from "@/types";

interface StrategyCardProps {
  strategy: StrategyCardType;
}

export const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const { name, confidence, confidenceLabel, description } = strategy;

  let color = "text-yellow-400";
  let bgColor = "bg-yellow-400/10";
  let borderColor = "border-yellow-400/30";

  if (confidenceLabel === "High") {
    color = "text-green-400";
    bgColor = "bg-green-400/10";
    borderColor = "border-green-400/30";
  } else if (confidenceLabel === "Low") {
    color = "text-red-400";
    bgColor = "bg-red-400/10";
    borderColor = "border-red-400/30";
  }

  return (
    <div className={`bg-gray-900 p-4 rounded-lg border ${borderColor} hover:border-gray-600 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">{name}</h4>
        <div className="flex flex-col items-end">
          <span className={`text-2xl font-bold ${color}`}>{confidence}%</span>
          <span className={`text-xs font-semibold ${color} px-2 py-0.5 rounded ${bgColor}`}>
            {confidenceLabel}
          </span>
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      )}

      <div className="mt-3">
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              confidenceLabel === "High"
                ? "bg-green-400"
                : confidenceLabel === "Low"
                ? "bg-red-400"
                : "bg-yellow-400"
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};
