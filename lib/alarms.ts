import * as Notifications from "expo-notifications";

import { configureNotifications, ensureNotificationPermissions } from "./notifications";

type AlarmOptions = {
  title: string;
  body: string;
  date: Date;
};

export async function scheduleOneTimeAlarm(options: AlarmOptions): Promise<string | null> {
  await configureNotifications();
  const permissionGranted = await ensureNotificationPermissions();
  if (!permissionGranted) {
    return null;
  }

  if (options.date.getTime() <= Date.now()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
      sound: "default"
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: options.date
    }
  });
}

export async function cancelScheduledAlarm(id: string | null): Promise<void> {
  if (!id) {
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(id);
}
