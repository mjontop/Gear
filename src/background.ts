import { COMMAND_NAMES, MESSAGE_TYPES, isRestrictedUrl } from "@/constants";
import { getBookmarks } from "./background-tasks/bookmarks";
import { getHistory } from "./background-tasks/history";
import { getOpenTabs } from "./background-tasks/open-tabs";
import { getSearchSuggestions } from "./background-tasks/search-suggestions";
import { switchToTab } from "./background-tasks/switch-tab";
import { handleTabDiscarded } from "./background-tasks/discarded-tabs";
import { getRecentlyClosedTabs } from "./background-tasks/recently-closed";
import { getDownloads, openDownload } from "./background-tasks/downloads";
import {
  getArchivedTabs,
  pruneExpiredArchivedTabs,
} from "./lib/archived-tabs-storage";
import { getSpotlightPreferences } from "./lib/preferences";
import type { RuntimeMessage } from "./background-tasks/types";

getSpotlightPreferences()
  .then((prefs) =>
    pruneExpiredArchivedTabs(prefs.maxArchivedTabs, prefs.archiveRetentionDays),
  )
  .catch(() => {});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.discarded) {
    handleTabDiscarded(tabId, changeInfo, tab).catch(() => {});
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === COMMAND_NAMES.TOGGLE_SPOTLIGHT) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || isRestrictedUrl(tab.url)) return;

    chrome.tabs
      .sendMessage(tab.id, {
        type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT,
      })
      .catch(() => {});
    return;
  }

  if (command === COMMAND_NAMES.COPY_CURRENT_URL) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || isRestrictedUrl(tab.url)) return;

    chrome.tabs
      .sendMessage(tab.id, {
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: tab.url,
      })
      .catch(() => {});
    return;
  }

  if (command === COMMAND_NAMES.OPEN_SPOTLIGHT_WITH_URL) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || isRestrictedUrl(tab.url)) return;

    chrome.tabs
      .sendMessage(tab.id, {
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: tab.url,
      })
      .catch(() => {});
    return;
  }

  if (command === COMMAND_NAMES.TOGGLE_SIDEBAR) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || isRestrictedUrl(tab.url)) return;

    chrome.tabs
      .sendMessage(tab.id, {
        type: MESSAGE_TYPES.TOGGLE_SIDEBAR,
      })
      .catch(() => {});
  }
});

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, sender, sendResponse) => {
    if (message.type === MESSAGE_TYPES.GET_OPEN_TABS) {
      const currentTabId = sender.tab?.id;

      getOpenTabs(currentTabId)
        .then((tabs) => {
          sendResponse({ tabs });
        })
        .catch(() => {
          sendResponse({ tabs: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.SWITCH_TO_TAB) {
      switchToTab(message.tabId, message.windowId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(() => {
          sendResponse({ success: false });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.OPEN_URL) {
      chrome.tabs
        .create({ url: message.url })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(() => {
          sendResponse({ success: false });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS) {
      getSearchSuggestions(message.query, message.provider)
        .then((suggestions) => {
          sendResponse({ suggestions });
        })
        .catch(() => {
          sendResponse({ suggestions: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_BOOKMARKS) {
      getBookmarks(message.query)
        .then((bookmarks) => {
          sendResponse({ bookmarks });
        })
        .catch(() => {
          sendResponse({ bookmarks: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_HISTORY) {
      getHistory(message.query)
        .then((history) => {
          sendResponse({ history });
        })
        .catch(() => {
          sendResponse({ history: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_ARCHIVED_TABS) {
      getArchivedTabs()
        .then((tabs) => {
          sendResponse({ tabs });
        })
        .catch(() => {
          sendResponse({ tabs: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS) {
      getRecentlyClosedTabs()
        .then((tabs) => {
          sendResponse({ tabs });
        })
        .catch(() => {
          sendResponse({ tabs: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_DOWNLOADS) {
      getDownloads(message.query)
        .then((downloads) => {
          sendResponse({ downloads });
        })
        .catch(() => {
          sendResponse({ downloads: [] });
        });

      return true;
    }

    if (message.type === MESSAGE_TYPES.OPEN_DOWNLOAD) {
      openDownload(message.downloadId)
        .then((success) => {
          sendResponse({ success });
        })
        .catch(() => {
          sendResponse({ success: false });
        });

      return true;
    }

    return false;
  },
);
