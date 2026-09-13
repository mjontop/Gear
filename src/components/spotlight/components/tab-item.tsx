import { ArrowRightIcon } from "lucide-react";
import styles from "./tab-item.module.css";

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
      className={`${styles.tab_item} ${
        isSelected || tab.active ? styles.tab_item_active : ""
      }`}
      onClick={handleSelect}
      aria-selected={isSelected}
    >
      <span className={styles.favicon_wrap} aria-hidden="true">
        {tab.favIconUrl ? (
          <img className={styles.favicon} src={tab.favIconUrl} alt="" />
        ) : (
          <span className={styles.favicon_fallback}>
            {getFallbackLabel(tab.title)}
          </span>
        )}
      </span>
      <span className={styles.tab_title}>{tab.title}</span>
      <span className={styles.switch_label}>
        Switch to Tab
        <ArrowRightIcon size={18} className={styles.switch_icon} />
      </span>
    </button>
  );
};
