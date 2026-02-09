import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import Card from "../components/ui/Card";
import SafeAreaView from "../components/ui/SafeAreaView";
import { useHydration } from "../hooks/useHydration";
import { usePreferencesContext } from "../hooks/preferences-context";
import { useSleep } from "../hooks/useSleep";
import { formatDailyHydration } from "../lib/units";

export default function WeeklyScreen() {
  const hydration = useHydration();
  const sleep = useSleep();
  const { preferences } = usePreferencesContext();

  const [hydrationTotal, setHydrationTotal] = useState(0);
  const [sleepAverage, setSleepAverage] = useState(0);
  const { getTotalForRange } = hydration;
  const { getAveragesForRange } = sleep;

  useEffect(() => {
    const load = async () => {
      const [hydrationWeek, sleepWeek] = await Promise.all([
        getTotalForRange(7),
        getAveragesForRange(7)
      ]);
      setHydrationTotal(hydrationWeek);
      setSleepAverage(sleepWeek.averageDuration);
    };

    load();
  }, [getAveragesForRange, getTotalForRange]);

  const hydrationAverage = Math.round(hydrationTotal / 7);
  const sleepHours = Math.floor(sleepAverage / 60);
  const sleepMinutes = Math.round(sleepAverage % 60);
  const hydrationProgress = Math.min(hydrationAverage / hydration.goal, 1) * 100;
  const sleepProgress = Math.min(sleepAverage / (8 * 60), 1) * 100;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f1ea] dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6 gap-6">
        <View className="flex-row items-center justify-between">
          <Link href="/" asChild>
            <Text className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Back
            </Text>
          </Link>
          <Link href="/monthly" asChild>
            <Text className="text-sm font-semibold text-sleep-700 dark:text-sleep-200">Monthly</Text>
          </Link>
        </View>

        <View className="gap-2">
          <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Week scan
          </Text>
          <Text className="text-3xl font-semibold text-slate-900 dark:text-white">Weekly overview</Text>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Hydration trend</Text>
            <Text className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-200">
              {formatDailyHydration(hydrationAverage, preferences.units)}
            </Text>
          </View>
          <View className="h-40 rounded-2xl bg-brand-100/70 p-4 dark:bg-brand-900/40">
            <View className="flex-1 justify-end">
              <View className="h-2 w-full rounded-full bg-brand-300/60">
                <View className="h-2 rounded-full bg-brand-600" style={{ width: `${hydrationProgress}%` }} />
              </View>
            </View>
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Sleep trend</Text>
            <Text className="text-xs uppercase tracking-wide text-sleep-700 dark:text-sleep-200">
              {sleepHours}h {sleepMinutes.toString().padStart(2, "0")}m avg
            </Text>
          </View>
          <View className="h-40 rounded-2xl bg-sleep-100/70 p-4 dark:bg-sleep-900/40">
            <View className="flex-1 justify-end">
              <View className="h-2 w-full rounded-full bg-sleep-300/60">
                <View className="h-2 rounded-full bg-sleep-600" style={{ width: `${sleepProgress}%` }} />
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
