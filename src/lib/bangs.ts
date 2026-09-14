import { BANG_SEARCH_URLS } from "@/constants";

export const defaultBangs: Record<string, string> = BANG_SEARCH_URLS;

export function getBangs(): Record<string, string> {
  return defaultBangs;
}
