import { useEffect, useState } from "react";

export type SpotlightPreferences = {
  includeBookmarks: boolean;
  includeHistory: boolean;
};

export const DEFAULT_SPOTLIGHT_PREFERENCES: SpotlightPreferences = {
  includeBookmarks: true,
  includeHistory: true,
};

export const SPOTLIGHT_PREFERENCES_STORAGE_KEY = "gear_spotlight_preferences";

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
