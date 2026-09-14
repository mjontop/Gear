import { TabItem } from "./tab-item";
import type { TabItemData } from "./tab-item";

type ActiveTabsProps = {
  tabs: TabItemData[];
  selectedIndex: number;
  onSelectTab: (tab: TabItemData) => void;
};

export const ActiveTabs = ({
  tabs,
  selectedIndex,
  onSelectTab,
}: ActiveTabsProps) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="active_tabs">
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isSelected={index === selectedIndex}
          onSelect={onSelectTab}
        />
      ))}
    </div>
  );
};
