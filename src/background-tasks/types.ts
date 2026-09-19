export type OpenTab = {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
};

export type SearchSuggestion = {
  id: string;
  title: string;
  url: string;
  query: string;
};

export type BookmarkItem = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  url: string;
  lastVisitTime?: number;
  favIconUrl?: string;
};

export type RuntimeMessage =
  | { type: "GET_OPEN_TABS" }
  | { type: "SWITCH_TO_TAB"; tabId: number; windowId: number }
  | { type: "GET_SEARCH_SUGGESTIONS"; query: string }
  | { type: "GET_BOOKMARKS"; query: string }
  | { type: "GET_HISTORY"; query: string };
