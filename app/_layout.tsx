import "../global.css";

import { Stack } from "expo-router";

import { NotificationsProvider } from "../hooks/notifications-context";
import { PreferencesProvider } from "../hooks/preferences-context";

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <NotificationsProvider>
        <Stack
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </NotificationsProvider>
    </PreferencesProvider>
  );
}
