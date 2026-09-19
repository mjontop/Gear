import { BookmarkIcon, TerminalIcon } from "lucide-react";

export type PopupTab = "bangs" | "bookmarks";

type NavigationTabsProps = {
  activeTab: PopupTab;
  onTabChange: (tab: PopupTab) => void;
  bangsCount: number;
  bookmarksCount: number;
};

export const NavigationTabs = ({
  activeTab,
  onTabChange,
  bangsCount,
  bookmarksCount,
}: NavigationTabsProps) => {
  return (
    <nav className="tab_navigation" aria-label="Popup tabs">
      <button
        type="button"
        className={`tab_button ${activeTab === "bangs" ? "tab_button_active" : ""}`}
        onClick={() => onTabChange("bangs")}
      >
        <TerminalIcon size={15} />
        <span>Bangs</span>
        <span className="tab_counter">{bangsCount}</span>
      </button>

      <button
        type="button"
        className={`tab_button ${activeTab === "bookmarks" ? "tab_button_active" : ""}`}
        onClick={() => onTabChange("bookmarks")}
      >
        <BookmarkIcon size={15} />
        <span>Bookmarks</span>
        <span className="tab_counter">{bookmarksCount}</span>
      </button>
    </nav>
  );
};
