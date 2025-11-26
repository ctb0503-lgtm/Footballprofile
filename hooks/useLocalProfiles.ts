import { useState, useEffect, useCallback } from "react";
import { ProfileInputs, SavedProfile, GroundingAttribution, TradingAngle } from "@/types";

export const useLocalProfiles = () => {
  const [myProfiles, setMyProfiles] = useState<SavedProfile[]>([]);

  // Load profiles from local storage on mount
  useEffect(() => {
    const loadProfiles = () => {
        try {
            const stored = localStorage.getItem("football-trader-profiles");
            if (stored) {
                setMyProfiles(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load local profiles", e);
        }
    };
    loadProfiles();
  }, []);

  const saveProfile = useCallback(
    async (
      teamA: string,
      teamB: string,
      profileText: string,
      sources: GroundingAttribution[],
      inputs: ProfileInputs,
      tradingAngles: TradingAngle[] = [] // NEW: Accept trading angles
    ) => {
      const newProfile: SavedProfile = {
        id: crypto.randomUUID(),
        teamA,
        teamB,
        profileText,
        sources,
        createdAt: { seconds: Date.now() / 1000 }, // Mimic Firebase timestamp
        inputs,
        tradingAngles, // Store them
      };

      setMyProfiles((prev) => {
        const updated = [newProfile, ...prev];
        localStorage.setItem("football-trader-profiles", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  const deleteProfile = useCallback((id: string) => {
    setMyProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem("football-trader-profiles", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    myProfiles,
    saveProfile,
    deleteProfile,
  };
};
