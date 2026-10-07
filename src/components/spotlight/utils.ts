import type { BookmarkItem, HistoryItem } from "@/background-tasks/types";
import type { SpotlightResultData } from "./components/active-tabs";
import type { OpenTabData, SearchSuggestionResponseData } from "./results";

export type SpotlightApiResponse = {
  tabs?: OpenTabData[];
  bookmarks?: BookmarkItem[];
  history?: HistoryItem[];
  suggestions?: SearchSuggestionResponseData[];
};

export const getClampedTabIndex = (index: number, tabCount: number): number => {
  if (tabCount === 0) return 0;

  return Math.min(index, tabCount - 1);
};

export const formatQueryWithBang = (
  query: string,
  bang: string | null,
): string => {
  if (bang) {
    return `${bang} ${query}`;
  }
  return query;
};

export const getAutocompletedText = (
  result: SpotlightResultData,
  bang: string | null,
): string => {
  if (result.kind === "search-suggestion") {
    return formatQueryWithBang(result.query, bang);
  }

  return result.title;
};
