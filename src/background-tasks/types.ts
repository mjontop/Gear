export type OpenTab = {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  audible?: boolean;
  muted?: boolean;
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

import type { SearchProviderId } from "@/constants";

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
  | { type: "OPEN_URL"; url: string }
  | {
      type: "GET_SEARCH_SUGGESTIONS";
      query: string;
      provider?: SearchProviderId;
    }
  | { type: "GET_BOOKMARKS"; query: string }
  | { type: "GET_HISTORY"; query: string }
  | { type: "COPY_CURRENT_URL"; url: string }
  | { type: "TOGGLE_SPOTLIGHT" }
  | { type: "OPEN_SPOTLIGHT_WITH_URL"; url?: string };
