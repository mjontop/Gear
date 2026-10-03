import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSpotlightShortcut,
  useOpenTabs,
  useBookmarks,
  useHistory,
  useSearchSuggestions,
} from "@/components/spotlight/hooks";
import { MESSAGE_TYPES } from "@/constants";

describe("Spotlight Data Hooks", () => {
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

      expect(result.current).toEqual([
        {
          id: "res1",
          title: "res1",
          url: "https://s.com",
          query: "res1",
        },
      ]);
      vi.useRealTimers();
    });

    it("returns empty suggestions when closed or query is empty or validUrl is truthy", () => {
      const { result: closedResult } = renderHook(() =>
        useSearchSuggestions({
          isOpen: false,
          cleanQuery: "react",
          validUrl: null,
          provider: "google",
        }),
      );
      expect(closedResult.current).toEqual([]);

      const { result: emptyQueryResult } = renderHook(() =>
        useSearchSuggestions({
          isOpen: true,
          cleanQuery: "",
          validUrl: null,
          provider: "google",
        }),
      );
      expect(emptyQueryResult.current).toEqual([]);

      const { result: validUrlResult } = renderHook(() =>
        useSearchSuggestions({
          isOpen: true,
          cleanQuery: "https://react.dev",
          validUrl: "https://react.dev",
          provider: "google",
        }),
      );
      expect(validUrlResult.current).toEqual([]);
    });

    it("clears debounce timer on unmount", () => {
      vi.useFakeTimers();
      const sendMock = vi.fn();
      (chrome.runtime.sendMessage as any) = sendMock;

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
});
