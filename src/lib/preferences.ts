import { useEffect, useState } from "react";
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  SPOTLIGHT_PREFERENCES_STORAGE_KEY,
  type SearchProviderId,
} from "@/constants";

export { SPOTLIGHT_PREFERENCES_STORAGE_KEY };

export type ThemeMode = "dark" | "light" | "system";

export type SpotlightPreferences = {
  includeBookmarks: boolean;
  includeHistory: boolean;
  searchProvider: SearchProviderId;
  enableBackgroundBlur: boolean;
  theme: ThemeMode;
};

export const DEFAULT_SPOTLIGHT_PREFERENCES: SpotlightPreferences = {
  includeBookmarks: true,
  includeHistory: true,
  searchProvider: DEFAULT_SEARCH_PROVIDER_ID,
  enableBackgroundBlur: true,
  theme: "dark",
};

export async function getSpotlightPreferences(): Promise<SpotlightPreferences> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      const data = await chrome.storage.sync.get(
        SPOTLIGHT_PREFERENCES_STORAGE_KEY,
      );
      if (data[SPOTLIGHT_PREFERENCES_STORAGE_KEY]) {
        return {
          ...DEFAULT_SPOTLIGHT_PREFERENCES,
          ...(data[
            SPOTLIGHT_PREFERENCES_STORAGE_KEY
          ] as Partial<SpotlightPreferences>),
        };
      }
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(
        SPOTLIGHT_PREFERENCES_STORAGE_KEY,
      );
      if (data[SPOTLIGHT_PREFERENCES_STORAGE_KEY]) {
        return {
          ...DEFAULT_SPOTLIGHT_PREFERENCES,
          ...(data[
            SPOTLIGHT_PREFERENCES_STORAGE_KEY
          ] as Partial<SpotlightPreferences>),
        };
      }
    }
  } catch (err) {
    console.error("Failed to load preferences from storage:", err);
  }
  return DEFAULT_SPOTLIGHT_PREFERENCES;
}

export async function saveSpotlightPreferences(
  preferences: SpotlightPreferences,
): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      await chrome.storage.sync.set({
        [SPOTLIGHT_PREFERENCES_STORAGE_KEY]: preferences,
      });
      return;
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [SPOTLIGHT_PREFERENCES_STORAGE_KEY]: preferences,
      });
      return;
    }
  } catch (err) {
    console.error("Failed to save preferences to storage:", err);
    throw err;
  }
}

export function useSpotlightPreferences() {
  const [preferences, setPreferences] = useState<SpotlightPreferences>(
    DEFAULT_SPOTLIGHT_PREFERENCES,
  );

  useEffect(() => {
    let isCurrent = true;

    getSpotlightPreferences().then((stored) => {
      if (isCurrent) {
        setPreferences(stored);
      }
    });

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      const handleStorageChange = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ) => {
        if (areaName === "sync" || areaName === "local") {
          if (changes[SPOTLIGHT_PREFERENCES_STORAGE_KEY]) {
            const newPrefs =
              (changes[SPOTLIGHT_PREFERENCES_STORAGE_KEY]
                .newValue as Partial<SpotlightPreferences>) || {};
            setPreferences({
              ...DEFAULT_SPOTLIGHT_PREFERENCES,
              ...newPrefs,
            });
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        isCurrent = false;
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  const updatePreference = async <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => {
    const nextPrefs = { ...preferences, [key]: value };
    setPreferences(nextPrefs);
    await saveSpotlightPreferences(nextPrefs);
  };

  return { preferences, updatePreference, setPreferences };
}

export function resolveTheme(theme: ThemeMode = "dark"): "dark" | "light" {
  if (theme === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    return "dark";
  }
  return theme === "light" ? "light" : "dark";
}

export function useTheme(
  themePreference: ThemeMode = "dark",
): "dark" | "light" {
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    resolveTheme(themePreference),
  );

  useEffect(() => {
    setResolvedTheme(resolveTheme(themePreference));

    if (
      themePreference === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia
    ) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "light" : "dark");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themePreference]);

  return resolvedTheme;
}
