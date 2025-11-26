import { SegmentChartData, VenueFlagsData, HalfDataStats } from "@/types";
import { Timer, TrendingUp, AlertTriangle } from "lucide-react";

interface FastStartCardProps {
  homeTeam: string;
  awayTeam: string;
  fiveMinData: SegmentChartData[];
  venueData?: VenueFlagsData;
  halfData?: HalfDataStats;
}

export const FastStartCard = ({
  homeTeam,
  awayTeam,
  fiveMinData,
  venueData,
  halfData
}: FastStartCardProps) => {
  // Calculate 1-15 min stats
  const earlySegments = ["1-5", "6-10", "11-15"];

  let homeScored15 = 0;
  let awayConceded15 = 0;
  let awayScored15 = 0;
  let homeConceded15 = 0;

  earlySegments.forEach(seg => {
    const data = fiveMinData.find(d => d.segment.startsWith(seg));
    if (data) {
      homeScored15 += data["Home Scored"];
      awayConceded15 += data["Away Conceded"];
      awayScored15 += data["Away Scored"];
      homeConceded15 += data["Home Conceded"];
    }
  });

  const homeAttackStrength = homeScored15 + awayConceded15;
  const awayAttackStrength = awayScored15 + homeConceded15;

  // Determine Fast Start Status
  let status = "Neutral Start";
  let color = "text-gray-400";
  let bgColor = "bg-gray-900/50";
  let borderColor = "border-gray-700";
  let details = "No significant early goal trends detected based on 0-15min segments.";

  // Thresholds
  const HIGH_THRESHOLD = 3; // Combined goals in 15 mins (High signal)
  const MEDIUM_THRESHOLD = 2; // Moderate signal

  const homeFTS = venueData?.homeFTS || 0;
  const awayFTS = venueData?.awayFTS || 0;

  if (homeAttackStrength >= HIGH_THRESHOLD) {
      status = `${homeTeam} Fast Start Alert`;
      color = "text-green-400";
      bgColor = "bg-green-900/20";
      borderColor = "border-green-500/30";
      details = `High probability: ${homeTeam} has scored/opponent conceded ${homeAttackStrength} goals in the first 15 mins.`;
  } else if (awayAttackStrength >= HIGH_THRESHOLD) {
      status = `${awayTeam} Fast Start Alert`;
      color = "text-blue-400";
      bgColor = "bg-blue-900/20";
      borderColor = "border-blue-500/30";
      details = `High probability: ${awayTeam} has scored/opponent conceded ${awayAttackStrength} goals in the first 15 mins.`;
  } else if (homeAttackStrength >= MEDIUM_THRESHOLD && homeFTS > 60) {
      status = `Potential ${homeTeam} Early Goal`;
      color = "text-green-300";
      bgColor = "bg-green-900/10";
      borderColor = "border-green-500/20";
      details = `Moderate segment trend (${homeAttackStrength} goals) supported by high First-To-Score rate (${homeFTS}%).`;
  } else if (awayAttackStrength >= MEDIUM_THRESHOLD && awayFTS > 60) {
      status = `Potential ${awayTeam} Early Goal`;
      color = "text-blue-300";
      bgColor = "bg-blue-900/10";
      borderColor = "border-blue-500/20";
      details = `Moderate segment trend (${awayAttackStrength} goals) supported by high First-To-Score rate (${awayFTS}%).`;
  }

  // Early Goal Percentages (1.5+ in 1H)
  const home1HOver = halfData?.homeScored1stHalfOvers || 0;
  const away1HOver = halfData?.awayScored1stHalfOvers || 0;

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor} space-y-3`}>
      <div className="flex justify-between items-start">
        <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${color}`}>
                <Timer className="h-4 w-4" /> {status}
            </h3>
            <p className="text-gray-300 text-xs mt-1">{details}</p>
        </div>
        {(homeAttackStrength >= MEDIUM_THRESHOLD || awayAttackStrength >= MEDIUM_THRESHOLD) && (
            <TrendingUp className={`h-5 w-5 ${color}`} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
        <div>
            <p className="text-gray-500 font-semibold mb-1">{homeTeam} (0-15')</p>
            <div className="flex justify-between">
                <span className="text-gray-300">Scored:</span>
                <span className="font-mono text-white">{homeScored15}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-300">Conceded:</span>
                <span className="font-mono text-white">{homeConceded15}</span>
            </div>
             <div className="flex justify-between mt-1">
                <span className="text-gray-300">FTS %:</span>
                <span className={`font-mono ${homeFTS > 60 ? 'text-green-400' : 'text-white'}`}>{homeFTS}%</span>
            </div>
        </div>
        <div>
            <p className="text-gray-500 font-semibold mb-1">{awayTeam} (0-15')</p>
            <div className="flex justify-between">
                <span className="text-gray-300">Scored:</span>
                <span className="font-mono text-white">{awayScored15}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-300">Conceded:</span>
                <span className="font-mono text-white">{awayConceded15}</span>
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-gray-300">FTS %:</span>
                <span className={`font-mono ${awayFTS > 60 ? 'text-green-400' : 'text-white'}`}>{awayFTS}%</span>
            </div>
        </div>
      </div>

      {/* 1H Overs Context */}
      <div className="text-[10px] text-gray-400 pt-2 flex justify-between items-center border-t border-white/5 mt-2">
         <span>1H Over 1.5 Goals % (Season):</span>
         <span className="text-gray-300 font-mono">H: {home1HOver}% | A: {away1HOver}%</span>
      </div>
    </div>
  );
};
