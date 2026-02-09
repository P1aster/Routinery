import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import Card from "../components/ui/Card";
import SafeAreaView from "../components/ui/SafeAreaView";
import { useHydration } from "../hooks/useHydration";
import { usePreferencesContext } from "../hooks/preferences-context";
import { useSleep } from "../hooks/useSleep";
import { formatDailyHydration } from "../lib/units";

export default function MonthlyScreen() {
  const hydration = useHydration();
  const sleep = useSleep();
  const { preferences } = usePreferencesContext();

  const [hydrationTotal, setHydrationTotal] = useState(0);
  const [sleepAverage, setSleepAverage] = useState(0);
  const { getTotalForRange } = hydration;
  const { getAveragesForRange } = sleep;

  useEffect(() => {
    const load = async () => {
      const [hydrationMonth, sleepMonth] = await Promise.all([
        getTotalForRange(30),
        getAveragesForRange(30)
      ]);
      setHydrationTotal(hydrationMonth);
      setSleepAverage(sleepMonth.averageDuration);
    };

    load();
  }, [getAveragesForRange, getTotalForRange]);

  const hydrationAverage = Math.round(hydrationTotal / 30);
  const sleepHours = Math.floor(sleepAverage / 60);
  const sleepMinutes = Math.round(sleepAverage % 60);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f1ea] dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6 gap-6">
        <View className="flex-row items-center justify-between">
          <Link href="/" asChild>
            <Text className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Back
            </Text>
          </Link>
          <Link href="/weekly" asChild>
            <Text className="text-sm font-semibold text-brand-700 dark:text-brand-200">Weekly</Text>
          </Link>
        </View>

        <View className="gap-2">
          <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Month scan
          </Text>
          <Text className="text-3xl font-semibold text-slate-900 dark:text-white">Monthly overview</Text>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Calendar</Text>
            <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              February
            </Text>
          </View>
          <View className="h-56 rounded-2xl bg-slate-100/80 p-4 dark:bg-slate-900/70">
            <View className="flex-row justify-between">
              {[["M", "T", "W", "T", "F", "S", "S"]].map((week, index) => (
                <View key={`weekdays-${index}`} className="flex-row justify-between flex-1">
                  {week.map((day) => (
                    <Text key={day} className="text-xs text-slate-500 dark:text-slate-400">
                      {day}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
            <View className="mt-4 gap-3">
              <View className="flex-row justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <View
                    key={day}
                    className="h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/70"
                  >
                    <Text className="text-xs text-slate-700 dark:text-slate-200">{day}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-row justify-between">
                {[8, 9, 10, 11, 12, 13, 14].map((day) => (
                  <View
                    key={day}
                    className="h-8 w-8 items-center justify-center rounded-full bg-brand-100/70 dark:bg-brand-900/50"
                  >
                    <Text className="text-xs text-brand-700 dark:text-brand-200">{day}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-row justify-between">
                {[15, 16, 17, 18, 19, 20, 21].map((day) => (
                  <View
                    key={day}
                    className="h-8 w-8 items-center justify-center rounded-full bg-sleep-100/70 dark:bg-sleep-900/50"
                  >
                    <Text className="text-xs text-sleep-700 dark:text-sleep-200">{day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card>

        <Card className="gap-4">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">Monthly averages</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-slate-700 dark:text-slate-200">Hydration</Text>
            <Text className="text-base font-semibold text-brand-700 dark:text-brand-200">
              {formatDailyHydration(hydrationAverage, preferences.units)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-slate-700 dark:text-slate-200">Sleep</Text>
            <Text className="text-base font-semibold text-sleep-700 dark:text-sleep-200">
              {sleepHours}h {sleepMinutes.toString().padStart(2, "0")}m / night
            </Text>
          </View>
        </Card>

        <Card className="gap-4">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">Streaks</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-slate-700 dark:text-slate-200">Hydration</Text>
            <Text className="text-base font-semibold text-brand-700 dark:text-brand-200">5 days</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-slate-700 dark:text-slate-200">Sleep</Text>
            <Text className="text-base font-semibold text-sleep-700 dark:text-sleep-200">3 days</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
