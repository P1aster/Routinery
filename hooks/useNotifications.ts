import { useCallback, useEffect, useState } from "react";

import {
  cancelAllScheduledNotifications,
  configureNotifications,
  ensureNotificationPermissions,
  scheduleNotificationSchemas
} from "../lib/notifications";
import { getNotificationSchemas, saveNotificationSchemas } from "../lib/storage";
import { mergeSchemas } from "../lib/schemas";
import type { NotificationSchema } from "../lib/types";

export function useNotifications() {
  const [schemas, setSchemas] = useState<NotificationSchema[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const persistAndSchedule = useCallback(
    async (nextSchemas: NotificationSchema[], hasPermission: boolean) => {
      await saveNotificationSchemas(nextSchemas);
      if (hasPermission) {
        await scheduleNotificationSchemas(nextSchemas);
      } else {
        await cancelAllScheduledNotifications();
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await configureNotifications();
      const permission = await ensureNotificationPermissions();
      const stored = await getNotificationSchemas();
      const merged = mergeSchemas(stored);

      if (mounted) {
        setPermissionGranted(permission);
        setSchemas(merged);
        setLoading(false);
      }

      await persistAndSchedule(merged, permission);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [persistAndSchedule]);

  const toggleSchema = useCallback(
    async (id: string, enabled: boolean) => {
      const nextSchemas = schemas.map((schema) =>
        schema.id === id ? { ...schema, enabled } : schema
      );
      setSchemas(nextSchemas);
      await persistAndSchedule(nextSchemas, permissionGranted);
    },
    [permissionGranted, persistAndSchedule, schemas]
  );

  const updateSchema = useCallback(
    async (id: string, updates: Partial<NotificationSchema>) => {
      const nextSchemas = schemas.map((schema) =>
        schema.id === id ? { ...schema, ...updates } : schema
      );
      setSchemas(nextSchemas);
      await persistAndSchedule(nextSchemas, permissionGranted);
    },
    [permissionGranted, persistAndSchedule, schemas]
  );

  const refreshPermissions = useCallback(async () => {
    const permission = await ensureNotificationPermissions();
    setPermissionGranted(permission);
    await persistAndSchedule(schemas, permission);
    return permission;
  }, [persistAndSchedule, schemas]);

  return {
    schemas,
    permissionGranted,
    loading,
    toggleSchema,
    updateSchema,
    refreshPermissions
  };
}
