import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { getRedirectUrl, isValidUrl } from "@/lib/redirect";
import type { TabItemData } from "./components/tab-item";
import { SpotlightView } from "./components/spotlight-view";

type TabsResponse = {
  tabs?: TabItemData[];
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
  const [tabs, setTabs] = useState<TabItemData[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDialogElement>(null);

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

  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const validUrl = isValidUrl(searchValue.trim());
  const filteredTabs = tabs
    .filter((tab) => {
      if (!normalizedSearchValue) {
        return true;
      }

      return (
        tab.title.toLowerCase().includes(normalizedSearchValue) ||
        tab.url.toLowerCase().includes(normalizedSearchValue)
      );
    })
    .slice(0, 5);
  const visibleSelectedTabIndex = getClampedTabIndex(
    selectedTabIndex,
    filteredTabs.length,
  );

  const handleSelectTab = (tab: TabItemData) => {
    chrome.runtime.sendMessage(
      { type: "SWITCH_TO_TAB", tabId: tab.id, windowId: tab.windowId },
      (response?: SwitchTabResponse) => {
        if (response?.success) {
          setIsOpen(false);
        }
      },
    );
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
        if (filteredTabs.length === 0) {
          return 0;
        }

        return (
          (getClampedTabIndex(currentIndex, filteredTabs.length) + 1) %
          filteredTabs.length
        );
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedTabIndex((currentIndex) => {
        if (filteredTabs.length === 0) {
          return 0;
        }

        return (
          (getClampedTabIndex(currentIndex, filteredTabs.length) -
            1 +
            filteredTabs.length) %
          filteredTabs.length
        );
      });
      return;
    }

    if (e.key === "Enter" && inputRef.current) {
      const selectedTab = filteredTabs[visibleSelectedTabIndex];

      if (selectedTab) {
        handleSelectTab(selectedTab);
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
      filteredTabs={filteredTabs}
      selectedTabIndex={visibleSelectedTabIndex}
      onClose={() => setIsOpen(false)}
      onSearchChange={(value) => {
        setSearchValue(value);
        setSelectedTabIndex(0);
      }}
      onKeyDown={handleKeydown}
      onSelectTab={handleSelectTab}
    />
  );
};
