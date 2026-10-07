import type { RecentlyClosedTab } from "./types";

export async function getRecentlyClosedTabs(): Promise<RecentlyClosedTab[]> {
  try {
    if (typeof chrome !== "undefined" && chrome.sessions?.getRecentlyClosed) {
      const sessions = await chrome.sessions.getRecentlyClosed({
        maxResults: 50,
      });
      const results: RecentlyClosedTab[] = [];

      for (const session of sessions) {
        if (session.tab?.url && session.tab.url !== "about:blank") {
          results.push({
            id: `session_tab_${session.tab.sessionId || session.tab.id || results.length}_${session.lastModified}`,
            title: session.tab.title || session.tab.url,
            url: session.tab.url,
            favIconUrl: session.tab.favIconUrl,
            closedAt: session.lastModified
              ? session.lastModified * 1000
              : Date.now(),
            sessionId: session.tab.sessionId,
          });
        } else if (session.window?.tabs) {
          for (const tab of session.window.tabs) {
            if (tab?.url && tab.url !== "about:blank") {
              results.push({
                id: `session_win_${tab.sessionId || tab.id || results.length}_${session.lastModified}`,
                title: tab.title || tab.url,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                closedAt: session.lastModified
                  ? session.lastModified * 1000
                  : Date.now(),
                sessionId: tab.sessionId,
              });
            }
          }
        }
      }

      return results;
    }
  } catch (err) {
    console.error("Failed to load recently closed sessions:", err);
  }

  return [];
}
