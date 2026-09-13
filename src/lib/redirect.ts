import { getBangs } from "./bangs";

export function getRedirectUrl(s: string): string {
  // Check if input string is a valid URL
  try {
    const url = new URL(s);
    return url.toString();
  } catch {
    // Not a valid URL, continue with bang processing
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
