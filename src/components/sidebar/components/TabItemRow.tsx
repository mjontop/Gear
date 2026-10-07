import { BookmarkIcon, XIcon } from "lucide-react";
import type { OpenTab } from "@/background-tasks/types";
import { FaviconImage } from "./FaviconImage";

export type TabItemRowProps = {
  tab: OpenTab;
  isOpenedBookmark?: boolean;
  onSwitch: (tab: OpenTab) => void;
  onCloseTab: (tabId: number) => void;
};

export const TabItemRow = ({
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
