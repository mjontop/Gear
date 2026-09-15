import { useEffect, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  SEARCH_RESULT_PRIORITY,
  SEARCH_SUGGESTION_DEBOUNCE_MS,
} from "@/constants";
import type { ActiveTabData } from "./components/active-tabs";
import type {
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

type SearchSuggestionsResponse = {
  suggestions?: SearchSuggestionResponseData[];
};

type UseSpotlightShortcutParams = {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onToggle: () => void;
};

type UseSearchSuggestionsParams = {
  isOpen: boolean;
  normalizedSearchValue: string;
  searchValue: string;
  validUrl: string | null;
};

type UseSpotlightScrollLockParams = {
  isOpen: boolean;
  overlayRef: RefObject<HTMLDialogElement | null>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const useSpotlightShortcut = ({
  setIsOpen,
  onToggle,
}: UseSpotlightShortcutParams) => {
  useEffect(() => {
    const handleMessage = (message: { type?: string }) => {
      if (message.type === "TOGGLE_SPOTLIGHT") {
        onToggle();
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onToggle, setIsOpen]);
};

export const useOpenTabs = () => {
  const [tabs, setTabs] = useState<OpenTabData[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "GET_OPEN_TABS" },
      (response?: TabsResponse) => {
        setTabs(response?.tabs ?? []);
      },
    );
  }, []);

  return { tabs };
};

export const useSearchSuggestions = ({
  isOpen,
  normalizedSearchValue,
  searchValue,
  validUrl,
}: UseSearchSuggestionsParams) => {
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestionResponseData[]
  >([]);

  useEffect(() => {
    if (!isOpen || !normalizedSearchValue || validUrl) {
      setSearchSuggestions([]);
      return;
    }

    let isCurrentSearch = true;
    const timeoutId = window.setTimeout(() => {
      chrome.runtime.sendMessage(
        { type: "GET_SEARCH_SUGGESTIONS", query: searchValue.trim() },
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
  }, [isOpen, normalizedSearchValue, searchValue, validUrl]);

  return searchSuggestions;
};

export const useSpotlightScrollLock = ({
  isOpen,
  overlayRef,
  setIsOpen,
}: UseSpotlightScrollLockParams) => {
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight =
      Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const previousBodyWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlScrollbarGutter =
      document.documentElement.style.scrollbarGutter;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    }
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

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

    const isSpotlightEvent = (event: Event) => {
      const overlay = overlayRef.current;
      return overlay ? event.composedPath().includes(overlay) : false;
    };

    const stopBackgroundInput = (event: Event) => {
      if (isSpotlightEvent(event)) return;

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
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.left = previousBodyLeft;
      document.body.style.right = previousBodyRight;
      document.body.style.width = previousBodyWidth;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.scrollbarGutter =
        previousHtmlScrollbarGutter;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior =
        previousHtmlOverscroll;
      window.scrollTo(0, scrollY);

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

export const getSpotlightResults = (
  tabs: OpenTabData[],
  searchSuggestions: SearchSuggestionResponseData[],
  normalizedSearchValue: string,
  maxResults: number,
): SpotlightResultData[] => {
  const openTabResults: ActiveTabData[] = tabs
    .filter((tab) => {
      if (!normalizedSearchValue) {
        return true;
      }

      return (
        tab.title.toLowerCase().includes(normalizedSearchValue) ||
        tab.url.toLowerCase().includes(normalizedSearchValue)
      );
    })
    .map((tab) => ({
      ...tab,
      kind: "open-tab" as const,
      priority: SEARCH_RESULT_PRIORITY.OPEN_TAB,
    }));
  const searchSuggestionResults: SearchSuggestionData[] = searchSuggestions.map(
    (suggestion) => ({
      ...suggestion,
      kind: "search-suggestion" as const,
      priority: SEARCH_RESULT_PRIORITY.SEARCH_SUGGESTION,
    }),
  );

  return [...openTabResults, ...searchSuggestionResults]
    .sort((firstResult, secondResult) => {
      return firstResult.priority - secondResult.priority;
    })
    .slice(0, maxResults);
};
