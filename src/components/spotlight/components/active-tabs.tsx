import { SuggestionItem } from "./suggestion-item";
import type { SuggestionItemData } from "./suggestion-item";

export type ActiveTabData = SuggestionItemData & {
  windowId: number;
  active: boolean;
};

type ActiveTabsProps = {
  tabs: ActiveTabData[];
  selectedIndex: number;
  onSelectTab: (tab: ActiveTabData) => void;
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
        <SuggestionItem
          key={tab.id}
          item={tab}
          isSelected={index === selectedIndex}
          isActive={tab.active}
          actionLabel="Switch to Tab"
          onSelect={onSelectTab}
        />
      ))}
    </div>
  );
};
