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
  DIRECT_URL: -1,
  OPEN_TAB: 0,
  BOOKMARK: 1,
  HISTORY: 2,
  SEARCH_SUGGESTION: 3,
} as const;

export const STORAGE_KEYS = {
  SPOTLIGHT_PREFERENCES: "gear_spotlight_preferences",
  CUSTOM_BANGS: "gear_custom_bangs",
  ARCHIVED_TABS: "gear_archived_tabs",
} as const;

export const SPOTLIGHT_PREFERENCES_STORAGE_KEY =
  STORAGE_KEYS.SPOTLIGHT_PREFERENCES;
export const CUSTOM_BANGS_STORAGE_KEY = STORAGE_KEYS.CUSTOM_BANGS;
export const ARCHIVED_TABS_STORAGE_KEY = STORAGE_KEYS.ARCHIVED_TABS;

export const DEFAULT_ARCHIVE_CONFIG = {
  AUTO_CLOSE_DISCARDED: true,
  MAX_ARCHIVED_TABS: 100,
  RETENTION_DAYS: 7,
} as const;

export const COMMAND_NAMES = {
  TOGGLE_SPOTLIGHT: "toggle-spotlight",
  COPY_CURRENT_URL: "copy-current-url",
  OPEN_SPOTLIGHT_WITH_URL: "open-spotlight-with-url",
  TOGGLE_SIDEBAR: "toggle-sidebar",
} as const;

export const MESSAGE_TYPES = {
  TOGGLE_SPOTLIGHT: "TOGGLE_SPOTLIGHT",
  COPY_CURRENT_URL: "COPY_CURRENT_URL",
  OPEN_SPOTLIGHT_WITH_URL: "OPEN_SPOTLIGHT_WITH_URL",
  TOGGLE_SIDEBAR: "TOGGLE_SIDEBAR",
  GET_OPEN_TABS: "GET_OPEN_TABS",
  SWITCH_TO_TAB: "SWITCH_TO_TAB",
  OPEN_URL: "OPEN_URL",
  GET_BOOKMARKS: "GET_BOOKMARKS",
  GET_HISTORY: "GET_HISTORY",
  GET_SEARCH_SUGGESTIONS: "GET_SEARCH_SUGGESTIONS",
  GET_ARCHIVED_TABS: "GET_ARCHIVED_TABS",
  GET_RECENTLY_CLOSED_TABS: "GET_RECENTLY_CLOSED_TABS",
  GET_DOWNLOADS: "GET_DOWNLOADS",
  OPEN_DOWNLOAD: "OPEN_DOWNLOAD",
  CLOSE_TAB: "CLOSE_TAB",
} as const;

export const RESTRICTED_URL_SCHEMES = [
  "chrome://",
  "chrome-extension://",
  "moz-extension://",
  "edge://",
  "brave://",
  "view-source://",
  "about:",
  "file://",
] as const;

export const RESTRICTED_URL_DOMAINS = [
  "chromewebstore.google.com",
  "chrome.google.com/webstore",
  "addons.mozilla.org",
] as const;

export const isRestrictedUrl = (url?: string): boolean => {
  if (!url) return true;
  for (const scheme of RESTRICTED_URL_SCHEMES) {
    if (url.startsWith(scheme)) return true;
  }
  for (const domain of RESTRICTED_URL_DOMAINS) {
    if (url.includes(domain)) return true;
  }
  return false;
};

export const FONT_FAMILY_OPTIONS = [
  {
    id: "Roboto",
    name: "Roboto",
    value: "Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  {
    id: "Inter",
    name: "Inter",
    value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  {
    id: "System",
    name: "System Native",
    value:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: "Monospace",
    name: "Monospace",
    value:
      "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Consolas, monospace",
  },
  {
    id: "Serif",
    name: "Serif",
    value: "Georgia, 'Times New Roman', Cambria, serif",
  },
] as const;

export const FONT_WEIGHT_OPTIONS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi-Bold", value: "600" },
  { label: "Bold", value: "700" },
] as const;

export const FONT_SIZE_PRESETS = [
  { label: "Small", value: 14 },
  { label: "Default", value: 16 },
  { label: "Large", value: 18 },
  { label: "X-Large", value: 20 },
] as const;

export const BORDER_RADIUS_PRESETS = [
  { label: "Sharp", value: 4 },
  { label: "Default", value: 10 },
  { label: "Rounded", value: 16 },
  { label: "Pill", value: 24 },
] as const;

export const COLOR_PALETTE_PRESETS = [
  { name: "Default", primary: "", secondary: "", accent: "" },
  {
    name: "Slate",
    primary: "#f8fafc",
    secondary: "#94a3b8",
    accent: "#38bdf8",
  },
  {
    name: "Emerald",
    primary: "#ecfdf5",
    secondary: "#a7f3d0",
    accent: "#10b981",
  },
  {
    name: "Sky Blue",
    primary: "#f0f9ff",
    secondary: "#bae6fd",
    accent: "#0284c7",
  },
  {
    name: "Amber",
    primary: "#fffbeb",
    secondary: "#fde68a",
    accent: "#f59e0b",
  },
  {
    name: "Rose",
    primary: "#fff1f2",
    secondary: "#fecdd3",
    accent: "#f43f5e",
  },
  {
    name: "Purple",
    primary: "#faf5ff",
    secondary: "#e9d5ff",
    accent: "#a855f7",
  },
] as const;

export const DEFAULT_STYLE_VALUES = {
  fontSize: 16,
  fontWeight: "400",
  fontFamily: "Roboto",
  fontColor: "",
  secondaryFontColor: "",
  accentColor: "",
  borderRadius: 10,
} as const;
