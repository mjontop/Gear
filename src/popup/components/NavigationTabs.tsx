import { useEffect, useRef } from "react";
import {
  BookmarkIcon,
  LayersIcon,
  SettingsIcon,
  TerminalIcon,
} from "lucide-react";

export type PopupTab = "bangs" | "bookmarks" | "sources" | "settings";

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
  const navRef = useRef<HTMLElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (navRef.current && e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const activeButton = navRef.current?.querySelector<HTMLButtonElement>(
      ".tab_button_active",
    );
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      onWheel={handleWheel}
      className="tab_navigation"
      aria-label="Popup tabs"
    >
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

      <button
        type="button"
        className={`tab_button ${activeTab === "sources" ? "tab_button_active" : ""}`}
        onClick={() => onTabChange("sources")}
      >
        <LayersIcon size={15} />
        <span>Sources</span>
      </button>

      <button
        type="button"
        className={`tab_button ${activeTab === "settings" ? "tab_button_active" : ""}`}
        onClick={() => onTabChange("settings")}
      >
        <SettingsIcon size={15} />
        <span>Settings</span>
      </button>
    </nav>
  );
};
