import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  getSpotlightResults,
  useSpotlightShortcut,
  useOpenTabs,
  useBookmarks,
  useHistory,
  useSearchSuggestions,
  useSpotlightScrollLock,
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

      const duplicateBookmark = [
        {
          id: "b_dup",
          title: "React Docs Bookmark",
          url: "https://react.dev",
        },
      ];

      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: duplicateBookmark,
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

    it("handles URL-only match score and invalid URL fallback in getSpotlightResults", () => {
      const urlOnlyMatch = [
        {
          id: 99,
          windowId: 1,
          title: "Dashboard",
          url: "https://unique-query-term.com",
        },
        {
          id: 100,
          windowId: 1,
          title: "Invalid URL Item unique-query-term",
          url: "invalid:url:%%",
        },
      ];

      const results = getSpotlightResults({
        tabs: urlOnlyMatch,
        bookmarks: [],
        history: [],
        searchSuggestions: [],
        rawQuery: "unique-query-term",
        cleanQuery: "unique-query-term",
        maxResults: 5,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(100);
      expect(results[1].id).toBe(99);
    });

    it("allocates slots for search suggestions and preserves local results", () => {
      const results = getSpotlightResults({
        tabs: mockTabs,
        bookmarks: mockBookmarks,
        history: mockHistory,
        searchSuggestions: mockSuggestions,
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      expect(results.some((r) => r.kind === "search-suggestion")).toBe(true);
      expect(results.some((r) => r.kind === "open-tab")).toBe(true);
    });

    it("sorts history items with equal match score by lastVisitTime descending", () => {
      const historyWithScores = [
        {
          id: "h_older",
          title: "React Older",
          url: "https://older.com",
          lastVisitTime: 1000,
        },
        {
          id: "h_newer",
          title: "React Newer",
          url: "https://newer.com",
          lastVisitTime: 5000,
        },
      ];

      const results = getSpotlightResults({
        tabs: [],
        bookmarks: [],
        history: historyWithScores,
        searchSuggestions: [],
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      expect(results[0].id).toBe("h_newer");
      expect(results[1].id).toBe("h_older");
    });

    it("sorts history items with different match scores", () => {
      const historyItems = [
        {
          id: "h_contains",
          title: "Learn React Today",
          url: "https://learn.com",
          lastVisitTime: 10000,
        },
        {
          id: "h_starts",
          title: "React Official Documentation",
          url: "https://react.dev",
          lastVisitTime: 500,
        },
      ];

      const results = getSpotlightResults({
        tabs: [],
        bookmarks: [],
        history: historyItems,
        searchSuggestions: [],
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      expect(results[0].id).toBe("h_starts");
      expect(results[1].id).toBe("h_contains");
    });

    it("sorts bookmarks by match score", () => {
      const bookmarks = [
        {
          id: "b_contains",
          title: "Learning React from scratch",
          url: "https://example.com/react",
        },
        {
          id: "b_starts",
          title: "React Framework Home",
          url: "https://reactjs.org",
        },
      ];

      const results = getSpotlightResults({
        tabs: [],
        bookmarks,
        history: [],
        searchSuggestions: [],
        rawQuery: "react",
        cleanQuery: "react",
        maxResults: 5,
      });

      expect(results[0].id).toBe("b_starts");
      expect(results[1].id).toBe("b_contains");
    });

    it("matches bookmarks on cleanQuery when rawQuery has bang prefix", () => {
      const results = getSpotlightResults({
        tabs: [],
        bookmarks: [
          {
            id: "b_clean",
            title: "TypeScript Handbook",
            url: "https://ts.dev",
          },
        ],
        history: [],
        searchSuggestions: [],
        rawQuery: "!g typescript",
        cleanQuery: "typescript",
        maxResults: 5,
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("TypeScript Handbook");
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

    it("does not fetch open tabs when isOpen is false", () => {
      const sendMock = vi.fn();
      (chrome.runtime.sendMessage as any) = sendMock;
      const { result } = renderHook(() => useOpenTabs(false));
      expect(result.current.tabs).toEqual([]);
      expect(sendMock).not.toHaveBeenCalled();
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

    it("returns empty array when isOpen is false or enabled is false", () => {
      const { result: closedResult } = renderHook(() =>
        useBookmarks({
          isOpen: false,
          rawQuery: "test",
          cleanQuery: "test",
          enabled: true,
        }),
      );
      expect(closedResult.current).toEqual([]);

      const { result: disabledResult } = renderHook(() =>
        useBookmarks({
          isOpen: true,
          rawQuery: "test",
          cleanQuery: "test",
          enabled: false,
        }),
      );
      expect(disabledResult.current).toEqual([]);
    });

    it("debounces fetch when query is provided", async () => {
      vi.useFakeTimers();
      const sendMock = vi.fn();
      (chrome.runtime.sendMessage as any) = sendMock;

      renderHook(() =>
        useBookmarks({
          isOpen: true,
          rawQuery: "query",
          cleanQuery: "query",
          enabled: true,
        }),
      );

      expect(sendMock).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(sendMock).toHaveBeenCalledWith(
        { type: MESSAGE_TYPES.GET_BOOKMARKS, query: "query" },
        expect.any(Function),
      );
      vi.useRealTimers();
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

    it("returns empty array when disabled or closed", () => {
      const { result } = renderHook(() =>
        useHistory({ isOpen: false, cleanQuery: "test", enabled: false }),
      );
      expect(result.current).toEqual([]);
    });

    it("debounces fetch when cleanQuery is provided", () => {
      vi.useFakeTimers();
      const sendMock = vi.fn();
      (chrome.runtime.sendMessage as any) = sendMock;

      renderHook(() =>
        useHistory({ isOpen: true, cleanQuery: "delayed", enabled: true }),
      );

      expect(sendMock).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(sendMock).toHaveBeenCalledWith(
        { type: MESSAGE_TYPES.GET_HISTORY, query: "delayed" },
        expect.any(Function),
      );
      vi.useRealTimers();
    });
  });

  describe("useSearchSuggestions", () => {
    it("debounces and fetches search suggestions", async () => {
      vi.useFakeTimers();
      (chrome.runtime.sendMessage as any).mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS && cb) {
            cb({
              suggestions: [
                {
                  id: "res1",
                  title: "res1",
                  url: "https://s.com",
                  query: "res1",
                },
              ],
            });
          }
        },
      );

      const { result } = renderHook(() =>
        useSearchSuggestions({
          isOpen: true,
          cleanQuery: "react",
          validUrl: null,
          provider: "google",
        }),
      );

      expect(result.current).toEqual([]);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("res1");
      vi.useRealTimers();
    });

    it("returns empty suggestions when closed or query is empty or validUrl is truthy", () => {
      const { result } = renderHook(() =>
        useSearchSuggestions({
          isOpen: false,
          cleanQuery: "   ",
          validUrl: "https://google.com",
        }),
      );
      expect(result.current).toEqual([]);
    });

    it("clears debounce timer on unmount", () => {
      vi.useFakeTimers();
      const sendMock = vi.fn();
      (globalThis as any).chrome.runtime.sendMessage = sendMock;

      const { unmount } = renderHook(() =>
        useSearchSuggestions({
          isOpen: true,
          cleanQuery: "react",
          validUrl: null,
          provider: "google",
        }),
      );

      unmount();
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(sendMock).not.toHaveBeenCalled();
      vi.useRealTimers();
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

    it("listens for OPEN_SPOTLIGHT_WITH_URL message", () => {
      const setIsOpen = vi.fn();
      const onOpenWithUrl = vi.fn();

      let messageListener: any;
      (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
        messageListener = fn;
      });

      renderHook(() =>
        useSpotlightShortcut({
          setIsOpen,
          onToggle: vi.fn(),
          onOpenWithUrl,
        }),
      );

      act(() => {
        messageListener({
          type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
          url: "https://prefill.com",
        });
      });

      expect(onOpenWithUrl).toHaveBeenCalledWith("https://prefill.com");
      expect(setIsOpen).toHaveBeenCalledWith(true);
    });

    it("handles Alt+L keydown shortcut on window", () => {
      const setIsOpen = vi.fn();
      const onOpenWithUrl = vi.fn();

      renderHook(() =>
        useSpotlightShortcut({
          setIsOpen,
          onToggle: vi.fn(),
          onOpenWithUrl,
        }),
      );

      const event = new KeyboardEvent("keydown", {
        key: "l",
        code: "KeyL",
        altKey: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(onOpenWithUrl).toHaveBeenCalled();
      expect(setIsOpen).toHaveBeenCalledWith(true);
    });
  });

  describe("useSpotlightScrollLock", () => {
    it("locks background input and closes on Escape", () => {
      const setIsOpen = vi.fn();
      const overlayRef = {
        current: document.createElement("dialog"),
      };

      const { unmount } = renderHook(() =>
        useSpotlightScrollLock({
          isOpen: true,
          overlayRef,
          setIsOpen,
        }),
      );

      // Background click
      const clickEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
      document.dispatchEvent(clickEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();

      // Escape keydown
      const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      document.dispatchEvent(escEvent);
      expect(setIsOpen).toHaveBeenCalledWith(false);

      // Wheel event on overlay backdrop outside container
      const overlayEl = overlayRef.current;
      document.body.appendChild(overlayEl);

      const wheelEvent = new Event("wheel", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultWheelSpy = vi.spyOn(wheelEvent, "preventDefault");
      const stopPropSpy = vi.spyOn(wheelEvent, "stopPropagation");
      overlayEl.dispatchEvent(wheelEvent);

      expect(preventDefaultWheelSpy).toHaveBeenCalled();
      expect(stopPropSpy).toHaveBeenCalled();

      document.body.removeChild(overlayEl);
      unmount();
    });
  });
});
