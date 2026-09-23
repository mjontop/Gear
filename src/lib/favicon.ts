export const isFirefoxBrowser = (): boolean => {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    try {
      if (chrome.runtime.getURL("").startsWith("moz-extension://")) {
        return true;
      }
    } catch {}
  }

  if (
    typeof navigator !== "undefined" &&
    /firefox|fxios/i.test(navigator.userAgent)
  ) {
    return true;
  }

  return false;
};

export const getFaviconUrl = (pageUrl: string, size = 32): string => {
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    return "";
  }

  try {
    if (isFirefoxBrowser()) {
      return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(pageUrl)}&sz=${size}`;
    }

    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", size.toString());
    return url.toString();
  } catch {
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(pageUrl)}&sz=${size}`;
  }
};

