import {
  COMMAND_NAMES,
  MESSAGE_TYPES,
  SPOTLIGHT_PREFERENCES_STORAGE_KEY,
  isRestrictedUrl,
} from "@/constants";
import { getBookmarks } from "./background-tasks/bookmarks";
import { getHistory } from "./background-tasks/history";
import { getOpenTabs } from "./background-tasks/open-tabs";
import { getSearchSuggestions } from "./background-tasks/search-suggestions";
import { switchToTab } from "./background-tasks/switch-tab";
import {
  handleTabDiscarded,
  closeExistingDiscardedTabs,
} from "./background-tasks/discarded-tabs";
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
  .then(() => closeExistingDiscardedTabs())
  .catch(() => {});

const DISCARDED_CHECK_ALARM = "gear_check_discarded_tabs";

if (typeof chrome !== "undefined" && chrome.alarms) {
  chrome.alarms.get(DISCARDED_CHECK_ALARM, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(DISCARDED_CHECK_ALARM, {
        periodInMinutes: 1,
      });
    }
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === DISCARDED_CHECK_ALARM) {
      closeExistingDiscardedTabs().catch(() => {});
    }
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    closeExistingDiscardedTabs().catch(() => {});
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    closeExistingDiscardedTabs().catch(() => {});
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onActivated) {
  chrome.tabs.onActivated.addListener(() => {
    closeExistingDiscardedTabs().catch(() => {});
  });
}

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[SPOTLIGHT_PREFERENCES_STORAGE_KEY]) {
      closeExistingDiscardedTabs().catch(() => {});
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.discarded || tab.discarded) {
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
      const excludedTabId = message.includeCurrentTab
        ? undefined
        : currentTabId;

      closeExistingDiscardedTabs()
        .then(() => getOpenTabs(excludedTabId, currentTabId))
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

    if (message.type === MESSAGE_TYPES.CLOSE_TAB) {
      chrome.tabs
        .remove(message.tabId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(() => {
          sendResponse({ success: false });
        });

      return true;
    }

    return false;
  },
);
