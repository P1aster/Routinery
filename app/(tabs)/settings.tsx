import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import Card from "../../components/ui/Card";
import SafeAreaView from "../../components/ui/SafeAreaView";
import TimePickerInput from "../../components/ui/TimePickerInput";
import Toggle from "../../components/ui/Toggle";
import { useNotificationsContext } from "../../hooks/notifications-context";
import { DEFAULT_PREFERENCES } from "../../lib/storage";
import { usePreferencesContext } from "../../hooks/preferences-context";
import { isValidTime } from "../../lib/time";
import type { NotificationSchedule, NotificationSchema } from "../../lib/types";

function buildSchemaEdits(
  schemas: NotificationSchema[]
): Record<string, NotificationSchema> {
  const next: Record<string, NotificationSchema> = {};
  for (const schema of schemas) {
    next[schema.id] = schema;
  }
  return next;
}

function isScheduleValid(schedule: NotificationSchedule): boolean {
  if (schedule.kind === "interval") {
    return (
      schedule.intervalMinutes > 0 &&
      isValidTime(schedule.startTime) &&
      isValidTime(schedule.endTime)
    );
  }

  if (schedule.kind === "bedtime") {
    return isValidTime(schedule.bedtime) && schedule.reminderMinutesBefore >= 0;
  }

  if (schedule.kind === "wake") {
    return isValidTime(schedule.wakeTime);
  }

  if (schedule.kind === "phone") {
    return isValidTime(schedule.bedtime) && schedule.minutesBeforeBedtime >= 0;
  }

  return false;
}

function formatScheduleSummary(schedule: NotificationSchedule): string {
  if (schedule.kind === "interval") {
    return `${schedule.intervalMinutes} min | ${schedule.startTime}-${schedule.endTime}`;
  }

  if (schedule.kind === "bedtime") {
    return `${schedule.bedtime} | ${schedule.reminderMinutesBefore} min before`;
  }

  if (schedule.kind === "wake") {
    return `Wake ${schedule.wakeTime}`;
  }

  return `${schedule.bedtime} | ${schedule.minutesBeforeBedtime} min before`;
}

function alignScheduleWithCoreTimes(
  schema: NotificationSchema,
  bedtime: string,
  wakeTime: string
): NotificationSchedule | null {
  if (schema.type === "hydration" && schema.schedule.kind === "interval") {
    return { ...schema.schedule, startTime: wakeTime, endTime: bedtime };
  }

  if (schema.type === "sleep" && schema.schedule.kind === "bedtime") {
    return { ...schema.schedule, bedtime };
  }

  if (schema.type === "sleep" && schema.schedule.kind === "wake") {
    return { ...schema.schedule, wakeTime };
  }

  if (schema.type === "sleep_log" && schema.schedule.kind === "wake") {
    return { ...schema.schedule, wakeTime };
  }

  if (schema.type === "phone_reminder" && schema.schedule.kind === "phone") {
    return { ...schema.schedule, bedtime };
  }

  return null;
}

export default function SettingsScreen() {
  const notifications = useNotificationsContext();
  const { preferences, updatePreferences } = usePreferencesContext();
  const [bedtimeInput, setBedtimeInput] = useState(DEFAULT_PREFERENCES.bedtime);
  const [wakeInput, setWakeInput] = useState(DEFAULT_PREFERENCES.wakeTime);
  const [schemaEdits, setSchemaEdits] = useState<Record<string, NotificationSchema>>({});
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);

  useEffect(() => {
    setBedtimeInput(preferences.bedtime);
    setWakeInput(preferences.wakeTime);
  }, [preferences.bedtime, preferences.wakeTime]);

  useEffect(() => {
    setSchemaEdits(buildSchemaEdits(notifications.schemas));
  }, [notifications.schemas]);

  const toggleUnits = async (value: boolean) => {
    const next = {
      ...preferences,
      units: value ? "oz" : "ml"
    };
    await updatePreferences(next);
  };

  const toggleTheme = async (value: boolean) => {
    const nextTheme = value ? "dark" : "system";
    const next = { ...preferences, theme: nextTheme };
    await updatePreferences(next);
  };

  const coreTimesValid = useMemo(
    () => isValidTime(bedtimeInput) && isValidTime(wakeInput),
    [bedtimeInput, wakeInput]
  );

  const activeSchema = activeSchemaId ? schemaEdits[activeSchemaId] : undefined;
  const activeSchemaValid = activeSchema ? isScheduleValid(activeSchema.schedule) : false;

  const saveCoreTimes = async () => {
    if (!coreTimesValid) {
      return;
    }

    const next = {
      ...preferences,
      bedtime: bedtimeInput,
      wakeTime: wakeInput
    };
    await updatePreferences(next);

    const updates: Promise<void>[] = [];
    for (const schema of notifications.schemas) {
      if (!schema.enabled) {
        continue;
      }
      const aligned = alignScheduleWithCoreTimes(schema, bedtimeInput, wakeInput);
      if (!aligned) {
        continue;
      }
      updates.push(
        notifications.updateSchema(schema.id, {
          schedule: aligned
        })
      );
    }

    await Promise.all(updates);
  };

  const updateSchemaEdit = (id: string, scheduleUpdates: Partial<NotificationSchedule>) => {
    setSchemaEdits((prev) => {
      const current = prev[id];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [id]: {
          ...current,
          schedule: {
            ...current.schedule,
            ...scheduleUpdates
          }
        }
      };
    });
  };

  const handleSchemaToggle = async (schema: NotificationSchema, enabled: boolean) => {
    if (enabled && coreTimesValid) {
      const aligned = alignScheduleWithCoreTimes(schema, bedtimeInput, wakeInput);
      if (aligned) {
        await notifications.updateSchema(schema.id, { enabled, schedule: aligned });
        return;
      }
    }

    await notifications.updateSchema(schema.id, { enabled });
  };

  const closeSchemaEditor = () => {
    setActiveSchemaId(null);
  };

  const saveActiveSchema = async () => {
    if (!activeSchema) {
      return;
    }
    if (!isScheduleValid(activeSchema.schedule)) {
      return;
    }
    await notifications.updateSchema(activeSchema.id, { schedule: activeSchema.schedule });
    closeSchemaEditor();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f1ea] dark:bg-slate-950">
      <View className="absolute -top-12 left-[-56px] h-44 w-44 rounded-full bg-sleep-100/70 dark:bg-sleep-900/40" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6 gap-6">
        <View className="gap-3">
          <Text className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Control room
          </Text>
          <Text className="text-3xl font-semibold text-slate-900 dark:text-white">Settings</Text>
          <Text className="text-base text-slate-600 dark:text-slate-300">
            Tune reminders, units, and wind-down rituals.
          </Text>
        </View>

        <Card className="gap-4">
          <Text className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reminder schemas
          </Text>
          <View className="gap-3">
            {notifications.schemas.length === 0 ? (
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Loading reminders...
              </Text>
            ) : (
              notifications.schemas.map((schema) => {
                const edit = schemaEdits[schema.id];
                if (!edit) {
                  return null;
                }
                const scheduleValid = isScheduleValid(edit.schedule);

                return (
                  <View
                    key={schema.id}
                    className="gap-3 rounded-3xl border border-slate-200/60 bg-white/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/60"
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-slate-900 dark:text-white">
                          {schema.label}
                        </Text>
                        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {schema.type.replace("_", " ")}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          {formatScheduleSummary(edit.schedule)}
                        </Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="text-[10px] uppercase tracking-wide text-slate-400">
                          Enabled
                        </Text>
                        <Toggle
                          label=""
                          enabled={schema.enabled}
                          onChange={(value) => handleSchemaToggle(schema, value)}
                        />
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text
                        className={[
                          "text-xs",
                          scheduleValid
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-rose-600 dark:text-rose-400"
                        ].join(" ")}
                      >
                        {scheduleValid ? "Ready to save." : "Check the times and minutes."}
                      </Text>
                      {schema.customizable ? (
                        <Pressable
                          onPress={() => setActiveSchemaId(schema.id)}
                          className="rounded-full bg-slate-900 px-4 py-2 dark:bg-white"
                        >
                          <Text className="text-xs font-semibold uppercase tracking-wide text-white dark:text-slate-900">
                            Edit
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            Notifications {notifications.permissionGranted ? "enabled" : "paused"} on this device.
          </Text>
        </Card>

        <Modal
          visible={Boolean(activeSchema)}
          transparent={true}
          animationType="fade"
          onRequestClose={closeSchemaEditor}
        >
          <Pressable
            className="flex-1 items-end justify-end bg-slate-950/40"
            onPress={closeSchemaEditor}
          >
            <Pressable
              className="w-full rounded-t-3xl bg-[#f6f1ea] px-6 pb-8 pt-5 dark:bg-slate-950"
              onPress={(event) => event.stopPropagation()}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                    {activeSchema?.label ?? "Edit reminder"}
                  </Text>
                  <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {activeSchema?.type.replace("_", " ") ?? ""}
                  </Text>
                </View>
                <Pressable
                  onPress={closeSchemaEditor}
                  className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-900"
                >
                  <Text className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                    Close
                  </Text>
                </Pressable>
              </View>

              {activeSchema ? (
                <View className="mt-4 gap-4">
                  {activeSchema.schedule.kind === "interval" ? (
                    <View className="gap-3">
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <TimePickerInput
                            label="Start"
                            value={activeSchema.schedule.startTime}
                            placeholder="08:00"
                            onChange={(value) =>
                              updateSchemaEdit(activeSchema.id, {
                                startTime: value
                              })
                            }
                          />
                        </View>
                        <View className="flex-1">
                          <TimePickerInput
                            label="End"
                            value={activeSchema.schedule.endTime}
                            placeholder="22:00"
                            onChange={(value) =>
                              updateSchemaEdit(activeSchema.id, {
                                endTime: value
                              })
                            }
                          />
                        </View>
                      </View>
                      <View className="gap-1">
                        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Interval (minutes)
                        </Text>
                        <TextInput
                          value={String(activeSchema.schedule.intervalMinutes)}
                          onChangeText={(value) => {
                            const next = Number(value.replace(/\D/g, ""));
                            updateSchemaEdit(activeSchema.id, {
                              intervalMinutes: Number.isNaN(next) ? 0 : next
                            });
                          }}
                          placeholder="120"
                          keyboardType="number-pad"
                          className="rounded-2xl bg-white/80 px-4 py-2 text-base text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        />
                      </View>
                    </View>
                  ) : null}

                  {activeSchema.schedule.kind === "bedtime" ? (
                    <View className="gap-3">
                      <TimePickerInput
                        label="Bedtime"
                        value={activeSchema.schedule.bedtime}
                        placeholder="22:30"
                        onChange={(value) =>
                          updateSchemaEdit(activeSchema.id, {
                            bedtime: value
                          })
                        }
                      />
                      <View className="gap-1">
                        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Minutes before
                        </Text>
                        <TextInput
                          value={String(activeSchema.schedule.reminderMinutesBefore)}
                          onChangeText={(value) => {
                            const next = Number(value.replace(/\D/g, ""));
                            updateSchemaEdit(activeSchema.id, {
                              reminderMinutesBefore: Number.isNaN(next) ? 0 : next
                            });
                          }}
                          placeholder="30"
                          keyboardType="number-pad"
                          className="rounded-2xl bg-white/80 px-4 py-2 text-base text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        />
                      </View>
                    </View>
                  ) : null}

                  {activeSchema.schedule.kind === "wake" ? (
                    <TimePickerInput
                      label="Wake time"
                      value={activeSchema.schedule.wakeTime}
                      placeholder="07:00"
                      onChange={(value) =>
                        updateSchemaEdit(activeSchema.id, {
                          wakeTime: value
                        })
                      }
                    />
                  ) : null}

                  {activeSchema.schedule.kind === "phone" ? (
                    <View className="gap-3">
                      <TimePickerInput
                        label="Bedtime"
                        value={activeSchema.schedule.bedtime}
                        placeholder="22:30"
                        onChange={(value) =>
                          updateSchemaEdit(activeSchema.id, {
                            bedtime: value
                          })
                        }
                      />
                      <View className="gap-1">
                        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Minutes before
                        </Text>
                        <TextInput
                          value={String(activeSchema.schedule.minutesBeforeBedtime)}
                          onChangeText={(value) => {
                            const next = Number(value.replace(/\D/g, ""));
                            updateSchemaEdit(activeSchema.id, {
                              minutesBeforeBedtime: Number.isNaN(next) ? 0 : next
                            });
                          }}
                          placeholder="60"
                          keyboardType="number-pad"
                          className="rounded-2xl bg-white/80 px-4 py-2 text-base text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        />
                      </View>
                    </View>
                  ) : null}

                  <View className="flex-row items-center justify-between">
                    <Text
                      className={[
                        "text-xs",
                        activeSchemaValid
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-rose-600 dark:text-rose-400"
                      ].join(" ")}
                    >
                      {activeSchemaValid ? "Ready to save." : "Check the times and minutes."}
                    </Text>
                    <Pressable
                      onPress={saveActiveSchema}
                      className={[
                        "rounded-full px-4 py-2",
                        activeSchemaValid ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-800"
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-xs font-semibold uppercase tracking-wide",
                          activeSchemaValid
                            ? "text-white dark:text-slate-900"
                            : "text-slate-500 dark:text-slate-400"
                        ].join(" ")}
                      >
                        Save
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>

        <Card className="gap-4">
          <Text className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Preferences
          </Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white/70 px-4 py-3 dark:bg-slate-900/60">
            <Text className="text-base text-slate-700 dark:text-slate-200">Units</Text>
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300">
              {preferences.units}
            </Text>
          </View>
          <Toggle
            label={`Switch to ${preferences.units === "ml" ? "oz" : "ml"}`}
            enabled={preferences.units === "oz"}
            onChange={toggleUnits}
          />
          <View className="flex-row items-center justify-between rounded-2xl bg-white/70 px-4 py-3 dark:bg-slate-900/60">
            <Text className="text-base text-slate-700 dark:text-slate-200">Theme</Text>
            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-300">
              {preferences.theme}
            </Text>
          </View>
          <Toggle
            label={`Theme: ${preferences.theme === "system" ? "System" : "Dark"}`}
            enabled={preferences.theme === "dark"}
            onChange={toggleTheme}
          />
        </Card>

        <Card className="gap-4">
          <Text className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Core sleep window
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300">
            Consistent bed and wake times support sleep quality. Aim for 7-9 hours nightly.
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <TimePickerInput
                label="Bedtime"
                value={bedtimeInput}
                placeholder="22:30"
                onChange={setBedtimeInput}
              />
            </View>
            <View className="flex-1 gap-1">
              <TimePickerInput
                label="Wake time"
                value={wakeInput}
                placeholder="07:00"
                onChange={setWakeInput}
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className={[
                "text-xs",
                coreTimesValid ? "text-slate-500 dark:text-slate-400" : "text-rose-600 dark:text-rose-400"
              ].join(" ")}
            >
              {coreTimesValid ? "Reminders will use these times." : "Use 24h time (e.g. 22:30)."}
            </Text>
            <Pressable
              onPress={saveCoreTimes}
              className={[
                "rounded-full px-4 py-2",
                coreTimesValid ? "bg-sleep-600" : "bg-slate-200 dark:bg-slate-800"
              ].join(" ")}
            >
              <Text
                className={[
                  "text-xs font-semibold uppercase tracking-wide",
                  coreTimesValid ? "text-white" : "text-slate-500 dark:text-slate-400"
                ].join(" ")}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </Card>


      </ScrollView>
    </SafeAreaView>
  );
}
