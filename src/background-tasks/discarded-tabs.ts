import { archiveMultipleTabs, archiveTab } from "@/lib/archived-tabs-storage";
import { getSpotlightPreferences } from "@/lib/preferences";

export async function handleTabDiscarded(
  tabId: number,
  changeInfo: { discarded?: boolean; [key: string]: any },
  tab: {
    id?: number;
    windowId?: number;
    title?: string;
    url?: string;
    favIconUrl?: string;
    active?: boolean;
    discarded?: boolean;
    [key: string]: any;
  },
): Promise<boolean> {
  const isDiscarded = Boolean(
    changeInfo?.discarded ||
    tab?.discarded ||
    (tab as any)?.status === "unloaded",
  );

  if (!isDiscarded || tab?.active) {
    return false;
  }

  const preferences = await getSpotlightPreferences();
  if (!preferences.autoCloseDiscardedTabs) {
    return false;
  }

  let fullTab = tab;
  if (!fullTab.url && typeof chrome !== "undefined" && chrome.tabs?.get) {
    try {
      const fetched = await chrome.tabs.get(tabId);
      if (fetched) {
        fullTab = fetched;
      }
    } catch {
      // Tab might have already been removed
    }
  }

  await archiveTab(
    fullTab,
    preferences.maxArchivedTabs,
    preferences.archiveRetentionDays,
  );

  try {
    if (typeof chrome !== "undefined" && chrome.tabs?.remove) {
      await chrome.tabs.remove(tabId);
    }
  } catch {
    // Tab might have already been removed by the user or browser
  }

  return true;
}

export async function closeExistingDiscardedTabs(): Promise<number> {
  const preferences = await getSpotlightPreferences();
  if (!preferences.autoCloseDiscardedTabs) {
    return 0;
  }

  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return 0;
  }

  try {
    const allTabs = await chrome.tabs.query({});
    const discardedTabs = allTabs.filter(
      (tab) =>
        tab.id &&
        !tab.active &&
        Boolean(tab.discarded || (tab as any).status === "unloaded"),
    );

    if (discardedTabs.length === 0) {
      return 0;
    }

    await archiveMultipleTabs(
      discardedTabs,
      preferences.maxArchivedTabs,
      preferences.archiveRetentionDays,
    );

    const results = await Promise.all(
      discardedTabs.map(async (tab) => {
        try {
          if (typeof chrome !== "undefined" && chrome.tabs?.remove && tab.id) {
            await chrome.tabs.remove(tab.id);
            return 1;
          }
        } catch {
          // Tab might have already been removed
        }
        return 0;
      }),
    );

    return results.reduce<number>((acc, curr) => acc + curr, 0);
  } catch (err) {
    console.error("Failed to close existing discarded tabs:", err);
    return 0;
  }
}
