import { describe, it, expect } from "vitest";
import { getBangs, parseQueryWithBangs } from "@/lib/bangs";
import { CUSTOM_BANGS_STORAGE_KEY, saveCustomBangs } from "@/lib/bangs-storage";
import { triggerStorageChanged } from "./setup";

describe("bangs", () => {
  it("returns default bangs initially", () => {
    const bangs = getBangs();
    expect(bangs["!g"]).toBeDefined();
    expect(bangs["!yt"]).toBeDefined();
    expect(bangs["!wi"]).toBeDefined();
  });

  it("correctly parses bang at the beginning of a query", () => {
    const parsed = parseQueryWithBangs("!g vitest runner");
    expect(parsed.bang).toBe("!g");
    expect(parsed.cleanQuery).toBe("vitest runner");
    expect(parsed.bangUrl).toContain("google.com");
  });

  it("correctly parses bang in the middle or end of a query", () => {
    const parsedEnd = parseQueryWithBangs("vitest runner !g");
    expect(parsedEnd.bang).toBe("!g");
    expect(parsedEnd.cleanQuery).toBe("vitest runner");

    const parsedMiddle = parseQueryWithBangs("vitest !wi test");
    expect(parsedMiddle.bang).toBe("!wi");
    expect(parsedMiddle.cleanQuery).toBe("vitest test");
  });

  it("handles queries without bangs", () => {
    const parsed = parseQueryWithBangs("just a normal query");
    expect(parsed.bang).toBeNull();
    expect(parsed.bangUrl).toBeNull();
    expect(parsed.cleanQuery).toBe("just a normal query");
  });

  it("handles empty or whitespace queries", () => {
    const parsed = parseQueryWithBangs("   ");
    expect(parsed.bang).toBeNull();
    expect(parsed.cleanQuery).toBe("");
  });

  it("reacts to custom bang storage changes", async () => {
    await saveCustomBangs({ "!custom": "https://custom.search.io?q=%s" });
    const parsed = parseQueryWithBangs("!custom test");
    expect(parsed.bang).toBe("!custom");
    expect(parsed.bangUrl).toBe("https://custom.search.io?q=%s");
  });

  it("handles storage onChanged edge cases such as non-sync/local areas, missing keys, and empty newValues", () => {
    // Call listener with non-sync/local area (e.g. managed)
    triggerStorageChanged(
      { [CUSTOM_BANGS_STORAGE_KEY]: { newValue: { "!managed": "url" } } },
      "managed",
    );
    expect(getBangs()["!managed"]).toBeUndefined();

    // Call listener with unrelated change in sync
    triggerStorageChanged({ "unrelated-key": { newValue: "val" } }, "sync");

    // Call listener with custom-bangs having falsy/undefined newValue (cleared)
    triggerStorageChanged(
      { [CUSTOM_BANGS_STORAGE_KEY]: { newValue: undefined } },
      "local",
    );
    expect(getBangs()["!custom"]).toBeUndefined();
  });
});
