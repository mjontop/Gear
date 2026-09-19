import {
  PencilIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

export type BangListItem = {
  prefix: string;
  url: string;
  isCustom: boolean;
};

type BangsListProps = {
  bangs: BangListItem[];
  searchFilter: string;
  customCount: number;
  onSearchFilterChange: (value: string) => void;
  onEdit: (prefix: string, url: string) => void;
  onDelete: (prefix: string) => void;
  onResetDefaults: () => void;
};

export const BangsList = ({
  bangs,
  searchFilter,
  customCount,
  onSearchFilterChange,
  onEdit,
  onDelete,
  onResetDefaults,
}: BangsListProps) => {
  return (
    <>
      <div className="list_toolbar">
        <div className="search_box">
          <label htmlFor="search-bangs-filter" className="search_box_label">
            Filter
          </label>
          <div className="search_input_wrap">
            <SearchIcon size={14} className="search_box_icon" />
            <input
              id="search-bangs-filter"
              type="text"
              placeholder="Search bangs..."
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              className="search_box_input"
            />
          </div>
        </div>
        {customCount > 0 && (
          <button
            type="button"
            className="btn btn_secondary"
            onClick={onResetDefaults}
            title="Reset all custom bangs to defaults"
          >
            <RotateCcwIcon size={12} />
            Reset
          </button>
        )}
      </div>

      <div className="bangs_list">
        {bangs.length === 0 ? (
          <div className="empty_state">No bangs matching your search.</div>
        ) : (
          bangs.map((item) => (
            <div key={item.prefix} className="bang_item">
              <div className="bang_info">
                <span className="bang_badge">{item.prefix}</span>
                {item.isCustom && (
                  <span className="bang_tag_custom">Custom</span>
                )}
                <span className="bang_url" title={item.url}>
                  {item.url}
                </span>
              </div>
              <div className="bang_actions">
                <button
                  type="button"
                  className="icon_btn"
                  onClick={() => onEdit(item.prefix, item.url)}
                  title={item.isCustom ? "Edit bang" : "Customize bang"}
                >
                  <PencilIcon size={13} />
                </button>
                {item.isCustom && (
                  <button
                    type="button"
                    className="icon_btn icon_btn_danger"
                    onClick={() => onDelete(item.prefix)}
                    title="Delete bang"
                  >
                    <Trash2Icon size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
