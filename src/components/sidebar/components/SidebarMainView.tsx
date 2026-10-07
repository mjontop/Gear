import {
  ArchiveIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MESSAGE_TYPES } from "@/constants";
import type { BookmarkItem, OpenTab } from "@/background-tasks/types";
import { FaviconImage } from "./FaviconImage";
import { SidebarHeader } from "./SidebarHeader";

export type SidebarMainViewProps = {
  onOpenArchive: () => void;
  onOpenDownloads: () => void;
  onClose: () => void;
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

  // Identify which open tabs are bookmarked
  const bookmarkedUrls = new Set(bookmarks.map((b) => b.url));

  return (
    <div className="sidebar_view_container">
      <SidebarHeader title="Tabs" />

      <div className="sidebar_content_scroll">
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

          {isAccordionOpen && (
            <div className="sidebar_items_list">
              {bookmarks.length === 0 ? (
                <div className="sidebar_empty_state">No bookmarks found</div>
              ) : (
                bookmarks.map((b) => (
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
                ))
              )}
            </div>
          )}
        </div>

        {/* Open Tabs Section */}
        <div className="sidebar_section">
          <div className="sidebar_section_header">
            <span>Open Tabs</span>
            <span className="sidebar_badge">{openTabs.length}</span>
          </div>

          <div className="sidebar_items_list">
            {openTabs.map((tab) => {
              const isBookmarked = bookmarkedUrls.has(tab.url);
              const isCurrent = Boolean(tab.current ?? tab.active);
              return (
                <div
                  key={tab.id}
                  className={`sidebar_list_item ${
                    isCurrent ? "sidebar_list_item_current" : ""
                  } ${isBookmarked ? "sidebar_item_bookmarked" : ""}`}
                >
                  <button
                    type="button"
                    className="sidebar_tab_main_btn"
                    onClick={() => handleSwitchTab(tab)}
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
                    {isBookmarked && (
                      <BookmarkIcon
                        size={12}
                        className="sidebar_bookmark_tag_icon"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    className="sidebar_tab_close_btn"
                    aria-label={`Close tab ${tab.title}`}
                    title="Close tab"
                    onClick={() => handleCloseTab(tab.id)}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              );
            })}
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
