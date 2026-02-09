import { createContext, ReactNode, useContext } from "react";

import { useNotifications } from "./useNotifications";
import type { NotificationSchema } from "../lib/types";

type NotificationsContextValue = {
  schemas: NotificationSchema[];
  permissionGranted: boolean;
  loading: boolean;
  toggleSchema: (id: string, enabled: boolean) => Promise<void>;
  updateSchema: (id: string, updates: Partial<NotificationSchema>) => Promise<void>;
  refreshPermissions: () => Promise<boolean>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const value = useNotifications();
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsContext(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotificationsContext must be used within NotificationsProvider");
  }
  return context;
}
