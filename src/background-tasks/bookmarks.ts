import { getFaviconUrl } from "@/lib/favicon";
import type { BookmarkItem } from "./types";

export const getBookmarks = async (query: string): Promise<BookmarkItem[]> => {
  const trimmedQuery = query.trim();

  let nodes: chrome.bookmarks.BookmarkTreeNode[];

  if (!trimmedQuery) {
    nodes = await chrome.bookmarks.getRecent(20);
  } else {
    nodes = await chrome.bookmarks.search(trimmedQuery);
  }

  const seenUrls = new Set<string>();
  const results: BookmarkItem[] = [];

  for (const node of nodes) {
    if (!node.url) continue;

    const normalizedUrl = node.url.toLowerCase();
    if (seenUrls.has(normalizedUrl)) continue;

    seenUrls.add(normalizedUrl);
    results.push({
      id: node.id,
      title: node.title || node.url,
      url: node.url,
      favIconUrl: getFaviconUrl(node.url),
    });
  }

  return results;
};
