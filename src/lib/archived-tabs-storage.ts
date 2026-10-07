import { ARCHIVED_TABS_STORAGE_KEY, DEFAULT_ARCHIVE_CONFIG } from "@/constants";

export type ArchivedTab = {
  id: string;
  originalTabId?: number;
  windowId?: number;
  title: string;
  url: string;
  favIconUrl?: string;
  discardedAt: number;
};

export function pruneArchivedTabs(
  tabs: ArchivedTab[],
  maxTabs: number = DEFAULT_ARCHIVE_CONFIG.MAX_ARCHIVED_TABS,
  retentionDays: number = DEFAULT_ARCHIVE_CONFIG.RETENTION_DAYS,
): ArchivedTab[] {
  const safeMax = Math.max(1, maxTabs);
  const safeDays = Math.max(1, retentionDays);
  const cutoffTime = Date.now() - safeDays * 24 * 60 * 60 * 1000;

  return tabs
    .filter((tab) => Boolean(tab && tab.url && tab.discardedAt >= cutoffTime))
    .sort((a, b) => b.discardedAt - a.discardedAt)
    .slice(0, safeMax);
}

export async function getArchivedTabs(): Promise<ArchivedTab[]> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(ARCHIVED_TABS_STORAGE_KEY);
      const stored = data[ARCHIVED_TABS_STORAGE_KEY];
      if (Array.isArray(stored)) {
        return stored;
      }
    }
  } catch (err) {
    console.error("Failed to load archived tabs from storage:", err);
  }
  return [];
}

export async function saveArchivedTabs(tabs: ArchivedTab[]): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [ARCHIVED_TABS_STORAGE_KEY]: tabs,
      });
      return;
    }
  } catch (err) {
    console.error("Failed to save archived tabs to storage:", err);
    throw err;
  }
}

export async function archiveMultipleTabs(
  tabs: Array<{
    id?: number;
    windowId?: number;
    title?: string;
    url?: string;
    favIconUrl?: string;
  }>,
  maxTabs: number = DEFAULT_ARCHIVE_CONFIG.MAX_ARCHIVED_TABS,
  retentionDays: number = DEFAULT_ARCHIVE_CONFIG.RETENTION_DAYS,
): Promise<ArchivedTab[]> {
  const validTabs = tabs.filter(
    (tab) => tab.url && tab.url.trim() !== "" && tab.url !== "about:blank",
  );
  if (validTabs.length === 0) {
    return [];
  }

  const now = Date.now();
  const newArchived: ArchivedTab[] = validTabs.map((tab, idx) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `tab_${now}_${idx}_${Math.random().toString(36).slice(2, 9)}`;

    return {
      id,
      originalTabId: tab.id,
      windowId: tab.windowId,
      title: tab.title || tab.url!,
      url: tab.url!,
      favIconUrl: tab.favIconUrl,
      discardedAt: now,
    };
  });

  const existing = await getArchivedTabs();
  const pruned = pruneArchivedTabs(
    [...newArchived, ...existing],
    maxTabs,
    retentionDays,
  );
  await saveArchivedTabs(pruned);

  return newArchived;
}

export async function archiveTab(
  tab: {
    id?: number;
    windowId?: number;
    title?: string;
    url?: string;
    favIconUrl?: string;
  },
  maxTabs: number = DEFAULT_ARCHIVE_CONFIG.MAX_ARCHIVED_TABS,
  retentionDays: number = DEFAULT_ARCHIVE_CONFIG.RETENTION_DAYS,
): Promise<ArchivedTab | null> {
  const [archived] = await archiveMultipleTabs([tab], maxTabs, retentionDays);
  return archived || null;
}

export async function clearArchivedTabs(): Promise<void> {
  await saveArchivedTabs([]);
}

export async function pruneExpiredArchivedTabs(
  maxTabs: number = DEFAULT_ARCHIVE_CONFIG.MAX_ARCHIVED_TABS,
  retentionDays: number = DEFAULT_ARCHIVE_CONFIG.RETENTION_DAYS,
): Promise<ArchivedTab[]> {
  const tabs = await getArchivedTabs();
  const pruned = pruneArchivedTabs(tabs, maxTabs, retentionDays);
  if (pruned.length !== tabs.length) {
    await saveArchivedTabs(pruned);
  }
  return pruned;
}
