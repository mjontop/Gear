import { DEFAULT_SEARCH_URL, DEFAULT_URL_PROTOCOL } from "@/constants";
import { parseQueryWithBangs } from "./bangs";

export function isValidUrl(s: string): string | null {
  const trimmedValue = s.trim();

  if (!trimmedValue) {
    return null;
  }

  // handling ip addresses and localhost
  const ipAddressRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const localhostRegex = /^localhost$/;
  const hostnameRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?))*\.(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9]))$/i;

  if (ipAddressRegex.test(trimmedValue) || localhostRegex.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const hasProtocol = /^https?:\/\//i.test(trimmedValue);
    const urlValue = hasProtocol
      ? trimmedValue
      : DEFAULT_URL_PROTOCOL + trimmedValue;
    const url = new URL(urlValue);

    const isValidHostname =
      url.hostname === "localhost" ||
      ipAddressRegex.test(url.hostname) ||
      hostnameRegex.test(url.hostname);

    if (!isValidHostname) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function getRedirectUrl(s: string): string {
  // Check if input string is a valid URL
  const validUrl = isValidUrl(s);
  if (validUrl) {
    return validUrl;
  }

  const { cleanQuery, bangUrl } = parseQueryWithBangs(s);

  if (bangUrl) {
    return bangUrl.replace("%s", encodeURIComponent(cleanQuery));
  }

  return `${DEFAULT_SEARCH_URL}?q=${encodeURIComponent(cleanQuery || s.trim())}`;
}
