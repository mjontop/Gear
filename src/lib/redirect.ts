import { getBangs } from "./bangs";

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
    const urlValue = hasProtocol ? trimmedValue : "https://" + trimmedValue;
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

  const bangs = getBangs();
  const bangList = Object.keys(bangs);

  const searchTerms = s.trim().split(" ");

  let redirectUrl = "";

  searchTerms.forEach((term) => {
    const bang = bangList.find((key) => term === key);
    if (bang) {
      s = s.replace(bang, "").trim();
      redirectUrl = bangs[bang];
    }
  });

  if (redirectUrl) {
    return redirectUrl.replace("%s", encodeURIComponent(s));
  }

  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}
