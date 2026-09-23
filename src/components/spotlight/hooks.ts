import { useEffect, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  SEARCH_PROVIDERS,
  SEARCH_RESULT_PRIORITY,
  SEARCH_SUGGESTION_DEBOUNCE_MS,
  type SearchProviderId,
} from "@/constants";
import type { BookmarkItem, HistoryItem } from "@/background-tasks/types";
import type {
  ActiveTabData,
  BookmarkData,
  DirectUrlData,
  HistoryData,
  SearchSuggestionData,
  SpotlightResultData,
} from "./components/active-tabs";

export type OpenTabData = Omit<ActiveTabData, "kind" | "priority">;

export type SearchSuggestionResponseData = Omit<
  SearchSuggestionData,
  "kind" | "priority"
>;

type TabsResponse = {
  tabs?: OpenTabData[];
};

type BookmarksResponse = {
  bookmarks?: BookmarkItem[];
};

type HistoryResponse = {
  history?: HistoryItem[];
};

type SearchSuggestionsResponse = {
  suggestions?: SearchSuggestionResponseData[];
};

type UseSpotlightShortcutParams = {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onToggle: () => void;
  onOpenWithUrl?: (url: string) => void;
};

type UseSearchSuggestionsParams = {
  isOpen: boolean;
  cleanQuery: string;
  validUrl: string | null;
  provider?: SearchProviderId;
};

type UseSpotlightScrollLockParams = {
  isOpen: boolean;
  overlayRef: RefObject<HTMLDialogElement | null>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const useSpotlightShortcut = ({
  setIsOpen,
  onToggle,
  onOpenWithUrl,
}: UseSpotlightShortcutParams) => {
  useEffect(() => {
    const handleMessage = (message: { type?: string; url?: string }) => {
      if (message.type === "TOGGLE_SPOTLIGHT") {
        onToggle();
        setIsOpen((prev) => !prev);
        return;
      }

      if (message.type === "OPEN_SPOTLIGHT_WITH_URL") {
        const targetUrl = message.url || window.location.href;
        onOpenWithUrl?.(targetUrl);
        setIsOpen(true);
      }
    };

    const handleKeydown = (e: globalThis.KeyboardEvent) => {
      if (
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        (e.key === "l" || e.key === "L" || e.code === "KeyL")
      ) {
        e.preventDefault();
        e.stopPropagation();
        const targetUrl = window.location.href;
        onOpenWithUrl?.(targetUrl);
        setIsOpen(true);
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }
    window.addEventListener("keydown", handleKeydown, { capture: true });

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      window.removeEventListener("keydown", handleKeydown, { capture: true });
    };
  }, [onToggle, setIsOpen, onOpenWithUrl]);
};

export const useOpenTabs = (isOpen?: boolean) => {
  const [tabs, setTabs] = useState<OpenTabData[]>([]);

  useEffect(() => {
    if (isOpen === false) return;

    chrome.runtime.sendMessage(
      { type: "GET_OPEN_TABS" },
      (response?: TabsResponse) => {
        setTabs(response?.tabs ?? []);
      },
    );
  }, [isOpen]);

  return { tabs };
};

export const useBookmarks = ({
  isOpen,
  rawQuery,
  cleanQuery,
  enabled = true,
}: {
  isOpen: boolean;
  rawQuery: string;
  cleanQuery: string;
  enabled?: boolean;
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    if (!isOpen || !enabled) {
      setBookmarks([]);
      return;
    }

    let isCurrent = true;
    const queryToSearch = cleanQuery || rawQuery;

    const fetchBookmarks = () => {
      chrome.runtime.sendMessage(
        { type: "GET_BOOKMARKS", query: queryToSearch },
        (response?: BookmarksResponse) => {
          if (!isCurrent) return;
          setBookmarks(response?.bookmarks ?? []);
        },
      );
    };

    if (!queryToSearch) {
      fetchBookmarks();
      return () => {
        isCurrent = false;
      };
    }

    const timeoutId = window.setTimeout(
      fetchBookmarks,
      SEARCH_SUGGESTION_DEBOUNCE_MS,
    );

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, enabled, rawQuery, cleanQuery]);

  return bookmarks;
};

export const useHistory = ({
  isOpen,
  cleanQuery,
  enabled = true,
}: {
  isOpen: boolean;
  cleanQuery: string;
  enabled?: boolean;
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!isOpen || !enabled) {
      setHistory([]);
      return;
    }

    let isCurrent = true;

    const fetchHistory = () => {
      chrome.runtime.sendMessage(
        { type: "GET_HISTORY", query: cleanQuery },
        (response?: HistoryResponse) => {
          if (!isCurrent) return;
          setHistory(response?.history ?? []);
        },
      );
    };

    if (!cleanQuery) {
      fetchHistory();
      return () => {
        isCurrent = false;
      };
    }

    const timeoutId = window.setTimeout(
      fetchHistory,
      SEARCH_SUGGESTION_DEBOUNCE_MS,
    );

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, enabled, cleanQuery]);

  return history;
};

export const useSearchSuggestions = ({
  isOpen,
  cleanQuery,
  validUrl,
  provider,
}: UseSearchSuggestionsParams) => {
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestionResponseData[]
  >([]);

  useEffect(() => {
    const trimmedClean = cleanQuery.trim();
    if (!isOpen || !trimmedClean || validUrl) {
      setSearchSuggestions([]);
      return;
    }

    let isCurrentSearch = true;
    const timeoutId = window.setTimeout(() => {
      chrome.runtime.sendMessage(
        { type: "GET_SEARCH_SUGGESTIONS", query: trimmedClean, provider },
        (response?: SearchSuggestionsResponse) => {
          if (!isCurrentSearch) return;

          setSearchSuggestions(response?.suggestions ?? []);
        },
      );
    }, SEARCH_SUGGESTION_DEBOUNCE_MS);

    return () => {
      isCurrentSearch = false;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, cleanQuery, validUrl, provider]);

  return searchSuggestions;
};

export const useSpotlightScrollLock = ({
  isOpen,
  overlayRef,
  setIsOpen,
}: UseSpotlightScrollLockParams) => {
  useEffect(() => {
    if (!isOpen) return;

    const blockedEvents = [
      "click",
      "contextmenu",
      "dblclick",
      "mousedown",
      "mouseup",
      "mousemove",
      "pointerdown",
      "pointerup",
      "pointermove",
      "pointercancel",
      "touchstart",
      "touchend",
      "touchmove",
      "wheel",
      "drag",
      "dragstart",
      "dragover",
      "drop",
    ];

    const isInsideSpotlightContainer = (event: Event) => {
      const path = event.composedPath();
      return path.some(
        (target) =>
          target instanceof HTMLElement &&
          target.classList.contains("spotlight_container"),
      );
    };

    const isSpotlightEvent = (event: Event) => {
      const overlay = overlayRef.current;
      return overlay ? event.composedPath().includes(overlay) : false;
    };

    const stopBackgroundInput = (event: Event) => {
      if (isSpotlightEvent(event)) {
        if (
          (event.type === "wheel" || event.type === "touchmove") &&
          !isInsideSpotlightContainer(event)
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const stopBackgroundKeyboardInput = (event: globalThis.KeyboardEvent) => {
      if (isSpotlightEvent(event)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const listenerOptions = { capture: true, passive: false };

    blockedEvents.forEach((eventName) => {
      document.addEventListener(
        eventName,
        stopBackgroundInput,
        listenerOptions,
      );
      window.addEventListener(eventName, stopBackgroundInput, listenerOptions);
    });
    document.addEventListener(
      "keydown",
      stopBackgroundKeyboardInput,
      listenerOptions,
    );
    window.addEventListener(
      "keydown",
      stopBackgroundKeyboardInput,
      listenerOptions,
    );

    return () => {
      blockedEvents.forEach((eventName) => {
        document.removeEventListener(
          eventName,
          stopBackgroundInput,
          listenerOptions,
        );
        window.removeEventListener(
          eventName,
          stopBackgroundInput,
          listenerOptions,
        );
      });
      document.removeEventListener(
        "keydown",
        stopBackgroundKeyboardInput,
        listenerOptions,
      );
      window.removeEventListener(
        "keydown",
        stopBackgroundKeyboardInput,
        listenerOptions,
      );
    };
  }, [isOpen, overlayRef, setIsOpen]);
};

const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
};

const getMatchScore = (
  title: string,
  url: string,
  query: string,
): number => {
  if (!query) return 0;
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  if (lowerTitle.startsWith(query)) return 3;
  if (lowerTitle.includes(query)) return 2;
  if (lowerUrl.includes(query)) return 1;
  return 0;
};

export const getSpotlightResults = ({
  tabs,
  bookmarks,
  history,
  searchSuggestions,
  rawQuery,
  cleanQuery,
  validUrl,
  searchProvider = DEFAULT_SEARCH_PROVIDER_ID,
  maxResults,
}: {
  tabs: OpenTabData[];
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  searchSuggestions: SearchSuggestionResponseData[];
  rawQuery: string;
  cleanQuery: string;
  validUrl?: string | null;
  searchProvider?: SearchProviderId;
  maxResults: number;
}): SpotlightResultData[] => {
  const normalizedClean = cleanQuery.trim().toLowerCase();
  const normalizedRaw = rawQuery.trim().toLowerCase();
  const seenUrls = new Set<string>();

  // 1. Open Tabs (searched using cleanQuery or rawQuery, priority 0)
  const openTabResults: ActiveTabData[] = tabs
    .filter((tab) => {
      if (!normalizedClean && !normalizedRaw) {
        return true;
      }
      const q = normalizedClean || normalizedRaw;
      return (
        tab.title.toLowerCase().includes(q) ||
        tab.url.toLowerCase().includes(q)
      );
    })
    .sort((firstTab, secondTab) => {
      const q = normalizedClean || normalizedRaw;
      const scoreA = getMatchScore(firstTab.title, firstTab.url, q);
      const scoreB = getMatchScore(secondTab.title, secondTab.url, q);
      return scoreB - scoreA;
    })
    .map((tab) => {
      seenUrls.add(normalizeUrl(tab.url));
      return {
        ...tab,
        kind: "open-tab" as const,
        priority: SEARCH_RESULT_PRIORITY.OPEN_TAB,
      };
    });

  // 2. Bookmarks (matches either rawQuery e.g. !f OR cleanQuery, priority 1)
  const bookmarkResults: BookmarkData[] = bookmarks
    .filter((bookmark) => {
      const normUrl = normalizeUrl(bookmark.url);
      if (seenUrls.has(normUrl)) {
        return false;
      }

      if (!normalizedClean && !normalizedRaw) {
        return true;
      }

      const lowerTitle = bookmark.title.toLowerCase();
      const lowerUrl = bookmark.url.toLowerCase();

      const matchesRaw =
        Boolean(normalizedRaw) &&
        (lowerTitle.includes(normalizedRaw) || lowerUrl.includes(normalizedRaw));

      const matchesClean =
        Boolean(normalizedClean) &&
        (lowerTitle.includes(normalizedClean) ||
          lowerUrl.includes(normalizedClean));

      return matchesRaw || matchesClean;
    })
    .sort((firstBm, secondBm) => {
      const scoreRawA = getMatchScore(firstBm.title, firstBm.url, normalizedRaw);
      const scoreRawB = getMatchScore(secondBm.title, secondBm.url, normalizedRaw);
      const scoreCleanA = getMatchScore(
        firstBm.title,
        firstBm.url,
        normalizedClean,
      );
      const scoreCleanB = getMatchScore(
        secondBm.title,
        secondBm.url,
        normalizedClean,
      );

      const bestA = Math.max(scoreRawA, scoreCleanA);
      const bestB = Math.max(scoreRawB, scoreCleanB);
      return bestB - bestA;
    })
    .map((bookmark) => {
      seenUrls.add(normalizeUrl(bookmark.url));
      return {
        ...bookmark,
        kind: "bookmark" as const,
        priority: SEARCH_RESULT_PRIORITY.BOOKMARK,
      };
    });

  // 3. Browsing History (searched using cleanQuery, priority 2)
  const historyResults: HistoryData[] = history
    .filter((item) => {
      const normUrl = normalizeUrl(item.url);
      if (seenUrls.has(normUrl)) {
        return false;
      }

      if (!normalizedClean) {
        return false;
      }

      const lowerTitle = item.title.toLowerCase();
      const lowerUrl = item.url.toLowerCase();
      return (
        lowerTitle.includes(normalizedClean) ||
        lowerUrl.includes(normalizedClean)
      );
    })
    .sort((firstItem, secondItem) => {
      const scoreA = getMatchScore(
        firstItem.title,
        firstItem.url,
        normalizedClean,
      );
      const scoreB = getMatchScore(
        secondItem.title,
        secondItem.url,
        normalizedClean,
      );

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return (secondItem.lastVisitTime ?? 0) - (firstItem.lastVisitTime ?? 0);
    })
    .map((item) => {
      seenUrls.add(normalizeUrl(item.url));
      return {
        ...item,
        kind: "history" as const,
        priority: SEARCH_RESULT_PRIORITY.HISTORY,
      };
    });

  // 4. Search Suggestions (priority 3)
  const searchSuggestionResults: SearchSuggestionData[] = searchSuggestions.map(
    (suggestion) => ({
      ...suggestion,
      kind: "search-suggestion" as const,
      priority: SEARCH_RESULT_PRIORITY.SEARCH_SUGGESTION,
    }),
  );

  // If query is empty, return top open tabs and top bookmarks
  if (!normalizedRaw) {
    return [...openTabResults, ...bookmarkResults].slice(0, maxResults);
  }

  // Combined local results: Tabs -> Bookmarks -> History
  const localResults = [
    ...openTabResults,
    ...bookmarkResults,
    ...historyResults,
  ];

  if (validUrl) {
    const directUrlResult: DirectUrlData = {
      id: validUrl,
      title: validUrl,
      url: validUrl,
      kind: "direct-url",
      priority: SEARCH_RESULT_PRIORITY.DIRECT_URL,
    };

    const provider =
      SEARCH_PROVIDERS[searchProvider] ||
      SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID];

    const searchUrlResult: SearchSuggestionData = {
      id: `search-for-${rawQuery}`,
      title: rawQuery,
      url: provider.searchUrl.replace("%s", encodeURIComponent(rawQuery)),
      query: rawQuery,
      kind: "search-suggestion",
      priority: SEARCH_RESULT_PRIORITY.SEARCH_SUGGESTION,
    };

    const remainingSlots = Math.max(0, maxResults - 2);
    const selectedLocal = localResults.slice(0, remainingSlots);

    return [directUrlResult, searchUrlResult, ...selectedLocal];
  }

  if (searchSuggestionResults.length > 0) {
    const reservedSuggestionSlots = Math.min(2, searchSuggestionResults.length);
    const maxLocalSlots = Math.max(1, maxResults - reservedSuggestionSlots);
    const selectedLocal = localResults.slice(0, maxLocalSlots);
    const remainingSlots = maxResults - selectedLocal.length;
    const selectedSuggestions = searchSuggestionResults.slice(
      0,
      remainingSlots,
    );

    return [...selectedLocal, ...selectedSuggestions];
  }

  return localResults.slice(0, maxResults);
};
