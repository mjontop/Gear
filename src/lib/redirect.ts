import {
  DEFAULT_SEARCH_PROVIDER_ID,
  DEFAULT_URL_PROTOCOL,
  SEARCH_PROVIDERS,
  type SearchProviderId,
} from "@/constants";
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
