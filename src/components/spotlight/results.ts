import {
  DEFAULT_SEARCH_PROVIDER_ID,
  SEARCH_PROVIDERS,
  SEARCH_RESULT_PRIORITY,
  type SearchProviderId,
} from "@/constants";
import type { BookmarkItem, HistoryItem } from "@/background-tasks/types";
import type {
  ActiveTabData,
  BookmarkData,
  DirectUrlData,
  HistoryData,
  SearchSuggestionData,
  SpotlightResultData,
} from "./components/active-tabs";

export type OpenTabData = Omit<ActiveTabData, "kind" | "priority">;

export type SearchSuggestionResponseData = Omit<
  SearchSuggestionData,
  "kind" | "priority"
>;

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
};

export const getMatchScore = (
  title: string,
  url: string,
  query: string,
): number => {
  if (!query) return 0;
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();
  if (lowerTitle.startsWith(query)) return 3;
  if (lowerTitle.includes(query)) return 2;
  if (lowerUrl.includes(query)) return 1;
  return 0;
};

export const getSpotlightResults = ({
  tabs,
  bookmarks,
  history,
  searchSuggestions,
  rawQuery,
  cleanQuery,
  validUrl,
  searchProvider = DEFAULT_SEARCH_PROVIDER_ID,
  maxResults,
}: {
  tabs: OpenTabData[];
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  searchSuggestions: SearchSuggestionResponseData[];
  rawQuery: string;
  cleanQuery: string;
  validUrl?: string | null;
  searchProvider?: SearchProviderId;
  maxResults: number;
}): SpotlightResultData[] => {
  const normalizedClean = cleanQuery.trim().toLowerCase();
  const normalizedRaw = rawQuery.trim().toLowerCase();
  const seenUrls = new Set<string>();

  const openTabResults: ActiveTabData[] = tabs
    .filter((tab) => {
      if (!normalizedClean && !normalizedRaw) {
        return true;
      }
      const q = normalizedClean || normalizedRaw;
      return (
        tab.title.toLowerCase().includes(q) || tab.url.toLowerCase().includes(q)
      );
    })
    .sort((firstTab, secondTab) => {
      const q = normalizedClean || normalizedRaw;
      const scoreA = getMatchScore(firstTab.title, firstTab.url, q);
      const scoreB = getMatchScore(secondTab.title, secondTab.url, q);
      return scoreB - scoreA;
    })
    .map((tab) => {
      seenUrls.add(normalizeUrl(tab.url));
      return {
        ...tab,
        kind: "open-tab" as const,
        priority: SEARCH_RESULT_PRIORITY.OPEN_TAB,
      };
    });

  const bookmarkResults: BookmarkData[] = bookmarks
    .filter((bookmark) => {
      const normUrl = normalizeUrl(bookmark.url);
      if (seenUrls.has(normUrl)) {
        return false;
      }

      if (!normalizedClean && !normalizedRaw) {
        return true;
      }

      const lowerTitle = bookmark.title.toLowerCase();
      const lowerUrl = bookmark.url.toLowerCase();

      const matchesRaw =
        Boolean(normalizedRaw) &&
        (lowerTitle.includes(normalizedRaw) ||
          lowerUrl.includes(normalizedRaw));

      const matchesClean =
        Boolean(normalizedClean) &&
        (lowerTitle.includes(normalizedClean) ||
          lowerUrl.includes(normalizedClean));

      return matchesRaw || matchesClean;
    })
    .sort((firstBm, secondBm) => {
      const scoreRawA = getMatchScore(
        firstBm.title,
        firstBm.url,
        normalizedRaw,
      );
      const scoreRawB = getMatchScore(
        secondBm.title,
        secondBm.url,
        normalizedRaw,
      );
      const scoreCleanA = getMatchScore(
        firstBm.title,
        firstBm.url,
        normalizedClean,
      );
      const scoreCleanB = getMatchScore(
        secondBm.title,
        secondBm.url,
        normalizedClean,
      );

      const bestA = Math.max(scoreRawA, scoreCleanA);
      const bestB = Math.max(scoreRawB, scoreCleanB);
      return bestB - bestA;
    })
    .map((bookmark) => {
      seenUrls.add(normalizeUrl(bookmark.url));
      return {
        ...bookmark,
        kind: "bookmark" as const,
        priority: SEARCH_RESULT_PRIORITY.BOOKMARK,
      };
    });

  const historyResults: HistoryData[] = history
    .filter((item) => {
      const normUrl = normalizeUrl(item.url);
      if (seenUrls.has(normUrl)) {
        return false;
      }

      if (!normalizedClean) {
        return false;
      }

      const lowerTitle = item.title.toLowerCase();
      const lowerUrl = item.url.toLowerCase();
      return (
        lowerTitle.includes(normalizedClean) ||
        lowerUrl.includes(normalizedClean)
      );
    })
    .sort((firstItem, secondItem) => {
      const scoreA = getMatchScore(
        firstItem.title,
        firstItem.url,
        normalizedClean,
      );
      const scoreB = getMatchScore(
        secondItem.title,
        secondItem.url,
        normalizedClean,
      );

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return (secondItem.lastVisitTime ?? 0) - (firstItem.lastVisitTime ?? 0);
    })
    .map((item) => {
      seenUrls.add(normalizeUrl(item.url));
      return {
        ...item,
        kind: "history" as const,
        priority: SEARCH_RESULT_PRIORITY.HISTORY,
      };
    });

  const searchSuggestionResults: SearchSuggestionData[] = searchSuggestions.map(
    (suggestion) => ({
      ...suggestion,
      kind: "search-suggestion" as const,
      priority: SEARCH_RESULT_PRIORITY.SEARCH_SUGGESTION,
    }),
  );

  if (!normalizedRaw) {
    return [...openTabResults, ...bookmarkResults].slice(0, maxResults);
  }

  const localResults = [
    ...openTabResults,
    ...bookmarkResults,
    ...historyResults,
  ];

  if (validUrl) {
    const directUrlResult: DirectUrlData = {
      id: validUrl,
      title: validUrl,
      url: validUrl,
      kind: "direct-url",
      priority: SEARCH_RESULT_PRIORITY.DIRECT_URL,
    };

    const provider =
      SEARCH_PROVIDERS[searchProvider] ||
      SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID];

    const searchUrlResult: SearchSuggestionData = {
      id: `search-for-${rawQuery}`,
      title: rawQuery,
      url: provider.searchUrl.replace("%s", encodeURIComponent(rawQuery)),
      query: rawQuery,
      kind: "search-suggestion",
      priority: SEARCH_RESULT_PRIORITY.SEARCH_SUGGESTION,
    };

    const remainingSlots = Math.max(0, maxResults - 2);
    const selectedLocal = localResults.slice(0, remainingSlots);

    return [directUrlResult, searchUrlResult, ...selectedLocal];
  }

  if (searchSuggestionResults.length > 0) {
    const reservedSuggestionSlots = Math.min(2, searchSuggestionResults.length);
    const maxLocalSlots = Math.max(1, maxResults - reservedSuggestionSlots);
    const selectedLocal = localResults.slice(0, maxLocalSlots);
    const remainingSlots = maxResults - selectedLocal.length;
    const selectedSuggestions = searchSuggestionResults.slice(
      0,
      remainingSlots,
    );

    return [...selectedLocal, ...selectedSuggestions];
  }

  return localResults.slice(0, maxResults);
};
