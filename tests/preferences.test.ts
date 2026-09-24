import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  getSpotlightPreferences,
  saveSpotlightPreferences,
  resolveTheme,
  useSpotlightPreferences,
  useTheme,
  DEFAULT_SPOTLIGHT_PREFERENCES,
  SPOTLIGHT_PREFERENCES_STORAGE_KEY,
} from "@/lib/preferences";
import { createChromeMock } from "./setup";

describe("preferences", () => {
  beforeEach(() => {
    (globalThis as any).chrome = createChromeMock();
  });

  it("returns default preferences when none are stored", async () => {
    const prefs = await getSpotlightPreferences();
    expect(prefs).toEqual(DEFAULT_SPOTLIGHT_PREFERENCES);
  });

  it("saves and retrieves preferences using storage.sync", async () => {
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      theme: "light",
      searchProvider: "duckduckgo",
    });

    const updated = await getSpotlightPreferences();
    expect(updated.theme).toBe("light");
    expect(updated.searchProvider).toBe("duckduckgo");
  });

  it("falls back to storage.local when sync storage is unavailable or empty", async () => {
    // Only local storage has preferences
    await (globalThis as any).chrome.storage.local.set({
      [SPOTLIGHT_PREFERENCES_STORAGE_KEY]: {
        theme: "light",
        includeBookmarks: false,
      },
    });

    // Make sync.get return empty
    (globalThis as any).chrome.storage.sync.get = vi.fn().mockResolvedValue({});

    const prefs = await getSpotlightPreferences();
    expect(prefs.theme).toBe("light");
    expect(prefs.includeBookmarks).toBe(false);

    // Save when sync is undefined
    delete (globalThis as any).chrome.storage.sync;
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      searchProvider: "brave",
    });

    const localData = await (globalThis as any).chrome.storage.local.get(
      SPOTLIGHT_PREFERENCES_STORAGE_KEY,
    );
    expect(localData[SPOTLIGHT_PREFERENCES_STORAGE_KEY].searchProvider).toBe(
      "brave",
    );
  });

  it("handles storage errors gracefully in getSpotlightPreferences and saveSpotlightPreferences", async () => {
    (globalThis as any).chrome.storage.sync.get = vi
      .fn()
      .mockRejectedValue(new Error("Storage corrupted"));

    const prefs = await getSpotlightPreferences();
    expect(prefs).toEqual(DEFAULT_SPOTLIGHT_PREFERENCES);

    (globalThis as any).chrome.storage.sync.set = vi
      .fn()
      .mockRejectedValue(new Error("Storage write failure"));

    await expect(
      saveSpotlightPreferences(DEFAULT_SPOTLIGHT_PREFERENCES),
    ).rejects.toThrow("Storage write failure");
  });

  it("resolves theme correctly with system preferences and fallbacks", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");

    let isLight = true;
    const matchMediaMock = vi.fn().mockImplementation((_query) => ({
      matches: isLight,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.matchMedia = matchMediaMock;

    expect(resolveTheme("system")).toBe("light");

    isLight = false;
    expect(resolveTheme("system")).toBe("dark");

    // Undefined matchMedia
    const origMatchMedia = window.matchMedia;
    (window as any).matchMedia = undefined;
    expect(resolveTheme("system")).toBe("dark");
    window.matchMedia = origMatchMedia;
  });

  it("useSpotlightPreferences hook loads, updates state, and listens to storage changes", async () => {
    let storageListener: any;
    (globalThis as any).chrome.storage.onChanged.addListener = vi.fn((fn) => {
      storageListener = fn;
    });

    const { result, unmount } = renderHook(() => useSpotlightPreferences());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.updatePreference("theme", "light");
    });
    expect(result.current.preferences.theme).toBe("light");

    // Simulate external storage change event
    await act(async () => {
      storageListener(
        {
          [SPOTLIGHT_PREFERENCES_STORAGE_KEY]: {
            newValue: { theme: "dark", searchProvider: "bing" },
          },
        },
        "sync",
      );
    });

    expect(result.current.preferences.theme).toBe("dark");
    expect(result.current.preferences.searchProvider).toBe("bing");

    unmount();
  });

  it("useSpotlightPreferences cleans up properly when chrome.storage.onChanged is absent", () => {
    delete (globalThis as any).chrome.storage.onChanged;

    const { unmount } = renderHook(() => useSpotlightPreferences());
    unmount();
  });

  it("useTheme hook listens to system theme changes", async () => {
    let mediaChangeHandler: any;
    const mediaQueryMock = {
      matches: false,
      addEventListener: vi.fn((event, fn) => {
        if (event === "change") mediaChangeHandler = fn;
      }),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryMock);

    const { result, unmount } = renderHook(() => useTheme("system"));
    expect(result.current).toBe("dark");

    // Trigger system theme change to light
    await act(async () => {
      mediaChangeHandler({ matches: true });
    });
    expect(result.current).toBe("light");

    // Trigger system theme change back to dark
    await act(async () => {
      mediaChangeHandler({ matches: false });
    });
    expect(result.current).toBe("dark");

    unmount();
    expect(mediaQueryMock.removeEventListener).toHaveBeenCalledWith(
      "change",
      mediaChangeHandler,
    );
  });
});
