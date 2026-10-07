import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecentlyClosedTabs } from "@/background-tasks/recently-closed";
import { getDownloads, openDownload } from "@/background-tasks/downloads";

describe("sidebar background tasks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getRecentlyClosedTabs", () => {
    it("extracts recently closed tabs and window tabs from sessions API", async () => {
      const mockSessions: any[] = [
        {
          lastModified: 1700000000,
          tab: {
            id: 11,
            sessionId: "sess_tab_1",
            windowId: 1,
            index: 0,
            highlighted: false,
            active: false,
            pinned: false,
            incognito: false,
            title: "Recently closed tab",
            url: "https://example.com/tab",
            favIconUrl: "https://example.com/fav.png",
          },
        },
        {
          lastModified: 1700000010,
          window: {
            id: 22,
            focused: false,
            incognito: false,
            alwaysOnTop: false,
            tabs: [
              {
                id: 12,
                sessionId: "sess_win_tab_1",
                windowId: 22,
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
                title: "Window closed tab",
                url: "https://example.com/win-tab",
              },
            ],
          },
        },
      ];

      (chrome.sessions.getRecentlyClosed as any) = vi
        .fn()
        .mockResolvedValue(mockSessions);

      const results = await getRecentlyClosedTabs();
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe("Recently closed tab");
      expect(results[0].url).toBe("https://example.com/tab");
      expect(results[0].favIconUrl).toBe("https://example.com/fav.png");
      expect(results[1].title).toBe("Window closed tab");
      expect(results[1].url).toBe("https://example.com/win-tab");
    });

    it("handles error in sessions.getRecentlyClosed gracefully", async () => {
      (chrome.sessions.getRecentlyClosed as any) = vi
        .fn()
        .mockRejectedValue(new Error("Sessions fail"));

      const results = await getRecentlyClosedTabs();
      expect(results).toEqual([]);
    });
  });

  describe("getDownloads and openDownload", () => {
    it("searches and normalizes downloads list", async () => {
      const mockItems: any[] = [
        {
          id: 101,
          filename: "/Users/test/Downloads/document.pdf",
          url: "https://example.com/document.pdf",
          fileSize: 204800,
          startTime: "2026-10-07T12:00:00.000Z",
          state: "complete",
        },
      ];

      (chrome.downloads.search as any) = vi.fn().mockResolvedValue(mockItems);

      const results = await getDownloads("doc");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(101);
      expect(results[0].filename).toBe("document.pdf");
      expect(results[0].fileSize).toBe(204800);
      expect(results[0].state).toBe("complete");
    });

    it("handles downloads.search failure gracefully", async () => {
      (chrome.downloads.search as any) = vi
        .fn()
        .mockRejectedValue(new Error("Download search fail"));
      const results = await getDownloads();
      expect(results).toEqual([]);
    });

    it("opens download item and falls back to show on error", async () => {
      const openSpy = vi.fn().mockImplementation(() => {
        throw new Error("Cannot open");
      });
      const showSpy = vi.fn().mockImplementation(() => {});

      (chrome.downloads.open as any) = openSpy;
      (chrome.downloads.show as any) = showSpy;

      const result = await openDownload(101);
      expect(openSpy).toHaveBeenCalledWith(101);
      expect(showSpy).toHaveBeenCalledWith(101);
      expect(result).toBe(true);
    });
  });
});
