export const DEFAULT_URL_PROTOCOL = "https://";

export const DEFAULT_SEARCH_URL = "https://www.google.com/search";

export const SEARCH_SUGGESTIONS_ENDPOINT =
  "https://suggestqueries.google.com/complete/search";

export const SEARCH_SUGGESTIONS_CLIENT = "firefox";

export const SEARCH_SUGGESTIONS_HOST_PERMISSION =
  "https://suggestqueries.google.com/*";

export const CONTENT_SCRIPT_MATCHES = ["https://*/*"];

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
  SEARCH_SUGGESTION: 1,
} as const;
