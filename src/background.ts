import { getBookmarks } from "./background-tasks/bookmarks";
import { getHistory } from "./background-tasks/history";
import { getOpenTabs } from "./background-tasks/open-tabs";
import { getSearchSuggestions } from "./background-tasks/search-suggestions";
import { switchToTab } from "./background-tasks/switch-tab";
import type { RuntimeMessage } from "./background-tasks/types";

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-spotlight") return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, {
    type: "TOGGLE_SPOTLIGHT",
  });
});

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, sender, sendResponse) => {
    if (message.type === "GET_OPEN_TABS") {
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

    if (message.type === "SWITCH_TO_TAB") {
      switchToTab(message.tabId, message.windowId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(() => {
          sendResponse({ success: false });
        });

      return true;
    }

    if (message.type === "GET_SEARCH_SUGGESTIONS") {
      getSearchSuggestions(message.query)
        .then((suggestions) => {
          sendResponse({ suggestions });
        })
        .catch(() => {
          sendResponse({ suggestions: [] });
        });

      return true;
    }

    if (message.type === "GET_BOOKMARKS") {
      getBookmarks(message.query)
        .then((bookmarks) => {
          sendResponse({ bookmarks });
        })
        .catch(() => {
          sendResponse({ bookmarks: [] });
        });

      return true;
    }

    if (message.type === "GET_HISTORY") {
      getHistory(message.query)
        .then((history) => {
          sendResponse({ history });
        })
        .catch(() => {
          sendResponse({ history: [] });
        });

      return true;
    }

    return false;
  },
);
