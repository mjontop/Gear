import { BANG_SEARCH_URLS } from "@/constants";

export const defaultBangs: Record<string, string> = BANG_SEARCH_URLS;

export function getBangs(): Record<string, string> {
  return defaultBangs;
}

export type ParsedQuery = {
  rawQuery: string;
  cleanQuery: string;
  bang: string | null;
  bangUrl: string | null;
};

export function parseQueryWithBangs(rawInput: string): ParsedQuery {
  const trimmed = rawInput.trim();
  const bangs = getBangs();
  const bangList = Object.keys(bangs);
  const terms = trimmed ? trimmed.split(/\s+/) : [];

  let detectedBang: string | null = null;
  let bangUrl: string | null = null;
  const remainingTerms: string[] = [];

  for (const term of terms) {
    const matchedBang = bangList.find(
      (key) => key.toLowerCase() === term.toLowerCase(),
    );

    if (matchedBang && !detectedBang) {
      detectedBang = matchedBang;
      bangUrl = bangs[matchedBang];
    } else {
      remainingTerms.push(term);
    }
  }

  return {
    rawQuery: trimmed,
    cleanQuery: remainingTerms.join(" ").trim(),
    bang: detectedBang,
    bangUrl,
  };
}
