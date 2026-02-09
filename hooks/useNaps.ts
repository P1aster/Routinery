import { differenceInMinutes, endOfDay, startOfDay, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { addNapEntry, getNapEntriesByRange, initializeDatabase } from "../lib/database";
import type { NapEntry } from "../lib/types";

function toIso(date: Date): string {
  return date.toISOString();
}

export function useNaps() {
  const [recentEntries, setRecentEntries] = useState<NapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    await initializeDatabase();
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const entries = await getNapEntriesByRange(toIso(start), toIso(end));
    setRecentEntries(entries.slice(0, 2));
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const addEntry = useCallback(async (startTime: Date, endTime: Date, quality: number) => {
    const duration = Math.max(0, differenceInMinutes(endTime, startTime));
    const entry = await addNapEntry({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      quality
    });

    setRecentEntries((prev) => [entry, ...prev].slice(0, 2));
    return entry;
  }, []);

  const getEntriesForRange = useCallback(async (days: number) => {
    const now = new Date();
    const start = startOfDay(subDays(now, days - 1));
    const end = endOfDay(now);
    return getNapEntriesByRange(toIso(start), toIso(end));
  }, []);

  return {
    recentEntries,
    loading,
    refreshDashboard,
    addEntry,
    getEntriesForRange
  };
}
