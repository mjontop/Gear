import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBookmarks } from "@/background-tasks/bookmarks";
import { getHistory } from "@/background-tasks/history";
import { getOpenTabs } from "@/background-tasks/open-tabs";
import { getSearchSuggestions } from "@/background-tasks/search-suggestions";
import { switchToTab } from "@/background-tasks/switch-tab";

describe("background-tasks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("bookmarks", () => {
    it("fetches and deduplicates bookmarks", async () => {
      (globalThis as any).chrome.bookmarks.getRecent = vi
        .fn()
        .mockResolvedValue([
          { id: "1", title: "Repo 1", url: "https://github.com/repo" },
          { id: "2", title: "Repo 2", url: "https://github.com/repo" },
          { id: "3", title: "Empty Folder" },
          { id: "4", title: "", url: "https://notitle.com" },
        ]);

      const res = await getBookmarks("");
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe("1");
      expect(res[1].title).toBe("https://notitle.com");
    });
  });

  describe("history", () => {
    it("fetches and deduplicates history items", async () => {
      (globalThis as any).chrome.history.search = vi.fn().mockResolvedValue([
        {
          id: "h1",
          title: "Google",
          url: "https://google.com",
          lastVisitTime: 1000,
        },
        {
          id: "h2",
          title: "Google Duplicate",
          url: "https://google.com",
          lastVisitTime: 2000,
        },
        { id: "h3", title: "Invalid" },
        { id: "h4", title: "", url: "https://notitlehistory.com" },
      ]);

      const res = await getHistory("google");
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe("h1");
      expect(res[1].title).toBe("https://notitlehistory.com");
    });
  });

  describe("open-tabs", () => {
    it("excludes current tab and sorts active tab first", async () => {
      (globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
        {
          id: 10,
          windowId: 1,
          title: "Background Tab",
          url: "https://tab1.com",
          active: false,
          index: 1,
        },
        {
          id: 11,
          windowId: 1,
          title: "Active Tab",
          url: "https://tab2.com",
          active: true,
          index: 2,
        },
        {
          id: 99,
          windowId: 1,
          title: "Current Spotlight Tab",
          url: "https://current.com",
          active: true,
          index: 0,
        },
      ]);

      const tabs = await getOpenTabs(99);
      expect(tabs).toHaveLength(2);
      expect(tabs[0].id).toBe(11);
      expect(tabs[1].id).toBe(10);
    });

    it("handles active tab already first in sorting", async () => {
      (globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
        { id: 1, windowId: 1, active: true, index: 1, title: "Active" },
        { id: 2, windowId: 1, active: false, index: 2, title: "Inactive" },
      ]);

      const tabs = await getOpenTabs();
      expect(tabs[0].id).toBe(1);
    });

    it("sorts by windowId and index, and handles title fallbacks and audio states", async () => {
      (globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
        {
          id: 1,
          windowId: 2,
          url: "https://tab-window2.com",
          active: false,
          index: 0,
        },
        {
          id: 2,
          windowId: 1,
          title: "",
          url: "",
          active: false,
          index: 5,
        },
        {
          id: 3,
          windowId: 1,
          title: "Audible Tab",
          url: "https://music.com",
          active: false,
          index: 2,
          audible: true,
          mutedInfo: { muted: true },
        },
      ]);

      const tabs = await getOpenTabs();
      expect(tabs).toHaveLength(3);
      // Window 1 tabs sorted by index: index 2 (id 3) then index 5 (id 2)
      expect(tabs[0].id).toBe(3);
      expect(tabs[0].audible).toBe(true);
      expect(tabs[0].muted).toBe(true);
      expect(tabs[1].id).toBe(2);
      expect(tabs[1].title).toBe("Untitled");
      // Window 2 tab comes after Window 1
      expect(tabs[2].id).toBe(1);
      expect(tabs[2].title).toBe("https://tab-window2.com");
    });
  });

  describe("search-suggestions", () => {
    it("returns empty array for empty query", async () => {
      const res = await getSearchSuggestions("   ");
      expect(res).toEqual([]);
    });

    it("fetches suggestions from search engine API and formats results", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          "react",
          ["react query", "react router", "react", "react router"],
        ],
      }) as any;

      const res = await getSearchSuggestions("react", "google");
      expect(res).toHaveLength(3);
      expect(res[0].query).toBe("react");
      expect(res[1].query).toBe("react query");
      expect(res[2].query).toBe("react router");
    });

    it("handles non-ok HTTP response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
      }) as any;

      const res = await getSearchSuggestions("react", "google");
      expect(res).toHaveLength(1);
      expect(res[0].query).toBe("react");
    });

    it("handles non-array or invalid JSON payload", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: true }),
      }) as any;

      const res = await getSearchSuggestions("react", "google");
      expect(res).toHaveLength(1);
      expect(res[0].query).toBe("react");
    });

    it("falls back to default provider for unknown provider ID", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ["react", ["react docs"]],
      }) as any;

      const res = await getSearchSuggestions(
        "react",
        "unknown-provider" as any,
      );
      expect(res).toHaveLength(2);
    });

    it("falls back to single search suggestion when fetch fails", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error("Network error")) as any;

      const res = await getSearchSuggestions("vite", "duckduckgo");
      expect(res).toHaveLength(1);
      expect(res[0].query).toBe("vite");
    });
  });

  describe("switch-tab", () => {
    it("focuses window and activates target tab", async () => {
      await switchToTab(42, 1);
      expect((globalThis as any).chrome.windows.update).toHaveBeenCalledWith(
        1,
        { focused: true },
      );
      expect((globalThis as any).chrome.tabs.update).toHaveBeenCalledWith(42, {
        active: true,
      });
    });
  });
});
