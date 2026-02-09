import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Uniwind } from "uniwind";

import { DEFAULT_PREFERENCES, getPreferences, savePreferences } from "../lib/storage";
import type { ThemePreference, UserPreferences } from "../lib/types";

type PreferencesContextValue = {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  if (theme === "system") {
    Uniwind.setTheme("system");
    return;
  }
  Uniwind.setTheme(theme);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const preferencesRef = useRef<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const load = async () => {
      const prefs = await getPreferences();
      setPreferences(prefs);
      preferencesRef.current = prefs;
      applyTheme(prefs.theme);
      setLoading(false);
    };

    load();
  }, []);

  const updatePreferences = useMemo(
    () =>
      async (updates: Partial<UserPreferences>) => {
        const nextStored = { ...preferencesRef.current, ...updates };
        preferencesRef.current = nextStored;
        setPreferences(nextStored);
        applyTheme(nextStored.theme);
        await savePreferences(nextStored);
      },
    []
  );

  const refreshPreferences = useMemo(
    () =>
      async () => {
        const prefs = await getPreferences();
        setPreferences(prefs);
        preferencesRef.current = prefs;
        applyTheme(prefs.theme);
      },
    []
  );

  const value = useMemo(
    () => ({ preferences, loading, updatePreferences, refreshPreferences }),
    [loading, preferences, refreshPreferences, updatePreferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferencesContext must be used within PreferencesProvider");
  }
  return context;
}
