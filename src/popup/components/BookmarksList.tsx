import { useState } from "react";
import {
  BookmarkIcon,
  FilterIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import type { ManageableBookmark } from "@/lib/bookmarks-manager";

type BookmarksListProps = {
  bookmarks: ManageableBookmark[];
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onEdit: (bookmark: ManageableBookmark) => void;
  onDelete: (id: string) => void;
};

export const BookmarksList = ({
  bookmarks,
  searchFilter,
  onSearchFilterChange,
  onEdit,
  onDelete,
}: BookmarksListProps) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <>
      <div className="list_toolbar">
        <div className="search_box">
          <label
            htmlFor="search-bookmarks-filter"
            className="search_box_label"
            title="Filter bookmarks"
            aria-label="Filter bookmarks"
          >
            <FilterIcon size={16} aria-hidden="true" />
            <span className="sr_only">Filter bookmarks</span>
          </label>
          <div className="search_input_wrap">
            <SearchIcon size={14} className="search_box_icon" />
            <input
              id="search-bookmarks-filter"
              type="text"
              placeholder="Search bookmarks..."
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              className="search_box_input"
            />
          </div>
        </div>
      </div>

      <div className="bangs_list">
        {bookmarks.length === 0 ? (
          <div className="empty_state">No bookmarks matching your search.</div>
        ) : (
          bookmarks.map((item) => (
            <div key={item.id} className="bang_item">
              <div className="bang_info">
                <span className="bookmark_favicon_wrap">
                  {item.favIconUrl && !imageErrors[item.id] ? (
                    <img
                      src={item.favIconUrl}
                      alt=""
                      className="bookmark_favicon"
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <BookmarkIcon
                      size={16}
                      className="bookmark_fallback_icon"
                    />
                  )}
                </span>
                <div className="bookmark_text_column">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bookmark_title_link"
                    title={item.title}
                  >
                    {item.title}
                  </a>
                  <span className="bang_url" title={item.url}>
                    {item.url}
                  </span>
                </div>
              </div>
              <div className="bang_actions">
                <button
                  type="button"
                  className="icon_btn"
                  onClick={() => onEdit(item)}
                  title="Edit bookmark"
                >
                  <PencilIcon size={14} />
                </button>
                <button
                  type="button"
                  className="icon_btn icon_btn_danger"
                  onClick={() => onDelete(item.id)}
                  title="Delete bookmark"
                >
                  <Trash2Icon size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
