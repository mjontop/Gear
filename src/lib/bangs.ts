export const defaultBangs: Record<string, string> = {
  "!g": "https://www.google.com/search?q=%s",
  "!wi": "https://www.google.com/search?q=%s+site:wikipedia.org",
  "!px": "https://www.pexels.com/search?q=%s",
  "!gi": "https://www.google.com/search?tbm=isch&q=%s",
  "!bi": "https://www.bing.com/search?q=%s",
  "!yt": "https://www.youtube.com/results?search_query=%s",
};

export function getBangs(): Record<string, string> {
  return defaultBangs;
}
