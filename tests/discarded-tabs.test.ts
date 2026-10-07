import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleTabDiscarded,
  closeExistingDiscardedTabs,
} from "@/background-tasks/discarded-tabs";
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

describe("closeExistingDiscardedTabs", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      autoCloseDiscardedTabs: true,
      maxArchivedTabs: 100,
      archiveRetentionDays: 7,
    });
  });

  it("queries existing tabs and closes inactive discarded tabs", async () => {
    const removeSpy = vi
      .spyOn(chrome.tabs, "remove")
      .mockResolvedValue(undefined as any);

    vi.spyOn(chrome.tabs, "query").mockResolvedValue([
      {
        id: 101,
        url: "https://active.com",
        title: "Active Tab",
        active: true,
        discarded: true, // Active should never be closed
      },
      {
        id: 102,
        url: "https://inactive-discarded.com",
        title: "Inactive Discarded",
        active: false,
        discarded: true,
      },
      {
        id: 103,
        url: "https://unloaded.com",
        title: "Unloaded Tab",
        active: false,
        status: "unloaded",
      },
      {
        id: 104,
        url: "https://normal.com",
        title: "Normal Active Tab",
        active: false,
        discarded: false,
      },
    ] as any);

    const count = await closeExistingDiscardedTabs();

    expect(count).toBe(2);
    expect(removeSpy).toHaveBeenCalledWith(102);
    expect(removeSpy).toHaveBeenCalledWith(103);
    expect(removeSpy).not.toHaveBeenCalledWith(101);
    expect(removeSpy).not.toHaveBeenCalledWith(104);

    const archived = await getArchivedTabs();
    expect(archived).toHaveLength(2);
  });

  it("does not close tabs when autoCloseDiscardedTabs is false", async () => {
    await saveSpotlightPreferences({
      ...DEFAULT_SPOTLIGHT_PREFERENCES,
      autoCloseDiscardedTabs: false,
    });

    const removeSpy = vi.spyOn(chrome.tabs, "remove");
    vi.spyOn(chrome.tabs, "query").mockResolvedValue([
      {
        id: 102,
        url: "https://inactive-discarded.com",
        active: false,
        discarded: true,
      },
    ] as any);

    const count = await closeExistingDiscardedTabs();
    expect(count).toBe(0);
    expect(removeSpy).not.toHaveBeenCalled();
  });
});
