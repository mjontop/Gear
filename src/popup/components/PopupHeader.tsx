type PopupHeaderProps = {
  totalBangs: number;
};

export const PopupHeader = ({ totalBangs }: PopupHeaderProps) => {
  return (
    <header className="popup_header">
      <div className="header_title_row">
        <img src="/public/logo.png" alt="Gear logo" className="header_logo" />
        <h1 className="header_title">Gear Search Bangs</h1>
      </div>
      <span className="header_badge">{totalBangs} Bangs</span>
    </header>
  );
};
