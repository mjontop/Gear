export const DEFAULT_URL_PROTOCOL = "https://";

export type SearchProviderId = "google" | "duckduckgo" | "bing" | "brave";

export type SearchProvider = {
  id: SearchProviderId;
  name: string;
  searchUrl: string;
  suggestionsEndpoint: string;
  domain: string;
};

export const SEARCH_PROVIDERS: Record<SearchProviderId, SearchProvider> = {
  google: {
    id: "google",
    name: "Google",
    searchUrl: "https://www.google.com/search?q=%s",
    suggestionsEndpoint:
      "https://suggestqueries.google.com/complete/search?client=firefox&q=%s",
    domain: "google.com",
  },
  duckduckgo: {
    id: "duckduckgo",
    name: "DuckDuckGo",
    searchUrl: "https://duckduckgo.com/?q=%s",
    suggestionsEndpoint: "https://duckduckgo.com/ac/?type=list&q=%s",
    domain: "duckduckgo.com",
  },
  bing: {
    id: "bing",
    name: "Bing",
    searchUrl: "https://www.bing.com/search?q=%s",
    suggestionsEndpoint: "https://api.bing.com/osjson.aspx?query=%s",
    domain: "bing.com",
  },
  brave: {
    id: "brave",
    name: "Brave Search",
    searchUrl: "https://search.brave.com/search?q=%s",
    suggestionsEndpoint: "https://search.brave.com/api/suggest?q=%s",
    domain: "search.brave.com",
  },
};

export const DEFAULT_SEARCH_PROVIDER_ID: SearchProviderId = "google";

export const DEFAULT_SEARCH_URL = "https://www.google.com/search";

export const SEARCH_SUGGESTIONS_ENDPOINT =
  "https://suggestqueries.google.com/complete/search";

export const SEARCH_SUGGESTIONS_CLIENT = "firefox";

export const SEARCH_SUGGESTIONS_HOST_PERMISSIONS = [
  "https://suggestqueries.google.com/*",
  "https://duckduckgo.com/*",
  "https://api.bing.com/*",
  "https://search.brave.com/*",
];

export const SEARCH_SUGGESTIONS_HOST_PERMISSION =
  SEARCH_SUGGESTIONS_HOST_PERMISSIONS[0];

export const CONTENT_SCRIPT_MATCHES = ["http://*/*", "https://*/*"];

export const BANG_SEARCH_URLS: Record<string, string> = {
  "!g": `${DEFAULT_SEARCH_URL}?q=%s`,
  "!wi": `${DEFAULT_SEARCH_URL}?q=%s+site:wikipedia.org`,
  "!px": "https://www.pexels.com/search?q=%s",
  "!gi": `${DEFAULT_SEARCH_URL}?tbm=isch&q=%s`,
  "!bi": "https://www.bing.com/search?q=%s",
  "!yt": "https://www.youtube.com/results?search_query=%s",
};

export const MAX_SPOTLIGHT_RESULTS = 5;

export const SEARCH_SUGGESTION_DEBOUNCE_MS = 200;

export const SEARCH_RESULT_PRIORITY = {
  OPEN_TAB: 0,
  BOOKMARK: 1,
  HISTORY: 2,
  SEARCH_SUGGESTION: 3,
} as const;
