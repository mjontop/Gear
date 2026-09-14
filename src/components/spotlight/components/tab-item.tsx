import { ArrowRightIcon } from "lucide-react";

export type TabItemData = {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
};

type TabItemProps = {
  tab: TabItemData;
  isSelected: boolean;
  onSelect: (tab: TabItemData) => void;
};

const getFallbackLabel = (title: string) => {
  const trimmedTitle = title.trim();

  return trimmedTitle ? trimmedTitle.charAt(0).toUpperCase() : "?";
};

export const TabItem = ({ tab, isSelected, onSelect }: TabItemProps) => {
  const handleSelect = () => {
    onSelect(tab);
  };

  return (
    <button
      type="button"
      className={`tab_item ${
        isSelected || tab.active ? "tab_item_active" : ""
      }`}
      onClick={handleSelect}
    >
      <span className="favicon_wrap" aria-hidden="true">
        {tab.favIconUrl ? (
          <img className="favicon" src={tab.favIconUrl} alt="" />
        ) : (
          <span className="favicon_fallback">
            {getFallbackLabel(tab.title)}
          </span>
        )}
      </span>
      <span className="tab_title">{tab.title}</span>
      <span className="switch_label">
        Switch to Tab
        <ArrowRightIcon size={18} className="switch_icon" />
      </span>
    </button>
  );
};
