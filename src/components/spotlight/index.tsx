import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { SearchIcon } from "lucide-react";
import styles from "./spotlight.module.css";
import { getRedirectUrl } from "@/lib/redirect";
import { ActiveTabs } from "./components/active-tabs";
import type { TabItemData } from "./components/tab-item";

type TabsResponse = {
  tabs?: TabItemData[];
};

type SwitchTabResponse = {
  success?: boolean;
};

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState<TabItemData[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

    chrome.runtime.sendMessage({ type: "GET_OPEN_TABS" }, (response?: TabsResponse) => {
      setTabs(response?.tabs ?? []);
    });
  }, [isOpen]);

  const normalizedSearchValue = searchValue.trim().toLowerCase();
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

  useEffect(() => {
    setSelectedTabIndex(0);
  }, [searchValue]);

  useEffect(() => {
    if (selectedTabIndex >= filteredTabs.length) {
      setSelectedTabIndex(Math.max(filteredTabs.length - 1, 0));
    }
  }, [filteredTabs.length, selectedTabIndex]);

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

        return (currentIndex + 1) % filteredTabs.length;
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
          (currentIndex - 1 + filteredTabs.length) % filteredTabs.length
        );
      });
      return;
    }

    if (e.key === "Enter" && inputRef.current) {
      const selectedTab = filteredTabs[selectedTabIndex];

      if (selectedTab) {
        handleSelectTab(selectedTab);
        return;
      }

      const redirectUrl = getRedirectUrl(searchValue);
      window.open(redirectUrl, "_blank");
      setIsOpen(false);
      setSearchValue("");
      setSelectedTabIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.spotlight_overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.spotlight_container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.search_header}>
          <SearchIcon size={24} className={styles.search_icon} />
          <input
            ref={inputRef}
            autoFocus={true}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            name="search"
            type="text"
            value={searchValue}
            className={styles.search_input}
            placeholder="Search or Enter URL...."
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleKeydown}
          />
        </div>
        <ActiveTabs
          tabs={filteredTabs}
          selectedIndex={selectedTabIndex}
          onSelectTab={handleSelectTab}
        />
      </div>
    </div>
  );
};
