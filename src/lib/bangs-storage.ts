import { BANG_SEARCH_URLS, CUSTOM_BANGS_STORAGE_KEY } from "@/constants";

export { CUSTOM_BANGS_STORAGE_KEY };

export type BangItem = {
  prefix: string;
  url: string;
  isCustom: boolean;
};

export type ValidationResult = {
  isValid: boolean;
  prefixError?: string;
  urlError?: string;
  normalizedPrefix?: string;
  normalizedUrl?: string;
};

export function normalizeBangPrefix(prefix: string): string {
  const trimmed = prefix.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("!") ? trimmed : `!${trimmed}`;
}

export function validateBang(
  prefix: string,
  url: string,
  allBangs: Record<string, string>,
  editingPrefix?: string,
): ValidationResult {
  const normalizedPrefix = normalizeBangPrefix(prefix);
  const trimmedUrl = url.trim();

  let prefixError: string | undefined;
  let urlError: string | undefined;

  if (!normalizedPrefix || normalizedPrefix === "!") {
    prefixError = "Bang prefix cannot be empty.";
  } else if (!/^![a-zA-Z0-9_-]+$/.test(normalizedPrefix)) {
    prefixError =
      "Prefix must start with '!' and contain only letters, numbers, hyphens, or underscores.";
  } else if (
    allBangs[normalizedPrefix] &&
    normalizedPrefix !== editingPrefix?.toLowerCase()
  ) {
    prefixError = `Prefix '${normalizedPrefix}' already exists.`;
  }

  if (!trimmedUrl) {
    urlError = "Destination URL cannot be empty.";
  } else if (!/^https?:\/\//i.test(trimmedUrl)) {
    urlError = "URL must start with http:// or https://";
  } else if (!trimmedUrl.includes("%s")) {
    urlError = "URL must include '%s' where your search query will go.";
  } else {
    try {
      const testUrl = new URL(trimmedUrl.replace(/%s/g, "test"));
      if (!["http:", "https:"].includes(testUrl.protocol)) {
        urlError = "URL must use http or https.";
      }
    } catch {
      urlError = "Invalid URL format.";
    }
  }

  return {
    isValid: !prefixError && !urlError,
    prefixError,
    urlError,
    normalizedPrefix,
    normalizedUrl: trimmedUrl,
  };
}

export async function getCustomBangs(): Promise<Record<string, string>> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      const data = await chrome.storage.sync.get(CUSTOM_BANGS_STORAGE_KEY);
      return (data[CUSTOM_BANGS_STORAGE_KEY] as Record<string, string>) || {};
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const data = await chrome.storage.local.get(CUSTOM_BANGS_STORAGE_KEY);
      return (data[CUSTOM_BANGS_STORAGE_KEY] as Record<string, string>) || {};
    }
  } catch (err) {
    console.error("Failed to load custom bangs from storage:", err);
  }
  return {};
}

export async function saveCustomBangs(
  bangs: Record<string, string>,
): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [CUSTOM_BANGS_STORAGE_KEY]: bangs });
      return;
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [CUSTOM_BANGS_STORAGE_KEY]: bangs });
      return;
    }
  } catch (err) {
    console.error("Failed to save custom bangs to storage:", err);
    throw err;
  }
}

export async function getAllBangs(): Promise<Record<string, string>> {
  const custom = await getCustomBangs();
  return { ...BANG_SEARCH_URLS, ...custom };
}
