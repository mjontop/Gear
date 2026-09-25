import { BookmarkIcon, GlobeIcon, HistoryIcon, SearchIcon } from "lucide-react";
import { SuggestionItem } from "./suggestion-item";
import type { SuggestionItemData } from "./suggestion-item";

export type DirectUrlData = SuggestionItemData & {
  kind: "direct-url";
  priority: number;
};

export type ActiveTabData = SuggestionItemData & {
  kind: "open-tab";
  windowId: number;
  active: boolean;
  priority: number;
};

export type BookmarkData = SuggestionItemData & {
  kind: "bookmark";
  priority: number;
};

export type HistoryData = SuggestionItemData & {
  kind: "history";
  lastVisitTime?: number;
  priority: number;
};

export type SearchSuggestionData = SuggestionItemData & {
  kind: "search-suggestion";
  query: string;
  priority: number;
};

export type SpotlightResultData =
  | DirectUrlData
  | ActiveTabData
  | BookmarkData
  | HistoryData
  | SearchSuggestionData;

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

  const getActionLabel = (result: SpotlightResultData) => {
    switch (result.kind) {
      case "direct-url":
        return "Open URL";
      case "open-tab":
        return "Switch to Tab";
      case "bookmark":
        return "Open Bookmark";
      case "history":
        return "Open History";
      case "search-suggestion":
        return "Search Web";
      default:
        return undefined;
    }
  };

  const getFallbackIcon = (result: SpotlightResultData) => {
    switch (result.kind) {
      case "direct-url":
      case "open-tab":
        return <GlobeIcon size={20} className="search_suggestion_icon" />;
      case "bookmark":
        return <BookmarkIcon size={20} className="search_suggestion_icon" />;
      case "history":
        return <HistoryIcon size={20} className="search_suggestion_icon" />;
      case "search-suggestion":
        return <SearchIcon size={23} className="search_suggestion_icon" />;
      default:
        return undefined;
    }
  };

  return (
    <div className="active_tabs">
      {results.map((result, index) => (
        <SuggestionItem
          key={`${result.kind}-${result.id}`}
          item={result}
          isSelected={index === selectedIndex}
          isActive={result.kind === "open-tab" ? result.active : false}
          actionLabel={getActionLabel(result)}
          fallbackIcon={getFallbackIcon(result)}
          onSelect={onSelectResult}
        />
      ))}
    </div>
  );
};
