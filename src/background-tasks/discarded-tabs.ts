import { archiveTab } from "@/lib/archived-tabs-storage";
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
    [key: string]: any;
  },
): Promise<boolean> {
  if (!changeInfo.discarded) {
    return false;
  }

  const preferences = await getSpotlightPreferences();
  if (!preferences.autoCloseDiscardedTabs) {
    return false;
  }

  await archiveTab(
    tab,
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
