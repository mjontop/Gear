import { getFaviconUrl } from "./favicon";

export type ManageableBookmark = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  dateAdded?: number;
};

export type BookmarkValidationResult = {
  isValid: boolean;
  titleError?: string;
  urlError?: string;
  normalizedTitle?: string;
  normalizedUrl?: string;
};

export function validateBookmark(
  title: string,
  url: string,
): BookmarkValidationResult {
  const trimmedTitle = title.trim();
  let trimmedUrl = url.trim();

  let titleError: string | undefined;
  let urlError: string | undefined;

  if (!trimmedTitle) {
    titleError = "Title cannot be empty.";
  }

  if (!trimmedUrl) {
    urlError = "URL cannot be empty.";
  } else {
    // If protocol missing, auto-prepend https://
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        urlError = "URL must use http or https.";
      }
    } catch {
      urlError = "Invalid URL format.";
    }
  }

  return {
    isValid: !titleError && !urlError,
    titleError,
    urlError,
    normalizedTitle: trimmedTitle,
    normalizedUrl: trimmedUrl,
  };
}

export async function fetchBookmarks(
  query = "",
): Promise<ManageableBookmark[]> {
  if (typeof chrome === "undefined" || !chrome.bookmarks) {
    return [];
  }

  const trimmed = query.trim();
  let nodes: chrome.bookmarks.BookmarkTreeNode[];

  if (!trimmed) {
    nodes = await chrome.bookmarks.getRecent(40);
  } else {
    nodes = await chrome.bookmarks.search(trimmed);
  }

  const results: ManageableBookmark[] = [];

  for (const node of nodes) {
    if (!node.url) continue; // Skip folders

    results.push({
      id: node.id,
      title: node.title || node.url,
      url: node.url,
      favIconUrl: getFaviconUrl(node.url),
      dateAdded: node.dateAdded,
    });
  }

  return results;
}

export async function addBookmark(
  title: string,
  url: string,
): Promise<ManageableBookmark | null> {
  if (typeof chrome === "undefined" || !chrome.bookmarks) {
    return null;
  }

  const node = await chrome.bookmarks.create({
    title,
    url,
  });

  if (!node.url) return null;

  return {
    id: node.id,
    title: node.title || node.url,
    url: node.url,
    favIconUrl: getFaviconUrl(node.url),
    dateAdded: node.dateAdded,
  };
}

export async function editBookmark(
  id: string,
  title: string,
  url: string,
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.bookmarks) {
    return;
  }

  await chrome.bookmarks.update(id, {
    title,
    url,
  });
}

export async function deleteBookmark(id: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.bookmarks) {
    return;
  }

  await chrome.bookmarks.remove(id);
}
