import { useState, useEffect, useCallback } from "react";
import { SavedProfile, ProfileInputs } from "@/types";

const STORAGE_KEY = "football_trader_saved_profiles";

export const useLocalProfiles = () => {
  const [myProfiles, setMyProfiles] = useState<SavedProfile[]>([]);

  // Load profiles on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Sort by date descending
          parsed.sort((a: SavedProfile, b: SavedProfile) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );
          setMyProfiles(parsed);
        } catch (e) {
          console.error("Failed to parse local profiles", e);
        }
      }
    }
  }, []);

  const saveProfile = useCallback(
    async (
      teamA: string,
      teamB: string,
      profileText: string,
      sources: any[],
      inputs: ProfileInputs
    ) => {
      const newProfile: SavedProfile = {
        id: crypto.randomUUID(), // Use built-in UUID generator
        teamA,
        teamB,
        profileText,
        sources,
        // Mimic Firebase timestamp structure for compatibility
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        inputs,
      };

      setMyProfiles((prev) => {
        const updated = [newProfile, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteProfile = useCallback(async (id: string) => {
    setMyProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    myProfiles,
    saveProfile,
    deleteProfile,
  };
};
