import { getFaviconUrl } from "@/lib/favicon";
import type { HistoryItem } from "./types";

export const getHistory = async (query: string): Promise<HistoryItem[]> => {
  const trimmedQuery = query.trim();

  const historyItems = await chrome.history.search({
    text: trimmedQuery,
    maxResults: 25,
    startTime: 0,
  });

  const seenUrls = new Set<string>();
  const results: HistoryItem[] = [];

  for (const item of historyItems) {
    if (!item.url) continue;

    const normalizedUrl = item.url.toLowerCase();
    if (seenUrls.has(normalizedUrl)) continue;

    seenUrls.add(normalizedUrl);
    results.push({
      id: item.id,
      title: item.title || item.url,
      url: item.url,
      lastVisitTime: item.lastVisitTime,
      favIconUrl: getFaviconUrl(item.url),
    });
  }

  return results;
};
