import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleTabDiscarded } from "@/background-tasks/discarded-tabs";
import { getArchivedTabs } from "@/lib/archived-tabs-storage";
import {
  saveSpotlightPreferences,
  DEFAULT_SPOTLIGHT_PREFERENCES,
} from "@/lib/preferences";

describe("handleTabDiscarded", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      autoCloseDiscardedTabs: true,
      maxArchivedTabs: 100,
      archiveRetentionDays: 7,
    });
  });

  it("returns false and does nothing if changeInfo.discarded is false", async () => {
    const removeSpy = vi.spyOn(chrome.tabs, "remove");

    const result = await handleTabDiscarded(123, { status: "complete" }, {
      id: 123,
      url: "https://example.com",
      title: "Example",
    } as any);

    expect(result).toBe(false);
    expect(removeSpy).not.toHaveBeenCalled();
    const archived = await getArchivedTabs();
    expect(archived).toHaveLength(0);
  });

  it("returns false and does not remove tab if autoCloseDiscardedTabs is disabled", async () => {
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      autoCloseDiscardedTabs: false,
    });
    const removeSpy = vi.spyOn(chrome.tabs, "remove");

    const result = await handleTabDiscarded(123, { discarded: true }, {
      id: 123,
      url: "https://example.com",
      title: "Example",
    } as any);

    expect(result).toBe(false);
    expect(removeSpy).not.toHaveBeenCalled();
    const archived = await getArchivedTabs();
    expect(archived).toHaveLength(0);
  });

  it("archives tab and calls chrome.tabs.remove when tab is discarded and enabled", async () => {
    const removeSpy = vi
      .spyOn(chrome.tabs, "remove")
      .mockResolvedValue(undefined as any);

    const result = await handleTabDiscarded(456, { discarded: true }, {
      id: 456,
      windowId: 1,
      url: "https://example.com/discarded",
      title: "Discarded Tab",
      favIconUrl: "https://example.com/fav.png",
    } as any);

    expect(result).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith(456);

    const archived = await getArchivedTabs();
    expect(archived).toHaveLength(1);
    expect(archived[0].originalTabId).toBe(456);
    expect(archived[0].url).toBe("https://example.com/discarded");
    expect(archived[0].title).toBe("Discarded Tab");
  });

  it("handles tab remove error gracefully if tab was already removed", async () => {
    vi.spyOn(chrome.tabs, "remove").mockRejectedValue(
      new Error("No tab with id: 789"),
    );

    const result = await handleTabDiscarded(789, { discarded: true }, {
      id: 789,
      url: "https://example.com/error-tab",
      title: "Error Tab",
    } as any);

    expect(result).toBe(true);
    const archived = await getArchivedTabs();
    expect(archived).toHaveLength(1);
    expect(archived[0].url).toBe("https://example.com/error-tab");
  });
});
