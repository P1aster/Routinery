import { Tabs } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePreferencesContext } from "../../hooks/preferences-context";

export default function TabsLayout() {
  const { preferences } = usePreferencesContext();
  const colorScheme = useColorScheme();
  const isDark =
    preferences.theme === "dark" || (preferences.theme === "system" && colorScheme === "dark");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#f8fafc" : "#0f172a",
        tabBarInactiveTintColor: isDark ? "#94a3b8" : "#64748b",
        tabBarStyle: {
          backgroundColor: isDark ? "#0b1120" : "#f8f4ee",
          borderTopColor: isDark ? "#1f2937" : "#e2e8f0",
          height: Platform.select({ ios: 86, android: 70 })
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          paddingBottom: Platform.select({ ios: 12, android: 8 })
        },
        tabBarIconStyle: {
          marginTop: Platform.select({ ios: 8, android: 6 })
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Ionicons name="water" size={18} color={color} />
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Ionicons name="time" size={18} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={18} color={color} />
        }}
      />
    </Tabs>
  );
}
