import { endOfDay, startOfDay, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import {
  addHydrationEntry,
  getHydrationEntriesByRange,
  getHydrationTotalByRange,
  initializeDatabase
} from "../lib/database";
import { usePreferencesContext } from "./preferences-context";
import type { HydrationEntry, HydrationType } from "../lib/types";

function toIso(date: Date): string {
  return date.toISOString();
}

export function useHydration() {
  const { preferences } = usePreferencesContext();
  const [todayTotal, setTodayTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [recentEntries, setRecentEntries] = useState<HydrationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    await initializeDatabase();
    setGoal(preferences.hydrationGoalMl);

    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const [total, entries] = await Promise.all([
      getHydrationTotalByRange(toIso(start), toIso(end)),
      getHydrationEntriesByRange(toIso(start), toIso(end))
    ]);

    setTodayTotal(total);
    setRecentEntries(entries.slice(0, 3));
    setLoading(false);
  }, [preferences.hydrationGoalMl]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const addEntry = useCallback(
    async (amount: number, type: HydrationType = "water") => {
      const entry = await addHydrationEntry({
        amount,
        timestamp: new Date().toISOString(),
        type
      });

      setTodayTotal((prev) => prev + amount);
      setRecentEntries((prev) => [entry, ...prev].slice(0, 3));
      return entry;
    },
    []
  );

  const getEntriesForRange = useCallback(async (days: number) => {
    const now = new Date();
    const start = startOfDay(subDays(now, days - 1));
    const end = endOfDay(now);
    return getHydrationEntriesByRange(toIso(start), toIso(end));
  }, []);

  const getTotalForRange = useCallback(async (days: number) => {
    const now = new Date();
    const start = startOfDay(subDays(now, days - 1));
    const end = endOfDay(now);
    return getHydrationTotalByRange(toIso(start), toIso(end));
  }, []);

  return {
    todayTotal,
    goal,
    progress: goal > 0 ? Math.min(todayTotal / goal, 1) : 0,
    recentEntries,
    loading,
    refreshDashboard,
    addEntry,
    getEntriesForRange,
    getTotalForRange
  };
}
