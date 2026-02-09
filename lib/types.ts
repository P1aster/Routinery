export type HydrationType = "water" | "other";

export type HydrationEntry = {
  id: number;
  amount: number;
  timestamp: string;
  type: HydrationType;
};

export type SleepEntry = {
  id: number;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
};

export type NapEntry = {
  id: number;
  startTime: string;
  endTime: string;
  duration: number;
  quality: number;
};

export type NotificationType = "hydration" | "sleep" | "sleep_log" | "phone_reminder";

export type HydrationSchedule = {
  kind: "interval";
  intervalMinutes: number;
  startTime: string;
  endTime: string;
};

export type BedtimeSchedule = {
  kind: "bedtime";
  bedtime: string;
  reminderMinutesBefore: number;
};

export type WakeSchedule = {
  kind: "wake";
  wakeTime: string;
};

export type PhoneSchedule = {
  kind: "phone";
  bedtime: string;
  minutesBeforeBedtime: number;
};

export type NotificationSchedule =
  | HydrationSchedule
  | BedtimeSchedule
  | WakeSchedule
  | PhoneSchedule;

export type NotificationSchema = {
  id: string;
  type: NotificationType;
  label: string;
  enabled: boolean;
  customizable: boolean;
  schedule: NotificationSchedule;
};

export type Units = "ml" | "oz";
export type ThemePreference = "system" | "light" | "dark";

export type UserPreferences = {
  hydrationGoalMl: number;
  units: Units;
  theme: ThemePreference;
  bedtime: string;
  wakeTime: string;
};
