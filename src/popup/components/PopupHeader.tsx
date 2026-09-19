type PopupHeaderProps = {
  activeTab: "bangs" | "bookmarks";
  totalCount: number;
};

export const PopupHeader = ({ activeTab, totalCount }: PopupHeaderProps) => {
  return (
    <header className="popup_header">
      <div className="header_title_row">
        <img src="/logo.svg" alt="Gear logo" className="header_logo" />
        <h1 className="header_title">Gear Manager</h1>
      </div>
      <span className="header_badge">
        {totalCount} {activeTab === "bangs" ? "Bangs" : "Bookmarks"}
      </span>
    </header>
  );
};
