import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  archiveTab,
  clearArchivedTabs,
  getArchivedTabs,
  pruneArchivedTabs,
  pruneExpiredArchivedTabs,
  saveArchivedTabs,
  type ArchivedTab,
} from "@/lib/archived-tabs-storage";

describe("archived-tabs-storage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("pruneArchivedTabs", () => {
    it("filters out tabs older than retentionDays", () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const tabs: ArchivedTab[] = [
        {
          id: "1",
          title: "Fresh",
          url: "https://example.com/fresh",
          discardedAt: now - 2 * oneDay,
        },
        {
          id: "2",
          title: "Old",
          url: "https://example.com/old",
          discardedAt: now - 10 * oneDay,
        },
      ];

      const pruned = pruneArchivedTabs(tabs, 100, 7);
      expect(pruned).toHaveLength(1);
      expect(pruned[0].id).toBe("1");
    });

    it("limits tabs to maxTabs and sorts by discardedAt descending", () => {
      const now = Date.now();
      const tabs: ArchivedTab[] = [
        {
          id: "1",
          title: "Older",
          url: "https://example.com/1",
          discardedAt: now - 2000,
        },
        {
          id: "2",
          title: "Newest",
          url: "https://example.com/2",
          discardedAt: now,
        },
        {
          id: "3",
          title: "Oldest",
          url: "https://example.com/3",
          discardedAt: now - 5000,
        },
      ];

      const pruned = pruneArchivedTabs(tabs, 2, 7);
      expect(pruned).toHaveLength(2);
      expect(pruned[0].id).toBe("2");
      expect(pruned[1].id).toBe("1");
    });

    it("handles tabs with missing url and enforces minimum safe limits", () => {
      const now = Date.now();
      const tabs: any[] = [
        {
          id: "1",
          title: "Valid",
          url: "https://example.com",
          discardedAt: now,
        },
        { id: "2", title: "No URL", url: "", discardedAt: now },
        null,
      ];

      const pruned = pruneArchivedTabs(tabs, 0, 0);
      expect(pruned).toHaveLength(1);
      expect(pruned[0].id).toBe("1");
    });
  });

  describe("getArchivedTabs and saveArchivedTabs", () => {
    it("returns empty array when storage is empty", async () => {
      const tabs = await getArchivedTabs();
      expect(tabs).toEqual([]);
    });

    it("saves and loads tabs from storage", async () => {
      const sampleTabs: ArchivedTab[] = [
        {
          id: "tab-1",
          title: "Test Tab",
          url: "https://example.com",
          discardedAt: Date.now(),
        },
      ];

      await saveArchivedTabs(sampleTabs);
      const loaded = await getArchivedTabs();
      expect(loaded).toEqual(sampleTabs);
    });

    it("handles storage read error gracefully and returns empty array", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(chrome.storage.local, "get").mockRejectedValueOnce(
        new Error("Storage disk error"),
      );

      const loaded = await getArchivedTabs();
      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("rethrows error when saveArchivedTabs fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(chrome.storage.local, "set").mockRejectedValueOnce(
        new Error("Storage write failure"),
      );

      await expect(saveArchivedTabs([])).rejects.toThrow(
        "Storage write failure",
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("archiveTab", () => {
    it("ignores tabs with empty or blank URLs", async () => {
      const res1 = await archiveTab({ url: "" });
      const res2 = await archiveTab({ url: "about:blank" });
      const res3 = await archiveTab({});

      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(res3).toBeNull();
      expect(await getArchivedTabs()).toHaveLength(0);
    });

    it("archives a valid tab and saves it to storage", async () => {
      const archived = await archiveTab({
        id: 42,
        windowId: 1,
        title: "GitHub",
        url: "https://github.com",
        favIconUrl: "https://github.com/favicon.ico",
      });

      expect(archived).not.toBeNull();
      expect(archived?.originalTabId).toBe(42);
      expect(archived?.windowId).toBe(1);
      expect(archived?.title).toBe("GitHub");
      expect(archived?.url).toBe("https://github.com");
      expect(archived?.favIconUrl).toBe("https://github.com/favicon.ico");
      expect(archived?.discardedAt).toBeGreaterThan(0);

      const stored = await getArchivedTabs();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(archived?.id);
    });

    it("prepends new tab and prunes according to maxTabs and retentionDays", async () => {
      await archiveTab(
        { id: 1, title: "Tab 1", url: "https://example.com/1" },
        2,
        7,
      );
      await archiveTab(
        { id: 2, title: "Tab 2", url: "https://example.com/2" },
        2,
        7,
      );
      await archiveTab(
        { id: 3, title: "Tab 3", url: "https://example.com/3" },
        2,
        7,
      );

      const stored = await getArchivedTabs();
      expect(stored).toHaveLength(2);
      expect(stored[0].url).toBe("https://example.com/3");
      expect(stored[1].url).toBe("https://example.com/2");
    });
  });

  describe("clearArchivedTabs", () => {
    it("clears all archived tabs", async () => {
      await archiveTab({ title: "Tab", url: "https://example.com" });
      expect(await getArchivedTabs()).toHaveLength(1);

      await clearArchivedTabs();
      expect(await getArchivedTabs()).toHaveLength(0);
    });
  });

  describe("pruneExpiredArchivedTabs", () => {
    it("prunes expired tabs and persists pruned list to storage", async () => {
      const oneDay = 24 * 60 * 60 * 1000;
      const now = Date.now();
      await saveArchivedTabs([
        {
          id: "active-1",
          title: "Active",
          url: "https://example.com/active",
          discardedAt: now - 2 * oneDay,
        },
        {
          id: "expired-1",
          title: "Expired",
          url: "https://example.com/expired",
          discardedAt: now - 10 * oneDay,
        },
      ]);

      const pruned = await pruneExpiredArchivedTabs(100, 7);
      expect(pruned).toHaveLength(1);
      expect(pruned[0].id).toBe("active-1");

      const inStorage = await getArchivedTabs();
      expect(inStorage).toHaveLength(1);
      expect(inStorage[0].id).toBe("active-1");
    });
  });
});
