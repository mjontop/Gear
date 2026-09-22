import {
  DEFAULT_SEARCH_PROVIDER_ID,
  DEFAULT_URL_PROTOCOL,
  SEARCH_PROVIDERS,
  type SearchProviderId,
} from "@/constants";
import { parseQueryWithBangs } from "./bangs";

const INTERNAL_SCHEME_REGEX = /^(?:chrome|brave|edge|opera|vivaldi|about):/i;
const WINDOWS_PATH_REGEX = /^[a-zA-Z]:[\\/]/;
const IP_ADDRESS_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const LOCALHOST_REGEX = /^localhost$/i;
const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export function isValidUrl(s: string): string | null {
  const trimmedValue = s.trim();

  if (!trimmedValue) {
    return null;
  }

  // 1. Browser-internal schemes (brave://, chrome://, edge://, about:blank, etc.)
  if (INTERNAL_SCHEME_REGEX.test(trimmedValue)) {
    try {
      const url = new URL(trimmedValue);
      return url.toString();
    } catch {
      return null;
    }
  }

  // 2. Windows absolute local file paths (e.g., C:\Users\... or C:/Users/...)
  if (WINDOWS_PATH_REGEX.test(trimmedValue)) {
    try {
      const normalizedPath = trimmedValue.replace(/\\/g, "/");
      const url = new URL(`file:///${normalizedPath}`);
      return url.toString();
    } catch {
      return null;
    }
  }

  // 3. File URLs (file:///...)
  if (/^file:\/\/\//i.test(trimmedValue)) {
    try {
      const url = new URL(trimmedValue);
      return url.toString();
    } catch {
      return null;
    }
  }

  // 4. Standard web URLs, domains, IPs, or localhost
  // Plain search phrases with spaces should not be treated as URLs
  if (/\s/.test(trimmedValue)) {
    return null;
  }

  try {
    const hasProtocol = /^https?:\/\//i.test(trimmedValue);
    let protocol = DEFAULT_URL_PROTOCOL;

    if (!hasProtocol) {
      if (
        trimmedValue.toLowerCase().startsWith("localhost") ||
        trimmedValue.startsWith("127.0.0.1")
      ) {
        protocol = "http://";
      }
    }

    const urlValue = hasProtocol ? trimmedValue : protocol + trimmedValue;
    const url = new URL(urlValue);

    const isValidHostname =
      LOCALHOST_REGEX.test(url.hostname) ||
      IP_ADDRESS_REGEX.test(url.hostname) ||
      DOMAIN_REGEX.test(url.hostname);

    if (!isValidHostname) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}


export function getRedirectUrl(
  s: string,
  providerId: SearchProviderId = DEFAULT_SEARCH_PROVIDER_ID,
): string {
  // Check if input string is a valid URL
  const validUrl = isValidUrl(s);
  if (validUrl) {
    return validUrl;
  }

  const { cleanQuery, bangUrl } = parseQueryWithBangs(s);

  if (bangUrl) {
    return bangUrl.replace("%s", encodeURIComponent(cleanQuery));
  }

  const provider =
    SEARCH_PROVIDERS[providerId] ||
    SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID];

  return provider.searchUrl.replace(
    "%s",
    encodeURIComponent(cleanQuery || s.trim()),
  );
}
