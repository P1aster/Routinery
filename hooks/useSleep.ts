import { differenceInMinutes, endOfDay, startOfDay, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import {
  addSleepEntry,
  getSleepAverageByRange,
  getSleepEntriesByRange,
  getSleepEntriesByWakeRange,
  initializeDatabase
} from "../lib/database";
import type { SleepEntry } from "../lib/types";

function toIso(date: Date): string {
  return date.toISOString();
}

export function useSleep() {
  const [recentEntries, setRecentEntries] = useState<SleepEntry[]>([]);
  const [averageDuration, setAverageDuration] = useState(0);
  const [averageQuality, setAverageQuality] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mainSleepLoggedToday, setMainSleepLoggedToday] = useState(false);

  const refreshDashboard = useCallback(async () => {
    await initializeDatabase();
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const [wakeEntries, averages] = await Promise.all([
      getSleepEntriesByWakeRange(toIso(start), toIso(end)),
      getSleepAverageByRange(toIso(start), toIso(end))
    ]);

    const durationSum = wakeEntries.reduce((total, entry) => total + entry.duration, 0);
    const qualitySum = wakeEntries.reduce((total, entry) => total + entry.quality, 0);
    const count = wakeEntries.length;

    setRecentEntries(wakeEntries.slice(0, 2));
    setAverageDuration(count > 0 ? durationSum / count : averages.averageDuration);
    setAverageQuality(count > 0 ? qualitySum / count : averages.averageQuality);
    setMainSleepLoggedToday(wakeEntries.length > 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const addEntry = useCallback(async (bedtime: Date, wakeTime: Date, quality: number) => {
    const duration = Math.max(0, differenceInMinutes(wakeTime, bedtime));
    const entry = await addSleepEntry({
      bedtime: bedtime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      duration,
      quality
    });

    setRecentEntries((prev) => [entry, ...prev].slice(0, 2));
    setMainSleepLoggedToday(true);
    return entry;
  }, []);

  const getEntriesForRange = useCallback(async (days: number) => {
    const now = new Date();
    const start = startOfDay(subDays(now, days - 1));
    const end = endOfDay(now);
    return getSleepEntriesByRange(toIso(start), toIso(end));
  }, []);

  const getAveragesForRange = useCallback(async (days: number) => {
    const now = new Date();
    const start = startOfDay(subDays(now, days - 1));
    const end = endOfDay(now);
    return getSleepAverageByRange(toIso(start), toIso(end));
  }, []);

  return {
    recentEntries,
    averageDuration,
    averageQuality,
    loading,
    mainSleepLoggedToday,
    refreshDashboard,
    addEntry,
    getEntriesForRange,
    getAveragesForRange
  };
}
