import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import Card from "../../components/ui/Card";
import SafeAreaView from "../../components/ui/SafeAreaView";
import { useHydration } from "../../hooks/useHydration";
import { useNaps } from "../../hooks/useNaps";
import { usePreferencesContext } from "../../hooks/preferences-context";
import { useSleep } from "../../hooks/useSleep";
import { getHydrationLabel } from "../../lib/hydration";
import { formatDailyHydration } from "../../lib/units";
import type { HydrationEntry, NapEntry, SleepEntry, Units } from "../../lib/types";

type HistoryEntry = {
  id: string;
  category: "hydration" | "sleep" | "nap";
  title: string;
  timestamp: Date;
  status: string;
};

export default function HistoryScreen() {
  const hydration = useHydration();
  const sleep = useSleep();
  const naps = useNaps();
  const { preferences } = usePreferencesContext();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryEntry["category"] | "both">("both");
  const [weeklyHydration, setWeeklyHydration] = useState(0);
  const [weeklySleepQuality, setWeeklySleepQuality] = useState(0);
  const { getEntriesForRange: getHydrationEntries, getTotalForRange: getHydrationTotal } =
    hydration;
  const { getEntriesForRange: getSleepEntries, getAveragesForRange: getSleepAverages } = sleep;
  const { getEntriesForRange: getNapEntries } = naps;

  useEffect(() => {
    const load = async () => {
      const [hydrationEntries, sleepEntries, napEntries, weeklyHydrationTotal, weeklySleepAverage] =
        await Promise.all([
          getHydrationEntries(2),
          getSleepEntries(2),
          getNapEntries(2),
          getHydrationTotal(7),
          getSleepAverages(7)
        ]);

      const merged = mergeHistoryEntries(
        hydrationEntries,
        sleepEntries,
        napEntries,
        preferences.units
      );
      setEntries(merged);
      setWeeklyHydration(weeklyHydrationTotal);
      setWeeklySleepQuality(weeklySleepAverage.averageQuality);
    };

    load();
  }, [
    getHydrationEntries,
    getHydrationTotal,
    getSleepAverages,
    getSleepEntries,
    getNapEntries,
    preferences.units
  ]);

  const summary = useMemo(() => {
    const hydrationLabel = formatDailyHydration(weeklyHydration / 7, preferences.units);
    const sleepLabel = `${weeklySleepQuality.toFixed(1)} quality avg`;
    return { hydrationLabel, sleepLabel };
  }, [preferences.units, weeklyHydration, weeklySleepQuality]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === "both") {
      return entries;
    }
    if (activeFilter === "sleep") {
      return entries.filter((entry) => entry.category === "sleep" || entry.category === "nap");
    }
    return entries.filter((entry) => entry.category === activeFilter);
  }, [activeFilter, entries]);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f1ea] dark:bg-slate-950">
      <View className="absolute -top-16 right-[-48px] h-40 w-40 rounded-full bg-brand-100/70 dark:bg-brand-900/40" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6 gap-6">
        <View className="gap-3">
          <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Chronicle
          </Text>
          <Text className="text-3xl font-semibold text-slate-900 dark:text-white">History vault</Text>
          <Text className="text-base text-slate-600 dark:text-slate-300">
            Scan patterns across hydration and sleep sessions.
          </Text>
        </View>

        <Card className="gap-4">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">Weekly summary</Text>
          <View className="gap-4">
            <View>
              <Text className="text-sm text-slate-500 dark:text-slate-400">Hydration adherence</Text>
              <Text className="text-2xl font-semibold text-brand-700 dark:text-brand-200">
                {summary.hydrationLabel}
              </Text>
            </View>
            <View>
              <Text className="text-sm text-slate-500 dark:text-slate-400">Sleep consistency</Text>
              <Text className="text-2xl font-semibold text-sleep-700 dark:text-sleep-200">
                {summary.sleepLabel}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="gap-4">
          <Text className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Filters
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setActiveFilter("hydration")}
              className={[
                "flex-1 items-center justify-center rounded-full px-4 py-2",
                activeFilter === "hydration"
                  ? "bg-brand-200/80"
                  : "bg-brand-100/40 dark:bg-brand-900/30"
              ].join(" ")}
            >
              <Text
                className={[
                  "text-center text-xs font-semibold uppercase tracking-wide",
                  activeFilter === "hydration"
                    ? "text-brand-800"
                    : "text-brand-700 dark:text-brand-200"
                ].join(" ")}
              >
                Hydration
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("sleep")}
              className={[
                "flex-1 items-center justify-center rounded-full px-4 py-2",
                activeFilter === "sleep"
                  ? "bg-sleep-200/80"
                  : "bg-sleep-100/40 dark:bg-sleep-900/30"
              ].join(" ")}
            >
              <Text
                className={[
                  "text-center text-xs font-semibold uppercase tracking-wide",
                  activeFilter === "sleep"
                    ? "text-sleep-800"
                    : "text-sleep-700 dark:text-sleep-200"
                ].join(" ")}
              >
                Sleep
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter("both")}
              className={[
                "flex-1 items-center justify-center rounded-full px-4 py-2",
                activeFilter === "both"
                  ? "bg-slate-200/80"
                  : "bg-slate-100/70 dark:bg-slate-900/70"
              ].join(" ")}
            >
              <Text
                className={[
                  "text-center text-xs font-semibold uppercase tracking-wide",
                  activeFilter === "both"
                    ? "text-slate-800"
                    : "text-slate-600 dark:text-slate-200"
                ].join(" ")}
              >
                Both
              </Text>
            </Pressable>
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">Recent entries</Text>
            <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Last 48 hours
            </Text>
          </View>
          <View className="gap-4">
            {filteredEntries.length === 0 ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {entries.length === 0
                  ? "Log hydration or sleep to populate your timeline."
                  : "No entries for this filter yet."}
              </Text>
            ) : (
              filteredEntries.map((entry) => (
                <View key={entry.id} className="flex-row items-center gap-3">
                  <View
                    className={[
                      "h-3 w-3 rounded-full",
                      entry.category === "hydration"
                        ? "bg-brand-500"
                        : entry.category === "nap"
                          ? "bg-amber-400"
                          : "bg-sleep-400"
                    ].join(" ")}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      {entry.title}
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {format(entry.timestamp, "EEE, MMM d")}
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {format(entry.timestamp, "p")}
                    </Text>
                  </View>
                  <Text
                    className={[
                      "text-xs uppercase tracking-wide",
                      entry.category === "hydration"
                        ? "text-brand-700 dark:text-brand-200"
                        : entry.category === "nap"
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-sleep-700 dark:text-sleep-200"
                    ].join(" ")}
                  >
                    {entry.status}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

function mergeHistoryEntries(
  hydrationEntries: HydrationEntry[],
  sleepEntries: SleepEntry[],
  napEntries: NapEntry[],
  units: Units
): HistoryEntry[] {
  const hydration = hydrationEntries.map((entry): HistoryEntry => ({
    id: `hydration-${entry.id}`,
    category: "hydration",
    title: getHydrationLabel(entry.amount, units),
    timestamp: new Date(entry.timestamp),
    status: "logged"
  }));

  const sleep = sleepEntries.map((entry): HistoryEntry => ({
    id: `sleep-${entry.id}`,
    category: "sleep",
    title: `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m sleep`,
    timestamp: new Date(entry.wakeTime),
    status: entry.quality >= 4 ? "strong" : "steady"
  }));

  const naps = napEntries.map((entry): HistoryEntry => ({
    id: `nap-${entry.id}`,
    category: "nap",
    title: `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m nap`,
    timestamp: new Date(entry.endTime),
    status: entry.quality >= 4 ? "rested" : "light"
  }));

  return [...hydration, ...sleep, ...naps].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}
