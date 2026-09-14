import { useState, useRef, KeyboardEvent } from "react";
import { MAX_SPOTLIGHT_RESULTS } from "@/constants";
import { getRedirectUrl, isValidUrl } from "@/lib/redirect";
import type { ActiveTabData } from "./components/active-tabs";
import type {
  SearchSuggestionData,
  SpotlightResultData,
} from "./components/active-tabs";
import { SpotlightView } from "./components/spotlight-view";
import {
  getSpotlightResults,
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

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDialogElement>(null);
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const validUrl = isValidUrl(searchValue.trim());

  const { tabs, clearTabs } = useOpenTabs({ isOpen });
  const searchSuggestions = useSearchSuggestions({
    isOpen,
    normalizedSearchValue,
    searchValue,
    validUrl,
  });

  const resetSpotlight = () => {
    clearTabs();
    setSearchValue("");
    setSelectedTabIndex(0);
  };

  useSpotlightShortcut({
    setIsOpen,
    onToggle: resetSpotlight,
  });
  useSpotlightScrollLock({ isOpen, overlayRef, setIsOpen });

  const spotlightResults: SpotlightResultData[] = getSpotlightResults(
    tabs,
    searchSuggestions,
    normalizedSearchValue,
    MAX_SPOTLIGHT_RESULTS,
  );
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
          resetSpotlight();
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

    if (e.key === "Enter" && inputRef.current) {
      const selectedResult = spotlightResults[visibleSelectedTabIndex];

      if (selectedResult) {
        handleSelectResult(selectedResult);
        return;
      }

      const redirectUrl = getRedirectUrl(searchValue);
      window.open(redirectUrl, "_blank", "noopener");
      setIsOpen(false);
      resetSpotlight();
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
