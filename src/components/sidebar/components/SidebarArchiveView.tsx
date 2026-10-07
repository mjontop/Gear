import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MESSAGE_TYPES } from "@/constants";
import type { ArchivedTab } from "@/lib/archived-tabs-storage";
import type { RecentlyClosedTab } from "@/background-tasks/types";
import { groupByTimeBuckets } from "../utils/time-buckets";
import { FaviconImage } from "./FaviconImage";
import { SidebarHeader } from "./SidebarHeader";

export type SidebarArchiveViewProps = {
  onBack: () => void;
  onClose: () => void;
};

type GenericClosedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  timestamp: number;
};

export const SidebarArchiveView = ({
  onBack,
  onClose,
}: SidebarArchiveViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"auto" | "manual">("auto");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [autoTabs, setAutoTabs] = useState<ArchivedTab[]>([]);
  const [manualTabs, setManualTabs] = useState<RecentlyClosedTab[]>([]);

  useEffect(() => {
    let isCurrent = true;

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_ARCHIVED_TABS },
        (res) => {
          if (isCurrent && res?.tabs) {
            setAutoTabs(res.tabs);
          }
        },
      );

      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS },
        (res) => {
          if (isCurrent && res?.tabs) {
            setManualTabs(res.tabs);
          }
        },
      );
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  const normalizedTabs: GenericClosedTab[] = useMemo(() => {
    if (activeFilter === "auto") {
      return autoTabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        favIconUrl: t.favIconUrl,
        timestamp: t.discardedAt,
      }));
    }
    return manualTabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      favIconUrl: t.favIconUrl,
      timestamp: t.closedAt,
    }));
  }, [activeFilter, autoTabs, manualTabs]);

  const filteredTabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return normalizedTabs;
    return normalizedTabs.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q),
    );
  }, [normalizedTabs, searchQuery]);

  const groupedBuckets = useMemo(() => {
    return groupByTimeBuckets(filteredTabs, (t) => t.timestamp);
  }, [filteredTabs]);

  const handleOpenUrl = (url: string) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.OPEN_URL,
        url,
      });
      onClose();
    }
  };

  return (
    <div className="sidebar_view_container">
      <SidebarHeader
        title="Recently Closed"
        onBack={onBack}
        onClose={onClose}
      />

      {/* Search Bar & Filter Toggle Button */}
      <div className="sidebar_search_row">
        <div className="sidebar_search_wrap">
          <label htmlFor="sidebar-archive-search" className="sidebar_sr_only">
            Search Archive
          </label>
          <SearchIcon size={16} className="sidebar_search_icon" />
          <input
            id="sidebar-archive-search"
            type="text"
            placeholder="Search Archive..."
            aria-label="Search Archive"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar_search_input"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="sidebar_clear_btn"
              onClick={() => setSearchQuery("")}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle filters"
          className={`sidebar_filter_toggle_btn ${
            showFilterOptions ? "sidebar_filter_btn_active" : ""
          }`}
          onClick={() => setShowFilterOptions((prev) => !prev)}
        >
          <FilterIcon size={16} />
        </button>
      </div>

      {/* Filter Buttons */}
      {showFilterOptions && (
        <div
          className="sidebar_filter_chips_row"
          role="group"
          aria-label="Archive filters"
        >
          <button
            type="button"
            className={`sidebar_chip_btn ${
              activeFilter === "auto" ? "sidebar_chip_btn_active" : ""
            }`}
            onClick={() => setActiveFilter("auto")}
          >
            Auto closed ({autoTabs.length})
          </button>
          <button
            type="button"
            className={`sidebar_chip_btn ${
              activeFilter === "manual" ? "sidebar_chip_btn_active" : ""
            }`}
            onClick={() => setActiveFilter("manual")}
          >
            Manual closed ({manualTabs.length})
          </button>
        </div>
      )}

      {/* Time-Bucket Grouped List */}
      <div className="sidebar_content_scroll">
        {groupedBuckets.length === 0 ? (
          <div className="sidebar_empty_state">
            {searchQuery
              ? "No matching closed tabs found"
              : "No closed tabs in this category"}
          </div>
        ) : (
          groupedBuckets.map((bucket) => (
            <div key={bucket.label} className="sidebar_bucket_section">
              <div className="sidebar_bucket_label">{bucket.label}</div>
              <div className="sidebar_items_list">
                {bucket.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="sidebar_list_item"
                    onClick={() => handleOpenUrl(item.url)}
                  >
                    <FaviconImage favIconUrl={item.favIconUrl} />
                    <div className="sidebar_item_info">
                      <span className="sidebar_item_title">{item.title}</span>
                      <span className="sidebar_item_domain">
                        {item.url.replace(/^https?:\/\//i, "").split("/")[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
