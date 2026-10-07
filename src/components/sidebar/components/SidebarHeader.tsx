import { ArrowLeftIcon, XIcon } from "lucide-react";

export type SidebarHeaderProps = {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
};

export const SidebarHeader = ({
  title,
  onBack,
  onClose,
}: SidebarHeaderProps) => {
  return (
    <div className="sidebar_header">
      {onBack && (
        <button
          type="button"
          aria-label="Back to tabs"
          className="sidebar_icon_btn"
          onClick={onBack}
        >
          <ArrowLeftIcon size={18} />
        </button>
      )}
      <span className="sidebar_title">{title}</span>
      {onClose && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="sidebar_icon_btn"
          onClick={onClose}
        >
          <XIcon size={18} />
        </button>
      )}
    </div>
  );
};
