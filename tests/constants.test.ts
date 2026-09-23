import { describe, it, expect } from "vitest";
import {
  isRestrictedUrl,
  RESTRICTED_URL_SCHEMES,
  RESTRICTED_URL_DOMAINS,
  SEARCH_PROVIDERS,
  DEFAULT_SEARCH_PROVIDER_ID,
  COMMAND_NAMES,
  MESSAGE_TYPES,
  SEARCH_RESULT_PRIORITY,
} from "@/constants";

describe("constants and isRestrictedUrl", () => {
  it("returns true for falsy or empty URLs", () => {
    expect(isRestrictedUrl(undefined)).toBe(true);
    expect(isRestrictedUrl("")).toBe(true);
  });

  it("restricts all defined browser internal schemes", () => {
    for (const scheme of RESTRICTED_URL_SCHEMES) {
      expect(isRestrictedUrl(`${scheme}test-page`)).toBe(true);
    }
  });

  it("restricts Chrome and Mozilla extension stores", () => {
    for (const domain of RESTRICTED_URL_DOMAINS) {
      expect(isRestrictedUrl(`https://${domain}/detail/some-extension`)).toBe(
        true,
      );
    }
  });

  it("allows unrestricted standard web pages", () => {
    expect(isRestrictedUrl("https://github.com")).toBe(false);
    expect(isRestrictedUrl("http://localhost:3000")).toBe(false);
    expect(isRestrictedUrl("https://news.ycombinator.com")).toBe(false);
  });

  it("provides well-formed search providers", () => {
    expect(SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID]).toBeDefined();
    expect(SEARCH_PROVIDERS.google.searchUrl).toContain("%s");
    expect(SEARCH_PROVIDERS.duckduckgo.searchUrl).toContain("%s");
    expect(SEARCH_PROVIDERS.bing.searchUrl).toContain("%s");
    expect(SEARCH_PROVIDERS.brave.searchUrl).toContain("%s");
  });

  it("defines valid command names and message types", () => {
    expect(COMMAND_NAMES.TOGGLE_SPOTLIGHT).toBe("toggle-spotlight");
    expect(MESSAGE_TYPES.TOGGLE_SPOTLIGHT).toBe("TOGGLE_SPOTLIGHT");
    expect(SEARCH_RESULT_PRIORITY.DIRECT_URL).toBeLessThan(
      SEARCH_RESULT_PRIORITY.OPEN_TAB,
    );
    expect(SEARCH_RESULT_PRIORITY.OPEN_TAB).toBeLessThan(
      SEARCH_RESULT_PRIORITY.BOOKMARK,
    );
  });
});
