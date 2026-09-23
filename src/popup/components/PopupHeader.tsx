type PopupHeaderProps = {
  activeTab: "bangs" | "bookmarks" | "sources" | "settings";
  totalCount: number;
};

export const PopupHeader = ({ activeTab, totalCount }: PopupHeaderProps) => {
  const getBadgeText = () => {
    if (activeTab === "sources") {
      return "Sources";
    }
    if (activeTab === "settings") {
      return "Settings";
    }
    return `${totalCount} ${activeTab === "bangs" ? "Bangs" : "Bookmarks"}`;
  };

  return (
    <header className="popup_header">
      <div className="header_title_row">
        <img
          src="/logo.svg"
          alt="Gear logo"
          width={26}
          height={26}
          loading="eager"
          decoding="async"
          className="header_logo"
        />
        <h1 className="header_title">Gear Manager</h1>
      </div>
      <span className="header_badge">{getBadgeText()}</span>
    </header>
  );
};
