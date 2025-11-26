import { useState, useEffect, useCallback } from "react";

export interface TradePlanItem {
  id: string;
  match: string;
  kickOff?: string;
  strategy: string;
  confidence: string;
  notes: string;
  status: "pending" | "active" | "won" | "lost" | "void" | "skipped";
}

const STORAGE_KEY = "football-trader-daily-plan";

// Safe ID generator fallback to prevent crashes in non-secure contexts
const generateSafeId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useDailyPlan = () => {
  const [plan, setPlan] = useState<TradePlanItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPlan(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse daily plan", e);
      }
    }
  }, []);

  // Save to local storage whenever plan changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const addToPlan = useCallback((item: Omit<TradePlanItem, "id" | "status">) => {
    const newItem: TradePlanItem = {
      ...item,
      id: generateSafeId(), // Use safe generator
      status: "pending",
    };
    setPlan((prev) => [...prev, newItem]);
  }, []);

  const removeFromPlan = useCallback((id: string) => {
    setPlan((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: TradePlanItem["status"]) => {
    setPlan((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const clearPlan = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your entire trading journal?")) {
      setPlan([]);
    }
  }, []);

  return {
    plan,
    addToPlan,
    removeFromPlan,
    updateStatus,
    clearPlan,
  };
};
