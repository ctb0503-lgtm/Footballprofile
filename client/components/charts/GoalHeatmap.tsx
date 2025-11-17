import React from 'react';
import { SegmentChartData } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  // TooltipProvider, // <-- REMOVED
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GoalHeatmapProps {
  data: SegmentChartData[];
  teamA: string;
  teamB: string;
}

// Max goals to set the peak color intensity.
const MAX_GOALS_FOR_SCALE = 5;

/**
 * Calculates the heatmap color intensity for a segment.
 * @param value - Number of goals (scored or conceded).
 * @param type - 'scored' (green) or 'conceded' (red).
 * @returns A Tailwind CSS background color class with opacity.
 */
const getIntensityColor = (value: number, type: 'scored' | 'conceded') => {
  if (value === 0) return 'bg-gray-700/20'; // Neutral for zero goals

  // Calculate intensity 0.0 to 1.0
  const intensity = Math.min(value / MAX_GOALS_FOR_SCALE, 1);

  if (type === 'scored') {
    // Green scale for goals scored
    if (intensity > 0.8) return `bg-green-400/100`;
    if (intensity > 0.6) return `bg-green-500/80`;
    if (intensity > 0.4) return `bg-green-500/60`;
    if (intensity > 0.2) return `bg-green-600/40`;
    return `bg-green-600/20`;
  } else {
    // Red scale for goals conceded
    if (intensity > 0.8) return `bg-red-400/100`;
    if (intensity > 0.6) return `bg-red-500/80`;
    if (intensity > 0.4) return `bg-red-500/60`;
    if (intensity > 0.2) return `bg-red-600/40`;
    return `bg-red-600/20`;
  }
};

/**
 * Renders one of the two timelines (e.g., Home Attack vs. Away Defence).
 */
const HeatmapTimeline = ({
  title,
  attackData,
  defenseData,
  attackLabel,
  defenseLabel,
}: {
  title: string;
  attackData: number[];
  defenseData: number[];
  attackLabel: string;
  defenseLabel: string;
}) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-white mb-3 text-center">{title}</h4>
    <div className="relative w-full pt-4 pb-6">

      {/* Attack Heatmap (Top Row) */}
      <div className="flex w-full h-6 border-b border-gray-600/50">
        {attackData.map((goals, i) => (
          // <TooltipProvider key={`attack-${i}`} delayDuration={0}> // <-- REMOVED
            <Tooltip key={`attack-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-1 border-r border-gray-700/30 last:border-r-0 transition-all cursor-pointer",
                    getIntensityColor(goals, 'scored')
                  )}
                  style={{
                    // Scale height from 20% (min) to 100% (max)
                    height: `${Math.max(20, (goals / MAX_GOALS_FOR_SCALE) * 100)}%`
                  }}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-xs font-bold">{`${i * 5 + 1}-${(i + 1) * 5} min`}</p>
                <p className="text-xs">{`${attackLabel}: ${goals}`}</p>
              </TooltipContent>
            </Tooltip>
          // </TooltipProvider> // <-- REMOVED
        ))}
      </div>

      {/* Defense Heatmap (Bottom Row) */}
      <div className="flex w-full h-6">
        {defenseData.map((goals, i) => (
          // <TooltipProvider key={`defense-${i}`} delayDuration={0}> // <-- REMOVED
            <Tooltip key={`defense-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex-1 border-r border-gray-700/30 last:border-r-0 transition-all cursor-pointer",
                    getIntensityColor(goals, 'conceded')
                  )}
                  style={{
                    // Scale height from 20% (min) to 100% (max)
                    height: `${Math.max(20, (goals / MAX_GOALS_FOR_SCALE) * 100)}%`
                  }}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white border-gray-700">
                <p className="text-xs font-bold">{`${i * 5 + 1}-${(i + 1) * 5} min`}</p>
                <p className="text-xs">{`${defenseLabel}: ${goals}`}</p>
              </TooltipContent>
            </Tooltip>
          // </TooltipProvider> // <-- REMOVED
        ))}
      </div>

      {/* Timeline Axis Labels */}
      <div className="flex w-full justify-between text-xs text-gray-400 mt-1 absolute -bottom-0 left-0 px-0.5">
        <span>0'</span>
        <span>15'</span>
        <span>30'</span>
        <span>45'</span>
        <span>60'</span>
        <span>75'</span>
        <span className="text-right">90'</span>
      </div>

      {/* Vertical Dashed Lines for 15-min intervals */}
      <div className="absolute w-full h-full top-4 left-0 flex pointer-events-none">
        <div className="w-1/3 h-full border-r border-gray-500/30 border-dashed"></div>
        <div className="w-1/3 h-full border-r border-gray-500/30 border-dashed"></div>
        <div className="w-1/3 h-full"></div>
      </div>
      {/* Horizontal Dashed Line for halftime */}
      <div className="absolute w-full h-full top-4 left-0 flex pointer-events-none">
        <div className="w-1/2 h-full border-r border-gray-500/50 border-dashed"></div>
        <div className="w-1/2 h-full"></div>
      </div>

    </div>
  </div>
);

export const GoalHeatmap = ({ data, teamA, teamB }: GoalHeatmapProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4 text-center text-gray-400">
        5-Minute Goal Segment data is required to build the heatmap.
      </div>
    );
  }

  // Extract the data arrays for easy mapping
  const homeScored = data.map((d) => d['Home Scored']);
  const homeConceded = data.map((d) => d['Home Conceded']);
  const awayScored = data.map((d) => d['Away Scored']);
  const awayConceded = data.map((d) => d['Away Conceded']);

  const homeTeamName = teamA || 'Home';
  const awayTeamName = teamB || 'Away';

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-4 space-y-10">
      <h3 className="text-lg font-semibold text-white text-center -mb-2">
        Goal Timing Heatmap (H@H / A@A)
      </h3>

      {/* First Heatmap: Home Attack vs Away Defense */}
      <HeatmapTimeline
        title={`${homeTeamName} Attack (Scored) vs. ${awayTeamName} Defence (Conceded)`}
        attackData={homeScored}
        defenseData={awayConceded}
        attackLabel={`${homeTeamName} Scored`}
        defenseLabel={`${awayTeamName} Conceded`}
      />

      {/* Second Heatmap: Away Attack vs Home Defense */}
      <HeatmapTimeline
        title={`${awayTeamName} Attack (Scored) vs. ${homeTeamName} Defence (Conceded)`}
        attackData={awayScored}
        defenseData={homeConceded}
        attackLabel={`${awayTeamName} Scored`}
        defenseLabel={`${homeTeamName} Conceded`}
      />
    </div>
  );
};
