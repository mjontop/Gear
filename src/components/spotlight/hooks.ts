import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  MESSAGE_TYPES,
  SEARCH_SUGGESTION_DEBOUNCE_MS,
  type SearchProviderId,
} from "@/constants";
import type { BookmarkItem, HistoryItem } from "@/background-tasks/types";
import type { OpenTabData, SearchSuggestionResponseData } from "./results";

export type { OpenTabData, SearchSuggestionResponseData };
export { getMatchScore, getSpotlightResults, normalizeUrl } from "./results";
export {
  useSpotlightScrollLock,
  type UseSpotlightScrollLockParams,
} from "./scroll-lock";

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

export type UseSpotlightShortcutParams = {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onToggle: () => void;
  onOpenWithUrl?: (url: string) => void;
};

export type UseSearchSuggestionsParams = {
  isOpen: boolean;
  cleanQuery: string;
  validUrl: string | null;
  provider?: SearchProviderId;
};

export const useSpotlightShortcut = ({
  setIsOpen,
  onToggle,
  onOpenWithUrl,
}: UseSpotlightShortcutParams) => {
  useEffect(() => {
    const handleMessage = (message: { type?: string; url?: string }) => {
      if (message.type === MESSAGE_TYPES.TOGGLE_SPOTLIGHT) {
        onToggle();
        setIsOpen((prev) => !prev);
        return;
      }

      if (message.type === MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL) {
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
      { type: MESSAGE_TYPES.GET_OPEN_TABS },
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
        { type: MESSAGE_TYPES.GET_BOOKMARKS, query: queryToSearch },
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
        { type: MESSAGE_TYPES.GET_HISTORY, query: cleanQuery },
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
        {
          type: MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS,
          query: trimmedClean,
          provider,
        },
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
