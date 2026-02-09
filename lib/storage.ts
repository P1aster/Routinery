import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDefaultSchemas } from "./schemas";
import type { NotificationSchema, UserPreferences } from "./types";

const SCHEMAS_KEY = "routinery:schemas";
const PREFERENCES_KEY = "routinery:preferences";

export const DEFAULT_PREFERENCES: UserPreferences = {
  hydrationGoalMl: 2000,
  units: "ml",
  theme: "system",
  bedtime: "22:30",
  wakeTime: "07:00"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchema(value: unknown): value is NotificationSchema {
  if (!isRecord(value)) {
    return false;
  }

  const id = value.id;
  const type = value.type;
  const label = value.label;
  const enabled = value.enabled;
  const customizable = value.customizable;
  const schedule = value.schedule;

  if (
    typeof id !== "string" ||
    (type !== "hydration" &&
      type !== "sleep" &&
      type !== "sleep_log" &&
      type !== "phone_reminder") ||
    typeof label !== "string" ||
    typeof enabled !== "boolean" ||
    typeof customizable !== "boolean" ||
    !isRecord(schedule)
  ) {
    return false;
  }

  const kind = schedule.kind;
  if (kind === "interval") {
    return (
      typeof schedule.intervalMinutes === "number" &&
      typeof schedule.startTime === "string" &&
      typeof schedule.endTime === "string"
    );
  }

  if (kind === "bedtime") {
    return (
      typeof schedule.bedtime === "string" &&
      typeof schedule.reminderMinutesBefore === "number"
    );
  }

  if (kind === "wake") {
    return typeof schedule.wakeTime === "string";
  }

  if (kind === "phone") {
    return (
      typeof schedule.bedtime === "string" &&
      typeof schedule.minutesBeforeBedtime === "number"
    );
  }

  return false;
}

function isSchemaArray(value: unknown): value is NotificationSchema[] {
  return Array.isArray(value) && value.every((item) => isSchema(item));
}

function mergePreferences(value: Record<string, unknown>): UserPreferences {
  const merged: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    hydrationGoalMl:
      typeof value.hydrationGoalMl === "number" ? value.hydrationGoalMl : DEFAULT_PREFERENCES.hydrationGoalMl,
    units: value.units === "ml" || value.units === "oz" ? value.units : DEFAULT_PREFERENCES.units,
    theme:
      value.theme === "system" || value.theme === "light" || value.theme === "dark"
        ? value.theme
        : DEFAULT_PREFERENCES.theme,
    bedtime: typeof value.bedtime === "string" ? value.bedtime : DEFAULT_PREFERENCES.bedtime,
    wakeTime: typeof value.wakeTime === "string" ? value.wakeTime : DEFAULT_PREFERENCES.wakeTime
  };

  return merged;
}

export async function getPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed)) {
      return mergePreferences(parsed);
    }
  } catch {
    return DEFAULT_PREFERENCES;
  }

  return DEFAULT_PREFERENCES;
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function getNotificationSchemas(): Promise<NotificationSchema[]> {
  const raw = await AsyncStorage.getItem(SCHEMAS_KEY);
  if (!raw) {
    return getDefaultSchemas();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSchemaArray(parsed)) {
      return parsed;
    }
  } catch {
    return getDefaultSchemas();
  }

  return getDefaultSchemas();
}

export async function saveNotificationSchemas(schemas: NotificationSchema[]): Promise<void> {
  await AsyncStorage.setItem(SCHEMAS_KEY, JSON.stringify(schemas));
}
