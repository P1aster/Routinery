import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import Card from "../../components/ui/Card";
import PrimaryButton from "../../components/ui/Button";
import SafeAreaView from "../../components/ui/SafeAreaView";
import TimePickerInput from "../../components/ui/TimePickerInput";
import Toggle from "../../components/ui/Toggle";
import { useHydration } from "../../hooks/useHydration";
import { useNaps } from "../../hooks/useNaps";
import { useNotificationsContext } from "../../hooks/notifications-context";
import { usePreferencesContext } from "../../hooks/preferences-context";
import { useSleep } from "../../hooks/useSleep";
import { cancelScheduledAlarm, scheduleOneTimeAlarm } from "../../lib/alarms";
import { HYDRATION_PRESETS, type HydrationPreset } from "../../lib/hydration";
import { formatVolume } from "../../lib/units";
import { format } from "date-fns";
import { isValidTime, parseTime } from "../../lib/time";

function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return "--";
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest.toString().padStart(2, "0")}m`;
}

function buildSleepDates(
  bedtimeValue: string,
  wakeValue: string
): { bedtime: Date; wakeTime: Date } | null {
  const bedtime = parseTime(bedtimeValue);
  const wake = parseTime(wakeValue);
  if (!bedtime || !wake) {
    return null;
  }

  const now = new Date();
  const bedtimeDate = new Date(now);
  bedtimeDate.setHours(bedtime.hour, bedtime.minute, 0, 0);

  const wakeDate = new Date(now);
  wakeDate.setHours(wake.hour, wake.minute, 0, 0);
  if (wakeDate <= bedtimeDate) {
    if (now.getHours() < 12) {
      bedtimeDate.setDate(bedtimeDate.getDate() - 1);
    } else {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
  }

  return { bedtime: bedtimeDate, wakeTime: wakeDate };
}


export default function DashboardScreen() {
  const hydration = useHydration();
  const sleep = useSleep();
  const notifications = useNotificationsContext();
  const naps = useNaps();
  const { preferences } = usePreferencesContext();

  const fallbackHydrationPreset: HydrationPreset = {
    id: "fallback",
    label: "Cup",
    amountMl: 250,
    icon: "🥤"
  };
  const defaultHydrationPreset =
    HYDRATION_PRESETS.find((preset) => preset.id === "cup") ?? fallbackHydrationPreset;

  const [hydrationMenuOpen, setHydrationMenuOpen] = useState(false);
  const [hydrationPreset, setHydrationPreset] = useState(defaultHydrationPreset);
  const [sleepBedtimeInput, setSleepBedtimeInput] = useState("");
  const [sleepWakeInput, setSleepWakeInput] = useState("");
  const [sleepQualityValue, setSleepQualityValue] = useState(4);
  const [sleepEditorOpen, setSleepEditorOpen] = useState(false);
  const [wakeAlarmEnabled, setWakeAlarmEnabled] = useState(false);
  const [wakeAlarmId, setWakeAlarmId] = useState<string | null>(null);
  const [napEditorOpen, setNapEditorOpen] = useState(false);
  const [napDurationInput, setNapDurationInput] = useState("20");
  const [napQualityValue, setNapQualityValue] = useState(3);
  const [napAlarmEnabled, setNapAlarmEnabled] = useState(false);
  const [napStage, setNapStage] = useState<"idle" | "active" | "quality">("idle");
  const [napStartTime, setNapStartTime] = useState<Date | null>(null);
  const [napEndTime, setNapEndTime] = useState<Date | null>(null);
  const [napAlarmId, setNapAlarmId] = useState<string | null>(null);

  useEffect(() => {
    setSleepBedtimeInput(preferences.bedtime);
    setSleepWakeInput(preferences.wakeTime);
  }, [preferences.bedtime, preferences.wakeTime]);

  const hydrationProgress = Math.round(hydration.progress * 100);
  const hydrationRemaining = Math.max(hydration.goal - hydration.todayTotal, 0);
  const latestSleep = sleep.recentEntries[0];
  const sleepDuration = latestSleep ? formatDuration(latestSleep.duration) : "--";
  const sleepQualityLabel = latestSleep ? latestSleep.quality.toFixed(1) : "--";

  const upcomingSchemas = notifications.schemas.filter((schema) => schema.enabled).slice(0, 2);

  const sleepDates = buildSleepDates(sleepBedtimeInput, sleepWakeInput);
  const sleepFormValid = Boolean(sleepDates && sleepQualityValue >= 1 && sleepQualityValue <= 5);
  const napDurationMinutes = Number(napDurationInput.replace(/\D/g, ""));
  const napDurationValid = Number.isFinite(napDurationMinutes) && napDurationMinutes > 0;
  const napFormValid = napDurationValid && napQualityValue >= 1 && napQualityValue <= 5;
  const mainSleepLocked = sleep.mainSleepLoggedToday;
  const hydrationAmountLabel = useMemo(
    () => formatVolume(hydrationPreset.amountMl, preferences.units),
    [hydrationPreset.amountMl, preferences.units]
  );
  const hydrationGoalLabel = useMemo(
    () => formatVolume(hydration.goal, preferences.units),
    [hydration.goal, preferences.units]
  );
  const hydrationTotalLabel = useMemo(
    () => formatVolume(hydration.todayTotal, preferences.units),
    [hydration.todayTotal, preferences.units]
  );
  const hydrationRemainingLabel = useMemo(
    () => formatVolume(hydrationRemaining, preferences.units),
    [hydrationRemaining, preferences.units]
  );

  const logHydration = () => {
    hydration.addEntry(hydrationPreset.amountMl, "water");
    setHydrationMenuOpen(false);
  };

  const logSleep = async () => {
    if (!sleepDates || mainSleepLocked) {
      return;
    }
    await sleep.addEntry(sleepDates.bedtime, sleepDates.wakeTime, sleepQualityValue);
    if (wakeAlarmEnabled) {
      const alarmId = await scheduleOneTimeAlarm({
        title: "Wake time",
        body: "Your wake alarm is ringing.",
        date: sleepDates.wakeTime
      });
      setWakeAlarmId(alarmId);
    } else if (wakeAlarmId) {
      await cancelScheduledAlarm(wakeAlarmId);
      setWakeAlarmId(null);
    }
    setSleepEditorOpen(false);
  };

  const startNap = async () => {
    if (!napDurationValid) {
      return;
    }
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + napDurationMinutes * 60 * 1000);
    setNapStartTime(startTime);
    setNapEndTime(endTime);
    setNapStage("active");

    if (napAlarmEnabled) {
      const alarmId = await scheduleOneTimeAlarm({
        title: "Nap complete",
        body: "Time to wake up from your nap.",
        date: endTime
      });
      setNapAlarmId(alarmId);
    }
  };

  const ringNap = () => {
    if (!napStartTime) {
      return;
    }
    setNapEndTime(new Date());
    setNapStage("quality");
  };

  const cancelNap = async () => {
    await cancelScheduledAlarm(napAlarmId);
    setNapAlarmId(null);
    setNapStartTime(null);
    setNapEndTime(null);
    setNapStage("idle");
  };

  const logNap = async () => {
    if (!napStartTime || !napEndTime || !napFormValid) {
      return;
    }
    await naps.addEntry(napStartTime, napEndTime, napQualityValue);
    await cancelScheduledAlarm(napAlarmId);
    setNapAlarmId(null);
    setNapStartTime(null);
    setNapEndTime(null);
    setNapStage("idle");
    setNapEditorOpen(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f1ea] dark:bg-slate-950">
      <View className="absolute -top-24 right-[-64px] h-56 w-56 rounded-full bg-brand-200/60 dark:bg-brand-900/40" />
      <View className="absolute -top-8 left-[-60px] h-40 w-40 rounded-full bg-sleep-200/50 dark:bg-sleep-900/40" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6 gap-6">
        <View className="gap-3">
          <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tonight forecast
          </Text>
          <Text className="text-4xl font-semibold text-slate-900 dark:text-white">
            Hydrate, then coast.
          </Text>
          <Text className="text-base text-slate-600 dark:text-slate-300">
            {hydration.loading
              ? "Syncing your hydration and sleep rhythm."
              : `You are ${hydrationProgress}% to your water goal with ${hydrationRemainingLabel} remaining today.`}
          </Text>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wider text-slate-400">Hydration</Text>
              <Text className="text-2xl font-semibold text-slate-900 dark:text-white">
                {hydrationTotalLabel} / {hydrationGoalLabel}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {hydrationProgress >= 100
                  ? "Goal achieved. Keep it steady."
                  : `Next sip: ${formatVolume(Math.min(hydrationRemaining, 350), preferences.units)} target`}
              </Text>
            </View>
            <View className="items-center justify-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border-4 border-brand-400 bg-brand-100/60 dark:border-brand-500 dark:bg-brand-900/50">
                <Text className="text-base font-semibold text-brand-700 dark:text-brand-200">
                  {hydrationProgress}%
                </Text>
              </View>
            </View>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <View
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${Math.max(hydrationProgress, 8)}%` }}
            />
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wider text-slate-400">Sleep</Text>
              <Text className="text-2xl font-semibold text-slate-900 dark:text-white">
                {sleepDuration}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Quality index: {sleepQualityLabel} / 5
              </Text>
            </View>
            <View className="items-center justify-center rounded-full bg-sleep-100/70 px-4 py-2 dark:bg-sleep-900/50">
              <Text className="text-sm font-semibold text-sleep-700 dark:text-sleep-200">
                {sleep.averageQuality >= 4 ? "+" : ""}
                {sleep.averageQuality.toFixed(1)} trend
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <View
                className="h-2 rounded-full bg-sleep-400"
                style={{ width: `${Math.min(sleep.averageDuration / 8 / 60, 1) * 100}%` }}
              />
            </View>
            <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              steady
            </Text>
          </View>
        </Card>

        <Card className="gap-5">
          <View className="gap-1">
            <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Quick log
            </Text>
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              Capture the basics fast
            </Text>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hydration</Text>
            <Pressable
              onPress={() => setHydrationMenuOpen((prev) => !prev)}
              className="flex-row items-center justify-between rounded-2xl bg-white/80 px-4 py-3 dark:bg-slate-900/60"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">{hydrationPreset.icon}</Text>
                <View>
                  <Text className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {hydrationPreset.label}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-300">
                    {hydrationAmountLabel}
                  </Text>
                </View>
              </View>
              <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                {hydrationMenuOpen ? "close" : "choose"}
              </Text>
            </Pressable>
            {hydrationMenuOpen ? (
              <View className="gap-2">
                {HYDRATION_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      setHydrationPreset(preset);
                      setHydrationMenuOpen(false);
                    }}
                    className="flex-row items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-900/70"
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className="text-lg">{preset.icon}</Text>
                      <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {preset.label}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500 dark:text-slate-300">
                      {formatVolume(preset.amountMl, preferences.units)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <PrimaryButton
              label={`Add ${hydrationAmountLabel}`}
              onPress={logHydration}
            />
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Spread intake through the day. Big drinks close to bedtime can disrupt sleep.
            </Text>
          </View>

          <View className="gap-3 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sleep</Text>
              <Pressable onPress={() => setSleepEditorOpen((prev) => !prev)}>
                <Text className="text-xs uppercase tracking-wide text-sleep-700 dark:text-sleep-200">
                  {sleepEditorOpen ? "hide" : "edit"}
                </Text>
              </Pressable>
            </View>
            {sleepEditorOpen ? (
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <TimePickerInput
                      label="Bedtime"
                      value={sleepBedtimeInput}
                      placeholder="22:30"
                      onChange={setSleepBedtimeInput}
                    />
                  </View>
                  <View className="flex-1 gap-1">
                    <TimePickerInput
                      label="Wake"
                      value={sleepWakeInput}
                      placeholder="07:00"
                      onChange={setSleepWakeInput}
                    />
                  </View>
                </View>
                <View className="flex-row items-center justify-between rounded-2xl bg-sleep-50/70 px-4 py-3 dark:bg-sleep-900/40">
                  <Text className="text-sm text-slate-600 dark:text-slate-300">
                    Aim for 7-9 hours with consistent timing.
                  </Text>
                </View>
                <Toggle
                  label="Wake alarm"
                  enabled={wakeAlarmEnabled}
                  onChange={setWakeAlarmEnabled}
                />
                {wakeAlarmId ? (
                  <Pressable
                    onPress={async () => {
                      await cancelScheduledAlarm(wakeAlarmId);
                      setWakeAlarmId(null);
                      setWakeAlarmEnabled(false);
                    }}
                    className="self-start rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-900"
                  >
                    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                      Cancel alarm
                    </Text>
                  </Pressable>
                ) : null}
                <View className="gap-2">
                  <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Quality
                  </Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable
                        key={value}
                        onPress={() => setSleepQualityValue(value)}
                        className={[
                          "flex-1 rounded-full px-3 py-2",
                          sleepQualityValue === value
                            ? "bg-sleep-300/80"
                            : "bg-slate-100/70 dark:bg-slate-900/70"
                        ].join(" ")}
                      >
                        <Text
                          className={[
                            "text-center text-xs font-semibold uppercase tracking-wide",
                            sleepQualityValue === value
                              ? "text-sleep-900"
                              : "text-slate-600 dark:text-slate-300"
                          ].join(" ")}
                        >
                          {value}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <PrimaryButton
                  label="Log sleep"
                  onPress={logSleep}
                  disabled={
                    mainSleepLocked ||
                    !sleepFormValid ||
                    !isValidTime(sleepBedtimeInput) ||
                    !isValidTime(sleepWakeInput)
                  }
                />
                {mainSleepLocked ? (
                  <Text className="text-xs text-rose-600 dark:text-rose-400">
                    Main sleep already logged today. Add a nap instead.
                  </Text>
                ) : null}
                {!sleepFormValid ? (
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Use 24h time (e.g. 22:30). Wake time can be next day.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Log bedtime and wake time with a quality score.
              </Text>
            )}
          </View>

          <View className="gap-3 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nap</Text>
              <Pressable onPress={() => setNapEditorOpen((prev) => !prev)}>
                <Text className="text-xs uppercase tracking-wide text-sleep-700 dark:text-sleep-200">
                  {napEditorOpen ? "hide" : "add"}
                </Text>
              </Pressable>
            </View>
            {napEditorOpen ? (
              <View className="gap-3">
                {napStage === "idle" ? (
                  <View className="gap-3">
                    <View className="gap-1">
                      <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Duration (minutes)
                      </Text>
                      <TextInput
                        value={napDurationInput}
                        onChangeText={setNapDurationInput}
                        placeholder="20"
                        keyboardType="number-pad"
                        className="rounded-2xl bg-white/80 px-4 py-2 text-base text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                      />
                    </View>
                    <Toggle
                      label="Nap alarm"
                      enabled={napAlarmEnabled}
                      onChange={setNapAlarmEnabled}
                    />
                    <PrimaryButton
                      label="Start nap"
                      onPress={startNap}
                      disabled={!napDurationValid}
                    />
                    {!napDurationValid ? (
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        Enter a nap duration in minutes.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {napStage === "active" && napStartTime && napEndTime ? (
                  <View className="gap-3">
                    <View className="rounded-2xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/60">
                      <Text className="text-sm text-slate-600 dark:text-slate-300">
                        Started {format(napStartTime, "p")} · Target end {format(napEndTime, "p")}
                      </Text>
                    </View>
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={ringNap}
                        className="flex-1 rounded-full bg-sleep-600 px-4 py-2"
                      >
                        <Text className="text-center text-xs font-semibold uppercase tracking-wide text-white">
                          Ring now
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={cancelNap}
                        className="flex-1 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-900"
                      >
                        <Text className="text-center text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {napStage === "quality" ? (
                  <View className="gap-3">
                    <Text className="text-sm text-slate-600 dark:text-slate-300">
                      How did that nap feel?
                    </Text>
                    <View className="gap-2">
                      <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Quality
                      </Text>
                      <View className="flex-row gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Pressable
                            key={value}
                            onPress={() => setNapQualityValue(value)}
                            className={[
                              "flex-1 rounded-full px-3 py-2",
                              napQualityValue === value
                                ? "bg-sleep-300/80"
                                : "bg-slate-100/70 dark:bg-slate-900/70"
                            ].join(" ")}
                          >
                            <Text
                              className={[
                                "text-center text-xs font-semibold uppercase tracking-wide",
                                napQualityValue === value
                                  ? "text-sleep-900"
                                  : "text-slate-600 dark:text-slate-300"
                              ].join(" ")}
                            >
                              {value}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <PrimaryButton label="Log nap" onPress={logNap} disabled={!napFormValid} />
                  </View>
                ) : null}
              </View>
            ) : (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Log a nap without affecting your main sleep.
              </Text>
            )}
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming reminders</Text>
            <Text className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active
            </Text>
          </View>
          <View className="gap-3">
            {upcomingSchemas.length === 0 ? (
              <View className="rounded-2xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/60">
                <Text className="text-sm text-slate-600 dark:text-slate-300">
                  Enable reminder schemas in settings to see the next check-ins.
                </Text>
              </View>
            ) : (
              upcomingSchemas.map((schema) => (
                <View
                  key={schema.id}
                  className="flex-row items-center justify-between rounded-2xl bg-brand-50/70 px-4 py-3 dark:bg-brand-900/40"
                >
                  <View>
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {schema.label}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-300">
                      {schema.type.replace("_", " ")}
                    </Text>
                  </View>
                  <Text className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-200">
                    on
                  </Text>
                </View>
              ))
            )}
          </View>
        </Card>

        <View className="flex-row items-center justify-between rounded-3xl border border-slate-200/60 bg-white/70 px-5 py-4 dark:border-slate-800/70 dark:bg-slate-900/70">
          <View>
            <Text className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Views
            </Text>
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">Trends dashboard</Text>
          </View>
          <View className="flex-row gap-4">
            <Link href="/weekly" asChild>
              <Text className="text-sm font-semibold text-brand-700 dark:text-brand-200">Weekly</Text>
            </Link>
            <Link href="/monthly" asChild>
              <Text className="text-sm font-semibold text-sleep-700 dark:text-sleep-200">Monthly</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
