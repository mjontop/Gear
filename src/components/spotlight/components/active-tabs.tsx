import { SearchIcon } from "lucide-react";
import { SuggestionItem } from "./suggestion-item";
import type { SuggestionItemData } from "./suggestion-item";

export type ActiveTabData = SuggestionItemData & {
  kind: "open-tab";
  windowId: number;
  active: boolean;
  priority: number;
};

export type SearchSuggestionData = SuggestionItemData & {
  kind: "search-suggestion";
  query: string;
  priority: number;
};

export type SpotlightResultData = ActiveTabData | SearchSuggestionData;

type ActiveTabsProps = {
  results: SpotlightResultData[];
  selectedIndex: number;
  onSelectResult: (result: SpotlightResultData) => void;
};

export const ActiveTabs = ({
  results,
  selectedIndex,
  onSelectResult,
}: ActiveTabsProps) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="active_tabs">
      {results.map((result, index) => (
        <SuggestionItem
          key={`${result.kind}-${result.id}`}
          item={result}
          isSelected={index === selectedIndex}
          isActive={result.kind === "open-tab" ? result.active : false}
          actionLabel={result.kind === "open-tab" ? "Switch to Tab" : undefined}
          fallbackIcon={
            result.kind === "search-suggestion" ? (
              <SearchIcon size={23} className="search_suggestion_icon" />
            ) : undefined
          }
          onSelect={onSelectResult}
        />
      ))}
    </div>
  );
};
