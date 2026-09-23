import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  getSpotlightResults,
  useSpotlightShortcut,
  useOpenTabs,
  useBookmarks,
  useHistory,
} from "@/components/spotlight/hooks";
import { MESSAGE_TYPES } from "@/constants";

describe("spotlight hooks and algorithms", () => {
  describe("getSpotlightResults", () => {
    const mockTabs = [
      {
        id: 1,
        windowId: 1,
        title: "React Documentation",
        url: "https://react.dev",
        active: false,
      },
      {
        id: 2,
        windowId: 1,
        title: "GitHub",
        url: "https://github.com",
        active: false,
      },
    ];
    const mockBookmarks = [
      { id: "b1", title: "React Icons", url: "https://react-icons.github.io" },
    ];
    const mockHistory = [
      {
        id: "h1",
        title: "React Tutorial",
        url: "https://react.dev/learn",
        lastVisitTime: 100,
      },
    ];
    const mockSuggestions = [
      {
        id: "s1",
        query: "react 19 features",
        title: "react 19 features",
        url: "https://google.com/search?q=react",
      },
    ];

    it("returns top tabs and bookmarks when query is empty", () => {
      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: mockBookmarks,
        history: mockHistory,
        searchSuggestions: [],
        rawQuery: "",
        cleanQuery: "",
        maxResults: 5,
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((r) => r.kind === "open-tab")).toBe(true);
    });

    it("prioritizes direct URL when input is a valid URL", () => {
      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: mockBookmarks,
        history: mockHistory,
        searchSuggestions: mockSuggestions,
        rawQuery: "https://vite.dev",
        cleanQuery: "https://vite.dev",
        validUrl: "https://vite.dev",
        maxResults: 5,
      });

      expect(results[0].kind).toBe("direct-url");
      expect(results[0].url).toBe("https://vite.dev");
    });

    it("ranks results matching title higher than url matches", () => {
      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: mockBookmarks,
        history: mockHistory,
        searchSuggestions: [],
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      expect(results[0].title.toLowerCase()).toContain("react");
    });

    it("deduplicates identical URLs across sources", () => {
      const duplicateHistory = [
        {
          id: "h_dup",
          title: "React Docs Duplicate",
          url: "https://react.dev",
        },
      ];

      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: [],
        history: duplicateHistory,
        searchSuggestions: [],
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      const reactDevMatches = results.filter(
        (r) => r.url === "https://react.dev",
      );
      expect(reactDevMatches).toHaveLength(1);
      expect(reactDevMatches[0].kind).toBe("open-tab");
    });
  });

  describe("useOpenTabs", () => {
    it("fetches open tabs when spotlight is open", async () => {
      const mockTabs = [
        {
          id: 1,
          title: "Tab 1",
          url: "https://tab1.com",
          windowId: 1,
          active: true,
        },
      ];
      (chrome.runtime.sendMessage as any).mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_OPEN_TABS && cb) {
            cb({ tabs: mockTabs });
          }
        },
      );

      const { result } = renderHook(() => useOpenTabs(true));
      expect(result.current.tabs).toEqual(mockTabs);
    });
  });

  describe("useBookmarks", () => {
    it("fetches bookmarks when enabled and open", () => {
      const mockBookmarks = [
        { id: "b1", title: "BM 1", url: "https://bm1.com" },
      ];
      (chrome.runtime.sendMessage as any).mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_BOOKMARKS && cb) {
            cb({ bookmarks: mockBookmarks });
          }
        },
      );

      const { result } = renderHook(() =>
        useBookmarks({
          isOpen: true,
          rawQuery: "",
          cleanQuery: "",
          enabled: true,
        }),
      );
      expect(result.current).toEqual(mockBookmarks);
    });
  });

  describe("useHistory", () => {
    it("fetches history when enabled and open", () => {
      const mockHistory = [
        { id: "h1", title: "History 1", url: "https://h1.com" },
      ];
      (chrome.runtime.sendMessage as any).mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_HISTORY && cb) {
            cb({ history: mockHistory });
          }
        },
      );

      const { result } = renderHook(() =>
        useHistory({ isOpen: true, cleanQuery: "", enabled: true }),
      );
      expect(result.current).toEqual(mockHistory);
    });
  });

  describe("useSpotlightShortcut", () => {
    it("listens for TOGGLE_SPOTLIGHT message and toggles state", () => {
      const setIsOpen = vi.fn();
      const onToggle = vi.fn();

      let messageListener: any;
      (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
        messageListener = fn;
      });

      renderHook(() => useSpotlightShortcut({ setIsOpen, onToggle }));

      act(() => {
        messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
      });

      expect(onToggle).toHaveBeenCalled();
      expect(setIsOpen).toHaveBeenCalled();
    });
  });
});
