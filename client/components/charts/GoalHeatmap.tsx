import { useState } from "react";
import { SegmentChartData } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GoalHeatmapProps {
  data: SegmentChartData[];
}

export const GoalHeatmap = ({ data }: GoalHeatmapProps) => {
  const [isBlended, setIsBlended] = useState(false);
  const [dataSource, setDataSource] = useState<"venue" | "overall">("venue"); // New State

  // Helper to get color intensity based on value
  const getIntensityClass = (value: number) => {
    if (value === 0) return "bg-gray-800 border-gray-700";

    if (value >= 3) return "bg-green-500 border-green-400";
    if (value >= 2) return "bg-green-600 border-green-500";
    if (value >= 1) return "bg-green-700/80 border-green-600/80";
    return "bg-green-900/60 border-green-800/60";
  };

  const HeatmapSquare = ({
    segment,
    value,
    homeScore,
    awayScore,
    homeConcede,
    awayConcede,
    labelMode
  }: {
    segment: string;
    value: number;
    homeScore: number;
    awayScore: number;
    homeConcede: number;
    awayConcede: number;
    labelMode: string;
  }) => {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-sm border flex items-center justify-center text-[10px] font-mono text-white/90 transition-all hover:scale-110 hover:z-10 cursor-help ${getIntensityClass(
                value
              )}`}
            >
              {value > 0 ? value.toFixed(isBlended ? 1 : 0) : ""}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-950 border-gray-700 text-white p-3 shadow-xl z-50 rounded-md">
             <p className="font-bold mb-2 text-sm border-b border-gray-800 pb-1">
              {segment} Minute Segment ({labelMode})
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-400">Home Scored:</span>
              <span className="font-mono font-bold text-green-400 text-right">
                {homeScore}
              </span>

              <span className="text-gray-400">Away Conceded:</span>
              <span className="font-mono font-bold text-red-400 text-right">
                {awayConcede}
              </span>

              <div className="col-span-2 h-px bg-gray-800 my-1"></div>

              <span className="text-gray-400">Away Scored:</span>
              <span className="font-mono font-bold text-blue-400 text-right">
                {awayScore}
              </span>

              <span className="text-gray-400">Home Conceded:</span>
              <span className="font-mono font-bold text-red-400 text-right">
                {homeConcede}
              </span>

               <div className="col-span-2 h-px bg-gray-800 my-1"></div>

               <span className="text-gray-300 font-semibold">Blended Home Pressure:</span>
               <span className="font-mono font-bold text-yellow-400 text-right">
                 {((homeScore + awayConcede) / 2).toFixed(1)}
               </span>

               <span className="text-gray-300 font-semibold">Blended Away Pressure:</span>
               <span className="font-mono font-bold text-yellow-400 text-right">
                 {((awayScore + homeConcede) / 2).toFixed(1)}
               </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          Goal Intensity Timeline (0-90')
        </h3>

        <div className="flex gap-4">
            {/* Data Source Toggle */}
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
            <Label
                htmlFor="datasource-mode"
                className={`text-xs cursor-pointer transition-colors ${
                dataSource === "venue" ? "text-white font-bold" : "text-gray-500"
                }`}
            >
                Venue
            </Label>
            <Switch
                id="datasource-mode"
                checked={dataSource === "overall"}
                onCheckedChange={(checked) => setDataSource(checked ? "overall" : "venue")}
                className="scale-75"
            />
            <Label
                htmlFor="datasource-mode"
                className={`text-xs cursor-pointer transition-colors ${
                dataSource === "overall" ? "text-white font-bold" : "text-gray-500"
                }`}
            >
                Overall
            </Label>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
            <Label
                htmlFor="heatmap-mode"
                className={`text-xs cursor-pointer transition-colors ${
                !isBlended ? "text-white font-bold" : "text-gray-500"
                }`}
            >
                Raw
            </Label>
            <Switch
                id="heatmap-mode"
                checked={isBlended}
                onCheckedChange={setIsBlended}
                className="scale-75"
            />
            <Label
                htmlFor="heatmap-mode"
                className={`text-xs cursor-pointer transition-colors ${
                isBlended ? "text-white font-bold" : "text-gray-500"
                }`}
            >
                Blended
            </Label>
            </div>
        </div>
      </div>

      {/* Scroll container for timeline */}
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="min-w-max px-2">
           {/* Time Labels Row */}
           <div className="flex gap-1 mb-2 pl-12">
              {data.map((d) => (
                  <div key={d.segment} className="w-8 sm:w-10 text-[9px] sm:text-[10px] text-center text-gray-500 flex-shrink-0">
                      {d.segment.split('-')[0]}
                  </div>
              ))}
           </div>

           {/* Home Row */}
           <div className="flex items-center gap-2 mb-2">
              <div className="w-10 text-xs font-bold text-gray-400 text-right shrink-0">Home</div>
              <div className="flex gap-1">
                  {data.map((d) => {
                       // Determine which dataset to use
                       const homeScored = dataSource === "venue" ? d["Home Scored"] : d["Home Scored Overall"];
                       const homeConceded = dataSource === "venue" ? d["Home Conceded"] : d["Home Conceded Overall"];
                       const awayScored = dataSource === "venue" ? d["Away Scored"] : d["Away Scored Overall"];
                       const awayConceded = dataSource === "venue" ? d["Away Conceded"] : d["Away Conceded Overall"];

                       const val = isBlended
                        ? (homeScored + awayConceded) / 2
                        : homeScored;

                       return (
                           <HeatmapSquare
                             key={d.segment}
                             segment={d.segment}
                             value={val}
                             homeScore={homeScored}
                             awayScore={awayScored}
                             homeConcede={homeConceded}
                             awayConcede={awayConceded}
                             labelMode={dataSource === "venue" ? "Venue Specific" : "Overall"}
                           />
                       );
                  })}
              </div>
           </div>

           {/* Away Row */}
           <div className="flex items-center gap-2">
              <div className="w-10 text-xs font-bold text-gray-400 text-right shrink-0">Away</div>
              <div className="flex gap-1">
                  {data.map((d) => {
                        const homeScored = dataSource === "venue" ? d["Home Scored"] : d["Home Scored Overall"];
                        const homeConceded = dataSource === "venue" ? d["Home Conceded"] : d["Home Conceded Overall"];
                        const awayScored = dataSource === "venue" ? d["Away Scored"] : d["Away Scored Overall"];
                        const awayConceded = dataSource === "venue" ? d["Away Conceded"] : d["Away Conceded Overall"];

                        const val = isBlended
                        ? (awayScored + homeConceded) / 2
                        : awayScored;
                       return (
                           <HeatmapSquare
                             key={d.segment}
                             segment={d.segment}
                             value={val}
                             homeScore={homeScored}
                             awayScore={awayScored}
                             homeConcede={homeConceded}
                             awayConcede={awayConceded}
                             labelMode={dataSource === "venue" ? "Venue Specific" : "Overall"}
                           />
                       );
                  })}
              </div>
           </div>
        </div>
      </div>

       {/* Legend */}
       <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-800 border border-gray-700 rounded-sm"></div>
          <span>0 Goals</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-900/60 border border-green-800/60 rounded-sm"></div>
          <span>Low (0-1)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-700/80 border border-green-600/80 rounded-sm"></div>
          <span>Med (1-2)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 border border-green-400 rounded-sm"></div>
          <span>High (3+)</span>
        </div>
      </div>
    </div>
  );
};
