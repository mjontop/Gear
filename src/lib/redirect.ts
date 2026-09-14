import { getBangs } from "./bangs";

function isValidUrl(s: string): string | null {
  // handling ip addresses and localhost
  const ipAddressRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const localhostRegex = /^localhost$/;

  if (ipAddressRegex.test(s) || localhostRegex.test(s)) {
    return s;
  }

  try {
    if (!s.startsWith("http://") && !s.startsWith("https://")) {
      s = "https://" + s;
    }

    new URL(s);
    return s;
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
