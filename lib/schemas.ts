import type { NotificationSchema } from "./types";

export const DEFAULT_SCHEMAS: NotificationSchema[] = [
  {
    id: "hydration-2hr",
    type: "hydration",
    label: "Hydration 2-hour",
    enabled: true,
    customizable: true,
    schedule: {
      kind: "interval",
      intervalMinutes: 120,
      startTime: "08:00",
      endTime: "22:00"
    }
  },
  {
    id: "sleep-bedtime-30",
    type: "sleep",
    label: "Bedtime reminder (30 min)",
    enabled: true,
    customizable: true,
    schedule: {
      kind: "bedtime",
      bedtime: "22:30",
      reminderMinutesBefore: 30
    }
  },
  {
    id: "sleep-wake",
    type: "sleep",
    label: "Wake-up reminder",
    enabled: false,
    customizable: true,
    schedule: {
      kind: "wake",
      wakeTime: "07:00"
    }
  },
  {
    id: "sleep-log",
    type: "sleep_log",
    label: "Log sleep reminder",
    enabled: false,
    customizable: true,
    schedule: {
      kind: "wake",
      wakeTime: "07:00"
    }
  },
  {
    id: "phone-wind-down",
    type: "phone_reminder",
    label: "Phone wind-down (1h prior)",
    enabled: true,
    customizable: true,
    schedule: {
      kind: "phone",
      bedtime: "22:30",
      minutesBeforeBedtime: 60
    }
  }
];

export function getDefaultSchemas(): NotificationSchema[] {
  return DEFAULT_SCHEMAS.map((schema) => ({
    ...schema,
    schedule: { ...schema.schedule }
  }));
}

export function mergeSchemas(
  storedSchemas: NotificationSchema[] | null | undefined
): NotificationSchema[] {
  if (!storedSchemas || storedSchemas.length === 0) {
    return getDefaultSchemas();
  }

  const defaults = getDefaultSchemas();
  const storedById = new Map(storedSchemas.map((schema) => [schema.id, schema]));

  return defaults.map((schema) => {
    const stored = storedById.get(schema.id);
    if (!stored) {
      return schema;
    }

    return {
      ...schema,
      enabled: stored.enabled,
      schedule: stored.schedule
    };
  });
}
