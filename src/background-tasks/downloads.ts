import type { DownloadItem } from "./types";

export async function getDownloads(query?: string): Promise<DownloadItem[]> {
  try {
    if (typeof chrome !== "undefined" && chrome.downloads?.search) {
      const searchOptions: chrome.downloads.DownloadQuery = {
        orderBy: ["-startTime"],
        limit: 100,
      };
      if (query && query.trim()) {
        searchOptions.query = [query.trim()];
      }

      const items = await chrome.downloads.search(searchOptions);
      return items.map((item) => ({
        id: item.id,
        filename: item.filename.split(/[/\\]/).pop() || item.filename,
        url: item.url,
        fileSize: item.fileSize || item.totalBytes || 0,
        startTime: item.startTime
          ? new Date(item.startTime).getTime()
          : Date.now(),
        state: item.state,
        danger: item.danger,
        mime: item.mime,
      }));
    }
  } catch (err) {
    console.error("Failed to load downloads:", err);
  }
  return [];
}

export async function openDownload(downloadId: number): Promise<boolean> {
  try {
    if (typeof chrome !== "undefined" && chrome.downloads?.open) {
      chrome.downloads.open(downloadId);
      return true;
    }
  } catch {
    try {
      if (typeof chrome !== "undefined" && chrome.downloads?.show) {
        chrome.downloads.show(downloadId);
        return true;
      }
    } catch {
      // Failed to open or show download
    }
  }
  return false;
}
