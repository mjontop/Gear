export const getFaviconUrl = (pageUrl: string, size = 32): string => {
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
    return "";
  }

  try {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", size.toString());
    return url.toString();
  } catch {
    return "";
  }
};
