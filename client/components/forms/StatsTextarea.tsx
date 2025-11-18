import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  tooltip?: string; // New prop for instructions
}

export const StatsTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  tooltip,
}: StatsTextareaProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {tooltip && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 border-gray-700 text-gray-200 max-w-xs z-50">
                <p className="text-xs leading-relaxed">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="bg-gray-800 border-gray-700 text-white focus:ring-green-500 min-h-[100px]"
      />
    </div>
  );
};
