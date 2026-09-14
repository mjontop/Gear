import { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  MAX_SPOTLIGHT_RESULTS,
  SEARCH_RESULT_PRIORITY,
  SEARCH_SUGGESTION_DEBOUNCE_MS,
} from "@/constants";
import { getRedirectUrl, isValidUrl } from "@/lib/redirect";
import type { ActiveTabData } from "./components/active-tabs";
import type {
  SearchSuggestionData,
  SpotlightResultData,
} from "./components/active-tabs";
import { SpotlightView } from "./components/spotlight-view";

type OpenTabData = Omit<ActiveTabData, "kind" | "priority">;

type SearchSuggestionResponseData = Omit<
  SearchSuggestionData,
  "kind" | "priority"
>;

type TabsResponse = {
  tabs?: OpenTabData[];
};

type SearchSuggestionsResponse = {
  suggestions?: SearchSuggestionResponseData[];
};

type SwitchTabResponse = {
  success?: boolean;
};

const getClampedTabIndex = (index: number, tabCount: number) => {
  if (tabCount === 0) return 0;

  return Math.min(index, tabCount - 1);
};

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState<OpenTabData[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestionResponseData[]
  >([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDialogElement>(null);
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const validUrl = isValidUrl(searchValue.trim());

  useEffect(() => {
    const handleMessage = (message: { type?: string }) => {
      if (message.type === "TOGGLE_SPOTLIGHT") {
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTabs([]);
      setSearchSuggestions([]);
      setSearchValue("");
      setSelectedTabIndex(0);
      return;
    }

    chrome.runtime.sendMessage(
      { type: "GET_OPEN_TABS" },
      (response?: TabsResponse) => {
        setTabs(response?.tabs ?? []);
      },
    );
  }, [isOpen]);

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
  }, [isOpen]);

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
  const spotlightResults: SpotlightResultData[] = [
    ...openTabResults,
    ...searchSuggestionResults,
  ]
    .sort((firstResult, secondResult) => {
      return firstResult.priority - secondResult.priority;
    })
    .slice(0, MAX_SPOTLIGHT_RESULTS);
  const visibleSelectedTabIndex = getClampedTabIndex(
    selectedTabIndex,
    spotlightResults.length,
  );

  const handleSelectTab = (tab: ActiveTabData) => {
    chrome.runtime.sendMessage(
      { type: "SWITCH_TO_TAB", tabId: tab.id, windowId: tab.windowId },
      (response?: SwitchTabResponse) => {
        if (response?.success) {
          setIsOpen(false);
        }
      },
    );
  };

  const handleSearchSuggestion = (suggestion: SearchSuggestionData) => {
    const redirectUrl = getRedirectUrl(suggestion.query);
    window.open(redirectUrl, "_blank", "noopener");
    setIsOpen(false);
    setSearchValue("");
    setSelectedTabIndex(0);
  };

  const handleSelectResult = (result: SpotlightResultData) => {
    if (result.kind === "open-tab") {
      handleSelectTab(result);
      return;
    }

    handleSearchSuggestion(result);
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchValue("");
      setSelectedTabIndex(0);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedTabIndex((currentIndex) => {
        if (spotlightResults.length === 0) {
          return 0;
        }

        return (
          (getClampedTabIndex(currentIndex, spotlightResults.length) + 1) %
          spotlightResults.length
        );
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedTabIndex((currentIndex) => {
        if (spotlightResults.length === 0) {
          return 0;
        }

        return (
          (getClampedTabIndex(currentIndex, spotlightResults.length) -
            1 +
            spotlightResults.length) %
          spotlightResults.length
        );
      });
      return;
    }

    if (e.key === "Enter" && inputRef.current) {
      const selectedResult = spotlightResults[visibleSelectedTabIndex];

      if (selectedResult) {
        handleSelectResult(selectedResult);
        return;
      }

      const redirectUrl = getRedirectUrl(searchValue);
      window.open(redirectUrl, "_blank", "noopener");
      setIsOpen(false);
      setSearchValue("");
      setSelectedTabIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <SpotlightView
      inputRef={inputRef}
      overlayRef={overlayRef}
      searchValue={searchValue}
      validUrl={validUrl}
      results={spotlightResults}
      selectedTabIndex={visibleSelectedTabIndex}
      onClose={() => setIsOpen(false)}
      onSearchChange={(value) => {
        setSearchValue(value);
        setSelectedTabIndex(0);
      }}
      onKeyDown={handleKeydown}
      onSelectResult={handleSelectResult}
    />
  );
};
