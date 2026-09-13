type OpenTab = {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
};

type RuntimeMessage =
  | { type: "GET_OPEN_TABS" }
  | { type: "SWITCH_TO_TAB"; tabId: number; windowId: number };

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

      chrome.tabs
        .query({})
        .then((tabs) => {
          const openTabs: OpenTab[] = tabs
            .filter((tab): tab is chrome.tabs.Tab & { id: number } => {
              return (
                typeof tab.id === "number" &&
                tab.id !== currentTabId
              );
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
            }));

          sendResponse({ tabs: openTabs });
        })
        .catch(() => {
          sendResponse({ tabs: [] });
        });

      return true;
    }

    if (message.type === "SWITCH_TO_TAB") {
      chrome.windows
        .update(message.windowId, { focused: true })
        .then(() => chrome.tabs.update(message.tabId, { active: true }))
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
