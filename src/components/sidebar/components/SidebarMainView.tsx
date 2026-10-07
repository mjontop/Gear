import {
  ArchiveIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MESSAGE_TYPES } from "@/constants";
import type { BookmarkItem, OpenTab } from "@/background-tasks/types";
import { FaviconImage } from "./FaviconImage";
import { SidebarHeader } from "./SidebarHeader";

export type SidebarMainViewProps = {
  onOpenArchive: () => void;
  onOpenDownloads: () => void;
  onClose: () => void;
};

function normalizeUrl(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;
    if (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

type TabItemRowProps = {
  tab: OpenTab;
  isOpenedBookmark?: boolean;
  onSwitch: (tab: OpenTab) => void;
  onCloseTab: (tabId: number) => void;
};

const TabItemRow = ({
  tab,
  isOpenedBookmark = false,
  onSwitch,
  onCloseTab,
}: TabItemRowProps) => {
  const isCurrent = Boolean(tab.current ?? tab.active);
  return (
    <div
      className={`sidebar_list_item ${
        isOpenedBookmark ? "sidebar_bookmark_item sidebar_bookmark_opened" : ""
      } ${isCurrent ? "sidebar_list_item_current" : ""}`}
    >
      <button
        type="button"
        className="sidebar_tab_main_btn"
        onClick={() => onSwitch(tab)}
      >
        <FaviconImage favIconUrl={tab.favIconUrl} />
        <div className="sidebar_item_info">
          <span className="sidebar_item_title">{tab.title}</span>
          {tab.url && (
            <span className="sidebar_item_domain">
              {tab.url.replace(/^https?:\/\//i, "").split("/")[0]}
            </span>
          )}
        </div>
        {isOpenedBookmark && (
          <BookmarkIcon size={12} className="sidebar_bookmark_tag_icon" />
        )}
      </button>
      <button
        type="button"
        className="sidebar_tab_close_btn"
        aria-label={`Close tab ${tab.title}`}
        title="Close tab"
        onClick={() => onCloseTab(tab.id)}
      >
        <XIcon size={14} />
      </button>
    </div>
  );
};

export const SidebarMainView = ({
  onOpenArchive,
  onOpenDownloads,
  onClose,
}: SidebarMainViewProps) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_BOOKMARKS, query: "" },
        (res) => {
          if (isCurrent && res?.bookmarks) {
            setBookmarks(res.bookmarks);
          }
        },
      );

      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_OPEN_TABS, includeCurrentTab: true },
        (res) => {
          if (isCurrent && res?.tabs) {
            setOpenTabs(res.tabs);
          }
        },
      );
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSwitchTab = (tab: OpenTab) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SWITCH_TO_TAB,
        tabId: tab.id,
        windowId: tab.windowId,
      });
      onClose();
    }
  };

  const handleCloseTab = (tabId: number) => {
    setOpenTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CLOSE_TAB,
        tabId,
      });
    }
  };

  const handleOpenUrl = (url: string) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.OPEN_URL,
        url,
      });
      onClose();
    }
  };

  const openTabByUrl = useMemo(() => {
    const map = new Map<string, OpenTab>();
    for (const tab of openTabs) {
      const norm = normalizeUrl(tab.url);
      if (norm && !map.has(norm)) {
        map.set(norm, tab);
      }
    }
    return map;
  }, [openTabs]);

  const bookmarkedUrls = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      const norm = normalizeUrl(b.url);
      if (norm) {
        set.add(norm);
      }
    }
    return set;
  }, [bookmarks]);

  const unbookmarkedTabs = useMemo(() => {
    return openTabs.filter((tab) => !bookmarkedUrls.has(normalizeUrl(tab.url)));
  }, [openTabs, bookmarkedUrls]);

  const openedBookmarkedTabs = useMemo(() => {
    return openTabs.filter((tab) => bookmarkedUrls.has(normalizeUrl(tab.url)));
  }, [openTabs, bookmarkedUrls]);

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      const aOpened = openTabByUrl.has(normalizeUrl(a.url));
      const bOpened = openTabByUrl.has(normalizeUrl(b.url));
      if (aOpened !== bOpened) {
        return aOpened ? -1 : 1;
      }
      return 0;
    });
  }, [bookmarks, openTabByUrl]);

  return (
    <div className="sidebar_view_container">
      <SidebarHeader title="Tabs" />

      <div className="sidebar_main_body">
        {/* Bookmarks Accordion Section */}
        <div
          className={`sidebar_section sidebar_accordion ${
            isAccordionOpen ? "sidebar_accordion_open" : ""
          }`}
        >
          <button
            type="button"
            className="sidebar_section_header_btn"
            onClick={() => setIsAccordionOpen((prev) => !prev)}
            aria-expanded={isAccordionOpen}
          >
            <div className="sidebar_section_title_row">
              <BookmarkIcon size={16} className="sidebar_section_icon" />
              <span>Bookmarks</span>
              <span className="sidebar_badge">{bookmarks.length}</span>
            </div>
            {isAccordionOpen ? (
              <ChevronDownIcon size={16} />
            ) : (
              <ChevronRightIcon size={16} />
            )}
          </button>

          {isAccordionOpen ? (
            <div className="sidebar_items_list sidebar_bookmarks_scroll">
              {sortedBookmarks.length === 0 ? (
                <div className="sidebar_empty_state">No bookmarks found</div>
              ) : (
                sortedBookmarks.map((b) => {
                  const openTab = openTabByUrl.get(normalizeUrl(b.url));
                  if (openTab) {
                    return (
                      <TabItemRow
                        key={b.id}
                        tab={openTab}
                        isOpenedBookmark={true}
                        onSwitch={handleSwitchTab}
                        onCloseTab={handleCloseTab}
                      />
                    );
                  }

                  return (
                    <button
                      key={b.id}
                      type="button"
                      className="sidebar_list_item sidebar_bookmark_item"
                      onClick={() => handleOpenUrl(b.url)}
                    >
                      <FaviconImage favIconUrl={b.favIconUrl} />
                      <div className="sidebar_item_info">
                        <span className="sidebar_item_title">{b.title}</span>
                        {b.url && (
                          <span className="sidebar_item_domain">
                            {b.url.replace(/^https?:\/\//i, "").split("/")[0]}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            openedBookmarkedTabs.length > 0 && (
              <div className="sidebar_items_list sidebar_opened_bookmarks_collapsed">
                {openedBookmarkedTabs.map((tab) => (
                  <TabItemRow
                    key={tab.id}
                    tab={tab}
                    isOpenedBookmark={true}
                    onSwitch={handleSwitchTab}
                    onCloseTab={handleCloseTab}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Open Tabs Section */}
        <div className="sidebar_section sidebar_tabs_section">
          <div className="sidebar_section_header">
            <span>Open Tabs</span>
            <span className="sidebar_badge">{unbookmarkedTabs.length}</span>
          </div>

          <div className="sidebar_items_list sidebar_tabs_scroll">
            {unbookmarkedTabs.length === 0 ? (
              <div className="sidebar_empty_state">No other open tabs</div>
            ) : (
              unbookmarkedTabs.map((tab) => (
                <TabItemRow
                  key={tab.id}
                  tab={tab}
                  isOpenedBookmark={false}
                  onSwitch={handleSwitchTab}
                  onCloseTab={handleCloseTab}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="sidebar_footer">
        <button
          type="button"
          className="sidebar_action_icon_btn"
          title="Archive tabs"
          aria-label="Archive tabs"
          onClick={onOpenArchive}
        >
          <ArchiveIcon size={18} />
        </button>

        <button
          type="button"
          className="sidebar_action_icon_btn"
          title="Downloads"
          aria-label="Downloads"
          onClick={onOpenDownloads}
        >
          <DownloadIcon size={18} />
        </button>
      </div>
    </div>
  );
};
