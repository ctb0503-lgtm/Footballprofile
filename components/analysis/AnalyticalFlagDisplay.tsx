import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { AnalyticalFlag } from "@/types";
import { AnalyticalFlagCard } from "@/components/cards/AnalyticalFlagCard";

// --- Thresholds for flags (can be adjusted) ---
const FTS_THRESHOLD = 55; // % First to Score/Concede
const BIAS_THRESHOLD = 0.4; // PPG Bias
const HVA_THRESHOLD = -0.15; // Home vs Away Index
const LATE_GOAL_THRESHOLD = 5; // 5 goals in last 15 mins
const RESILIENCE_THRESHOLD = 30; // 30% comeback/dropped points
const HALF_SKEW_THRESHOLD = 60; // 60% of goals in 2nd half

// --- NEW THRESHOLDS ---
// Based on your data, 16/18 are high and 9/11 are low. Let's set the threshold around 13.
const INDEX_THRESHOLD = 13.0;
const CLEAN_SHEET_THRESHOLD = 40;
const SCORING_RATE_THRESHOLD = 35;
const FHG_THRESHOLD = 60;
const GOAL_EDGE_THRESHOLD = 2.5;
// ------------------------

export const AnalyticalFlagDisplay = () => {
  const { analyticalFlagData } = useProfile();

  const flags = useMemo((): AnalyticalFlag[] => {
    if (!analyticalFlagData) {
      return [];
    }

    const { ppg, venue, index, fiveMin, resilience, half } = analyticalFlagData;
    const newFlags: AnalyticalFlag[] = [];

    // 1. User's Requested Flag: First To Score (FTS) vs First To Concede (FTC)
    if (venue.homeFTS > FTS_THRESHOLD && venue.awayFTC > FTS_THRESHOLD) {
      newFlags.push({
        id: "fts-htc",
        type: "good",
        title: "Home Fast Start",
        desc: `Home scores first (${venue.homeFTS}%) vs. Away concedes first (${venue.awayFTC}%) at venue.`,
      });
    }
    if (venue.awayFTS > FTS_THRESHOLD && venue.homeFTC > FTS_THRESHOLD) {
      newFlags.push({
        id: "fts-atc",
        type: "good",
        title: "Away Fast Start",
        desc: `Away scores first (${venue.awayFTS}%) vs. Home concedes first (${venue.homeFTC}%) at venue.`,
      });
    }

    // 2. PPG Bias Flags
    if (ppg.homeBias > BIAS_THRESHOLD) {
      newFlags.push({
        id: "ppg-bias-home",
        type: "good",
        title: "Home Form",
        desc: `Home team PPG Bias is high (+${ppg.homeBias.toFixed(
          2,
        )}), indicating strong recent form vs. schedule.`,
      });
    }
    if (ppg.awayBias < -BIAS_THRESHOLD) {
      newFlags.push({
        id: "ppg-bias-away",
        type: "bad",
        title: "Away Form",
        desc: `Away team PPG Bias is low (${ppg.awayBias.toFixed(
          2,
        )}), indicating poor recent form vs. schedule.`,
      });
    }

    // 3. H v A Index Flags
    if (index.hva < HVA_THRESHOLD) {
      newFlags.push({
        id: "hva-home",
        type: "good",
        title: "Home Index Advantage",
        desc: `H v A Index (${index.hva.toFixed(
          2,
        )}) strongly favors the Home team.`,
      });
    }
    if (index.hva > -HVA_THRESHOLD) {
      newFlags.push({
        id: "hva-away",
        type: "good",
        title: "Away Index Advantage",
        desc: `H v A Index (${index.hva.toFixed(
          2,
        )}) favors the Away team.`,
      });
    }

    // 4. Late Goal Flags (76-90 min)
    if (
      fiveMin.homeScoredLate > LATE_GOAL_THRESHOLD &&
      fiveMin.awayConcededLate > LATE_GOAL_THRESHOLD
    ) {
      newFlags.push({
        id: "late-home-goal",
        type: "alert",
        title: "Late Home Goal Threat",
        desc: `Home scores late (${fiveMin.homeScoredLate} goals) vs. Away concedes late (${fiveMin.awayConcededLate} goals).`,
      });
    }
    if (
      fiveMin.awayScoredLate > LATE_GOAL_THRESHOLD &&
      fiveMin.homeConcededLate > LATE_GOAL_THRESHOLD
    ) {
      newFlags.push({
        id: "late-away-goal",
        type: "alert",
        title: "Late Away Goal Threat",
        desc: `Away scores late (${fiveMin.awayScoredLate} goals) vs. Home concedes late (${fiveMin.homeConcededLate} goals).`,
      });
    }

    // 5. Resilience Flags
    if (resilience.homeComeback > RESILIENCE_THRESHOLD) {
      newFlags.push({
        id: "res-home",
        type: "alert",
        title: "Home Resilience",
        desc: `Home team comes back from losing at HT in ${resilience.homeComeback.toFixed(
          0,
        )}% of games.`,
      });
    }
    if (resilience.awayDropped > RESILIENCE_THRESHOLD) {
      newFlags.push({
        id: "res-away-drop",
        type: "bad",
        title: "Away Drops Points",
        desc: `Away team drops points from winning at HT in ${resilience.awayDropped.toFixed(
          0,
        )}% of games.`,
      });
    }

    // 6. Half Skew Flags
    if (
      half.homeScoredHalf2Pct > HALF_SKEW_THRESHOLD &&
      half.awayConcededHalf2Pct > HALF_SKEW_THRESHOLD
    ) {
      newFlags.push({
        id: "half-skew",
        type: "alert",
        title: "2nd Half Action",
        desc: `Home scores ${half.homeScoredHalf2Pct.toFixed(
          0,
        )}% of their goals in 2H, while Away concedes ${half.awayConcededHalf2Pct.toFixed(
          0,
        )}% in 2H.`,
      });
    }

    // --- NEW FLAGS (LOGIC CORRECTED) ---

    // 7. Offensive/Defensive Mismatch (Index)
    // "higher is better" for both. Mismatch = Good Atk (High) vs Bad Def (Low)
    if (
      index.homeOffence < INDEX_THRESHOLD &&
      index.awayDefence > INDEX_THRESHOLD
    ) {
      newFlags.push({
        id: "mismatch-home-atk",
        type: "good",
        title: "Home Offensive Mismatch",
        desc: `Home's high Offence Index (${index.homeOffence.toFixed(
          2,
        )}) meets Away's weak Defence Index (${index.awayDefence.toFixed(2)}).`,
      });
    }
    // Struggle = Bad Atk (Low) vs Good Def (High)
    if (
      index.homeOffence > INDEX_THRESHOLD &&
      index.awayDefence < INDEX_THRESHOLD
    ) {
      newFlags.push({
        id: "mismatch-home-struggle",
        type: "bad",
        title: "Home Offensive Struggle",
        desc: `Home's low Offence Index (${index.homeOffence.toFixed(
          2,
        )}) faces Away's strong Defence Index (${index.awayDefence.toFixed(2)}).`,
      });
    }
    // Mismatch = Good Atk (High) vs Bad Def (Low)
    if (
      index.awayOffence < INDEX_THRESHOLD &&
      index.homeDefence > INDEX_THRESHOLD
    ) {
      newFlags.push({
        id: "mismatch-away-atk",
        type: "good",
        title: "Away Offensive Mismatch",
        desc: `Away's high Offence Index (${index.awayOffence.toFixed(
          2,
        )}) meets Home's weak Defence Index (${index.homeDefence.toFixed(2)}).`,
      });
    }

    // 8. Clean Sheet vs. Scoring Rate (Venue Stats)
    if (
      venue.homeCleanSheet > CLEAN_SHEET_THRESHOLD &&
      venue.awayScoringRate < SCORING_RATE_THRESHOLD
    ) {
      newFlags.push({
        id: "cs-home",
        type: "good",
        title: "Home Defensive Solidity",
        desc: `Home has a high Clean Sheet rate (${venue.homeCleanSheet}%) while Away scores in only ${venue.awayScoringRate}% of its games.`,
      });
    }
    if (
      venue.awayCleanSheet > CLEAN_SHEET_THRESHOLD &&
      venue.homeScoringRate < SCORING_RATE_THRESHOLD
    ) {
      newFlags.push({
        id: "cs-away",
        type: "good",
        title: "Away Defensive Solidity",
        desc: `Away has a high Clean Sheet rate (${venue.awayCleanSheet}%) while Home scores in only ${venue.homeScoringRate}% of its games.`,
      });
    }

    // 9. First Half Goal (FHG) Propensity (Venue Stats)
    if (venue.homeFHG > FHG_THRESHOLD && venue.awayFHG > FHG_THRESHOLD) {
      newFlags.push({
        id: "fhg-action",
        type: "alert",
        title: "High FHG Action",
        desc: `Both teams see a First Half Goal in a high percentage of their games (Home: ${venue.homeFHG}%, Away: ${venue.awayFHG}%).`,
      });
    }

    // 10. "Goal Edge" Alert (Index)
    if (Math.abs(index.goalEdge) < GOAL_EDGE_THRESHOLD) {
      newFlags.push({
        id: "goal-edge",
        type: "alert",
        title: "Goal Edge Alert",
        desc: `The "Goal Edge" index is ${index.goalEdge.toFixed(
          2,
        )}, which is very close to zero, suggesting a high potential for goals.`,
      });
    }

    // 11. Resilience Clash (Resilience Stats)
    if (
      resilience.homeComeback > RESILIENCE_THRESHOLD &&
      resilience.awayComeback > RESILIENCE_THRESHOLD
    ) {
      newFlags.push({
        id: "res-clash-comeback",
        type: "clash",
        title: "Resilient Teams Clash",
        desc: `Both teams show high resilience, coming back from losing at HT in over ${RESILIENCE_THRESHOLD}% of games.`,
      });
    }
    if (
      resilience.homeDropped > RESILIENCE_THRESHOLD &&
      resilience.awayDropped > RESILIENCE_THRESHOLD
    ) {
      newFlags.push({
        id: "res-clash-brittle",
        type: "clash",
        title: "Brittle Leads",
        desc: `Both teams are prone to dropping points from winning HT positions in over ${RESILIENCE_THRESHOLD}% of games.`,
      });
    }

    // --- END OF NEW FLAGS ---

    return newFlags;
  }, [analyticalFlagData]);

  if (flags.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm p-4 bg-gray-800 rounded-lg">
        No significant analytical flags triggered based on the provided data.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flags.map((flag) => (
        <AnalyticalFlagCard key={flag.id} flag={flag} />
      ))}
    </div>
  );
};
