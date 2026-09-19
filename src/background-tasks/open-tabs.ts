import type { OpenTab } from "./types";

export const getOpenTabs = async (
  currentTabId?: number,
): Promise<OpenTab[]> => {
  const tabs = await chrome.tabs.query({});

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => {
      return typeof tab.id === "number" && tab.id !== currentTabId;
    })
    .sort((firstTab, secondTab) => {
      if (firstTab.active !== secondTab.active) {
        return firstTab.active ? -1 : 1;
      }

      if (firstTab.windowId !== secondTab.windowId) {
        return firstTab.windowId - secondTab.windowId;
      }

      return firstTab.index - secondTab.index;
    })
    .map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title || tab.url || "Untitled",
      url: tab.url || "",
      favIconUrl: tab.favIconUrl,
      active: Boolean(tab.active),
      audible: Boolean(tab.audible),
      muted: Boolean(tab.mutedInfo?.muted),
    }));
};
