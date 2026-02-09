import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { parseTime } from "./time";
import type { NotificationSchema } from "./types";

const CHANNEL_ID = "hydration-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Hydration & Sleep Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4a9cff"
    });
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return request.status === Notifications.PermissionStatus.GRANTED;
}

function computeReminderTime(
  bedtime: string,
  minutesBefore: number
): { hour: number; minute: number } | null {
  const parsed = parseTime(bedtime);
  if (!parsed) {
    return null;
  }

  const total = parsed.hour * 60 + parsed.minute - minutesBefore;
  const normalized = (total + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60
  };
}

async function scheduleDailyNotification(options: {
  title: string;
  body: string;
  hour: number;
  minute: number;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
      sound: "default"
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: options.hour,
      minute: options.minute,
      channelId: CHANNEL_ID
    }
  });
}

async function scheduleIntervalNotifications(schema: NotificationSchema): Promise<void> {
  if (schema.schedule.kind !== "interval") {
    return;
  }

  const start = parseTime(schema.schedule.startTime);
  const end = parseTime(schema.schedule.endTime);
  if (!start || !end) {
    return;
  }

  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const interval = schema.schedule.intervalMinutes;

  for (let time = startMinutes; time <= endMinutes; time += interval) {
    const hour = Math.floor(time / 60) % 24;
    const minute = time % 60;
    await scheduleDailyNotification({
      title: "Hydration check-in",
      body: "Pause for a sip and log your intake.",
      hour,
      minute
    });
  }
}

async function scheduleSleepNotification(schema: NotificationSchema): Promise<void> {
  if (schema.schedule.kind === "bedtime") {
    const reminder = computeReminderTime(
      schema.schedule.bedtime,
      schema.schedule.reminderMinutesBefore
    );
    if (!reminder) {
      return;
    }

    await scheduleDailyNotification({
      title: "Bedtime soon",
      body: "Start winding down for consistent sleep.",
      hour: reminder.hour,
      minute: reminder.minute
    });
  }

  if (schema.schedule.kind === "wake") {
    const wake = parseTime(schema.schedule.wakeTime);
    if (!wake) {
      return;
    }

    await scheduleDailyNotification({
      title: "Wake-up reminder",
      body: "Time to start your morning routine.",
      hour: wake.hour,
      minute: wake.minute
    });
  }
}

async function scheduleSleepLogNotification(schema: NotificationSchema): Promise<void> {
  if (schema.schedule.kind !== "wake") {
    return;
  }

  const wake = parseTime(schema.schedule.wakeTime);
  if (!wake) {
    return;
  }

  await scheduleDailyNotification({
    title: "Log last night's sleep",
    body: "Capture your bedtime, wake time, and sleep quality.",
    hour: wake.hour,
    minute: wake.minute
  });
}

async function schedulePhoneNotification(schema: NotificationSchema): Promise<void> {
  if (schema.schedule.kind !== "phone") {
    return;
  }

  const reminder = computeReminderTime(schema.schedule.bedtime, schema.schedule.minutesBeforeBedtime);
  if (!reminder) {
    return;
  }

  await scheduleDailyNotification({
    title: "Phone wind-down",
    body: "Silence distractions and switch to calm mode.",
    hour: reminder.hour,
    minute: reminder.minute
  });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleNotificationSchemas(
  schemas: NotificationSchema[]
): Promise<void> {
  await cancelAllScheduledNotifications();

  for (const schema of schemas) {
    if (!schema.enabled) {
      continue;
    }

    if (schema.type === "hydration") {
      await scheduleIntervalNotifications(schema);
    }

    if (schema.type === "sleep") {
      await scheduleSleepNotification(schema);
    }

    if (schema.type === "phone_reminder") {
      await schedulePhoneNotification(schema);
    }

    if (schema.type === "sleep_log") {
      await scheduleSleepLogNotification(schema);
    }
  }
}
