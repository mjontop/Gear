export const switchToTab = async (
  tabId: number,
  windowId: number,
): Promise<void> => {
  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
};
