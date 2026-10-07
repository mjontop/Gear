import type { OpenTab } from "./types";

export const getOpenTabs = async (
  currentTabId?: number,
  activeTabId?: number,
): Promise<OpenTab[]> => {
  const tabs = await chrome.tabs.query({});

  return tabs
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => {
      return typeof tab.id === "number" && tab.id !== currentTabId;
    })
    .sort((firstTab, secondTab) => {
      const isFirstActive =
        firstTab.id === activeTabId || Boolean(firstTab.active);
      const isSecondActive =
        secondTab.id === activeTabId || Boolean(secondTab.active);

      if (isFirstActive !== isSecondActive) {
        return isFirstActive ? -1 : 1;
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
      active: tab.id === activeTabId || Boolean(tab.active),
      current: tab.id === activeTabId,
      audible: Boolean(tab.audible),
      muted: Boolean(tab.mutedInfo?.muted),
    }));
};
