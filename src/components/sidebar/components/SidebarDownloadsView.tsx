import { DownloadIcon, FileIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MESSAGE_TYPES } from "@/constants";
import type { DownloadItem } from "@/background-tasks/types";
import { groupByTimeBuckets } from "../utils/time-buckets";
import { SidebarHeader } from "./SidebarHeader";

export type SidebarDownloadsViewProps = {
  onBack: () => void;
  onClose: () => void;
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SidebarDownloadsView = ({
  onBack,
  onClose,
}: SidebarDownloadsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    let isCurrent = true;

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.GET_DOWNLOADS },
        (res) => {
          if (isCurrent && res?.downloads) {
            setDownloads(res.downloads);
          }
        },
      );
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredDownloads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return downloads;
    return downloads.filter((d) => d.filename.toLowerCase().includes(q));
  }, [downloads, searchQuery]);

  const groupedBuckets = useMemo(() => {
    return groupByTimeBuckets(filteredDownloads, (d) => d.startTime);
  }, [filteredDownloads]);

  const handleOpenDownload = (downloadId: number) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.OPEN_DOWNLOAD,
        downloadId,
      });
      onClose();
    }
  };

  return (
    <div className="sidebar_view_container">
      <SidebarHeader title="Downloads" onBack={onBack} onClose={onClose} />

      {/* Search Bar */}
      <div className="sidebar_search_row">
        <div className="sidebar_search_wrap">
          <label htmlFor="sidebar-downloads-search" className="sidebar_sr_only">
            Search Downloads
          </label>
          <SearchIcon size={16} className="sidebar_search_icon" />
          <input
            id="sidebar-downloads-search"
            type="text"
            placeholder="Search Downloads..."
            aria-label="Search Downloads"
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
      </div>

      {/* Time-Bucket Grouped List */}
      <div className="sidebar_content_scroll">
        {groupedBuckets.length === 0 ? (
          <div className="sidebar_empty_state">
            <DownloadIcon
              size={32}
              className="sidebar_empty_icon"
              style={{ opacity: 0.4, margin: "0 auto 8px" }}
            />
            <div>
              {searchQuery
                ? "No matching downloads found"
                : "No downloaded items found"}
            </div>
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
                    className="sidebar_list_item sidebar_download_item"
                    onClick={() => handleOpenDownload(item.id)}
                  >
                    <span className="sidebar_favicon_box" aria-hidden="true">
                      <FileIcon size={16} className="sidebar_fallback_icon" />
                    </span>
                    <div className="sidebar_item_info">
                      <span className="sidebar_item_title">
                        {item.filename}
                      </span>
                      <span className="sidebar_item_domain">
                        {formatFileSize(item.fileSize)}
                        {item.state === "complete" ? "" : ` • ${item.state}`}
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
