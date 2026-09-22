import { useState, useRef, KeyboardEvent } from "react";
import {
  DEFAULT_SEARCH_PROVIDER_ID,
  MAX_SPOTLIGHT_RESULTS,
  SEARCH_PROVIDERS,
} from "@/constants";
import { parseQueryWithBangs } from "@/lib/bangs";
import { getRedirectUrl, isValidUrl } from "@/lib/redirect";
import type { ActiveTabData } from "./components/active-tabs";
import type {
  SearchSuggestionData,
  SpotlightResultData,
} from "./components/active-tabs";
import { SpotlightView } from "./components/spotlight-view";
import { useSpotlightPreferences } from "@/lib/preferences";
import {
  getSpotlightResults,
  useBookmarks,
  useHistory,
  useOpenTabs,
  useSearchSuggestions,
  useSpotlightScrollLock,
  useSpotlightShortcut,
} from "./hooks";

type SwitchTabResponse = {
  success?: boolean;
};

const getClampedTabIndex = (index: number, tabCount: number) => {
  if (tabCount === 0) return 0;

  return Math.min(index, tabCount - 1);
};

const formatQueryWithBang = (query: string, bang: string | null): string => {
  if (bang) {
    return `${bang} ${query}`;
  }
  return query;
};

const getAutocompletedText = (
  result: SpotlightResultData,
  bang: string | null,
): string => {
  if (result.kind === "search-suggestion") {
    return formatQueryWithBang(result.query, bang);
  }

  return result.title;
};

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDialogElement>(null);
  const validUrl = isValidUrl(searchValue.trim());

  const { rawQuery, cleanQuery, bang } = parseQueryWithBangs(searchValue);

  const { preferences } = useSpotlightPreferences();
  const { tabs } = useOpenTabs(isOpen);
  const bookmarks = useBookmarks({
    isOpen,
    rawQuery,
    cleanQuery,
    enabled: preferences.includeBookmarks,
  });
  const history = useHistory({
    isOpen,
    cleanQuery,
    enabled: preferences.includeHistory,
  });
  const searchSuggestions = useSearchSuggestions({
    isOpen,
    cleanQuery,
    validUrl,
    provider: preferences.searchProvider,
  });

  const resetSpotlight = () => {
    setSearchValue("");
    setSelectedTabIndex(0);
  };

  useSpotlightShortcut({
    setIsOpen,
    onToggle: resetSpotlight,
  });
  useSpotlightScrollLock({ isOpen, overlayRef, setIsOpen });

  const spotlightResults: SpotlightResultData[] = getSpotlightResults({
    tabs,
    bookmarks,
    history,
    searchSuggestions,
    rawQuery,
    cleanQuery,
    validUrl,
    searchProvider: preferences.searchProvider,
    maxResults: MAX_SPOTLIGHT_RESULTS,
  });

  const visibleSelectedTabIndex = getClampedTabIndex(
    selectedTabIndex,
    spotlightResults.length,
  );

  const openUrl = (url: string) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "OPEN_URL", url });
    } else {
      window.open(url, "_blank", "noopener");
    }
    setIsOpen(false);
    resetSpotlight();
  };

  const handleSelectTab = (tab: ActiveTabData) => {
    chrome.runtime.sendMessage(
      { type: "SWITCH_TO_TAB", tabId: tab.id, windowId: tab.windowId },
      (response?: SwitchTabResponse) => {
        if (response?.success) {
          setIsOpen(false);
          resetSpotlight();
        }
      },
    );
  };

  const handleSearchSuggestion = (suggestion: SearchSuggestionData) => {
    if (bang) {
      const targetQuery = formatQueryWithBang(suggestion.query, bang);
      const { cleanQuery: parsedClean, bangUrl } =
        parseQueryWithBangs(targetQuery);
      if (bangUrl) {
        openUrl(bangUrl.replace("%s", encodeURIComponent(parsedClean)));
        return;
      }
    }

    const provider =
      SEARCH_PROVIDERS[preferences.searchProvider] ||
      SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID];
    const searchUrl =
      suggestion.url ||
      provider.searchUrl.replace("%s", encodeURIComponent(suggestion.query));

    openUrl(searchUrl);
  };

  const handleSelectResult = (result: SpotlightResultData) => {
    if (result.kind === "open-tab") {
      handleSelectTab(result);
      return;
    }

    if (result.kind === "direct-url") {
      openUrl(result.url);
      return;
    }

    if (result.kind === "bookmark" || result.kind === "history") {
      openUrl(result.url);
      return;
    }

    handleSearchSuggestion(result);
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      resetSpotlight();
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

    if (e.key === "Tab") {
      e.preventDefault();
      const selectedResult = spotlightResults[visibleSelectedTabIndex];
      if (!selectedResult) {
        return;
      }

      const textToInsert = getAutocompletedText(selectedResult, bang);

      setSearchValue(textToInsert);
      setSelectedTabIndex(0);

      if (inputRef.current) {
        inputRef.current.value = textToInsert;
        inputRef.current.focus();
        const len = textToInsert.length;
        inputRef.current.setSelectionRange(len, len);
      }

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = textToInsert.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
      return;
    }

    if (e.key === "Enter" && inputRef.current) {
      const selectedResult = spotlightResults[visibleSelectedTabIndex];

      if (selectedResult) {
        handleSelectResult(selectedResult);
        return;
      }

      const redirectUrl = getRedirectUrl(
        searchValue,
        preferences.searchProvider,
      );
      openUrl(redirectUrl);
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
      enableBackgroundBlur={preferences.enableBackgroundBlur}
      onClose={() => {
        setIsOpen(false);
        resetSpotlight();
      }}
      onSearchChange={(value) => {
        setSearchValue(value);
        setSelectedTabIndex(0);
      }}
      onKeyDown={handleKeydown}
      onSelectResult={handleSelectResult}
    />
  );
};
