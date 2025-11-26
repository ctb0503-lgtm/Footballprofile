import { AnalyticalFlag } from "@/types";
import {
  GoodFlagIcon,
  BadFlagIcon,
  AlertIcon,
  ClashIcon,
} from "@/components/icons";

interface AnalyticalFlagCardProps {
  flag: AnalyticalFlag;
}

const flagConfig = {
  good: {
    icon: GoodFlagIcon,
    colorClasses: "border-green-500 text-green-300",
  },
  bad: {
    icon: BadFlagIcon,
    colorClasses: "border-red-500 text-red-300",
  },
  alert: {
    icon: AlertIcon,
    colorClasses: "border-yellow-500 text-yellow-300",
  },
  clash: {
    icon: ClashIcon,
    colorClasses: "border-purple-500 text-purple-300",
  },
};

export const AnalyticalFlagCard = ({ flag }: AnalyticalFlagCardProps) => {
  const config = flagConfig[flag.type] || flagConfig.alert;
  const Icon = config.icon;

  return (
    <div
      className={`bg-gray-800 p-4 rounded-lg border-l-4 ${config.colorClasses} shadow-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.colorClasses}`} />
        <div>
          <h4 className="text-sm font-semibold text-white">{flag.title}</h4>
          <p className="text-xs text-gray-400">{flag.desc}</p>
        </div>
      </div>
    </div>
  );
};
