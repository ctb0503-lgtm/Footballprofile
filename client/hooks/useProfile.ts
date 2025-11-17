import { useState, useCallback, useEffect } from "react";
import {
  Profile,
  ProfileInputs,
  PPGChartData,
  SegmentChartData,
} from "@/types";
import {
  parsePpgBlock,
  parseIndexBlock,
  parseNewFiveMinSegmentData,
  parseHalfDataBlock,
  parseLeagueTable,
} from "@/services/parsingService";

export const useProfile = () => {
  // API Key management (NEW)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Also set on window for backwards compatibility
    (window as any).__gemini_api_key = key;
  }, []);

  // Load API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      (window as any).__gemini_api_key = savedKey;
    }
  }, []);

  // Team names
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  // ... rest of existing code ...

  return {
    // ... existing returns ...
    
    // API Key management (NEW)
    apiKey,
    saveApiKey,

    // ... rest of existing returns ...
  };
};
