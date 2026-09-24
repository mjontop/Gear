import { describe, it, expect, vi } from "vitest";
import {
  normalizeBangPrefix,
  validateBang,
  getCustomBangs,
  saveCustomBangs,
  getAllBangs,
} from "@/lib/bangs-storage";

describe("bangs-storage", () => {
  describe("normalizeBangPrefix", () => {
    it("prepends exclamation mark if omitted", () => {
      expect(normalizeBangPrefix("yt")).toBe("!yt");
      expect(normalizeBangPrefix("Github")).toBe("!github");
    });

    it("keeps existing exclamation mark and lowercases", () => {
      expect(normalizeBangPrefix("!YT")).toBe("!yt");
      expect(normalizeBangPrefix("!Docs")).toBe("!docs");
    });

    it("handles whitespace", () => {
      expect(normalizeBangPrefix("   !g   ")).toBe("!g");
      expect(normalizeBangPrefix("   ")).toBe("");
    });
  });

  describe("validateBang", () => {
    const existingBangs = {
      "!g": "https://google.com?q=%s",
      "!yt": "https://youtube.com?q=%s",
    };

    it("flags empty prefix", () => {
      const res = validateBang("", "https://test.com?q=%s", existingBangs);
      expect(res.isValid).toBe(false);
      expect(res.prefixError).toContain("cannot be empty");
    });

    it("flags invalid characters in prefix", () => {
      const res = validateBang(
        "!my bang$",
        "https://test.com?q=%s",
        existingBangs,
      );
      expect(res.isValid).toBe(false);
      expect(res.prefixError).toContain("Prefix must start with");
    });

    it("flags duplicate prefixes", () => {
      const res = validateBang("!g", "https://test.com?q=%s", existingBangs);
      expect(res.isValid).toBe(false);
      expect(res.prefixError).toContain("already exists");
    });

    it("allows duplicate prefix when editing the same bang", () => {
      const res = validateBang(
        "!g",
        "https://google.com/search?q=%s",
        existingBangs,
        "!g",
      );
      expect(res.isValid).toBe(true);
      expect(res.prefixError).toBeUndefined();
    });

    it("flags empty URL", () => {
      const res = validateBang("!test", "", existingBangs);
      expect(res.isValid).toBe(false);
      expect(res.urlError).toContain("cannot be empty");
    });

    it("flags URL missing http/https", () => {
      const res = validateBang("!test", "ftp://test.com?q=%s", existingBangs);
      expect(res.isValid).toBe(false);
      expect(res.urlError).toContain("URL must start with http");
    });

    it("flags URL missing %s placeholder", () => {
      const res = validateBang(
        "!test",
        "https://test.com/search",
        existingBangs,
      );
      expect(res.isValid).toBe(false);
      expect(res.urlError).toContain("must include '%s'");
    });

    it("flags invalid URL format when URL cannot be parsed", () => {
      const res = validateBang(
        "!test",
        "https://test:999999/%s",
        existingBangs,
      );
      expect(res.isValid).toBe(false);
      expect(res.urlError).toBe("Invalid URL format.");
    });

    it("flags empty prefix when only '!' is provided", () => {
      const res = validateBang("!", "https://test.com?q=%s", existingBangs);
      expect(res.isValid).toBe(false);
      expect(res.prefixError).toBe("Bang prefix cannot be empty.");
    });

    it("flags URL when protocol is not http or https", () => {
      const OriginalURL = globalThis.URL;
      class MockURL extends OriginalURL {
        override get protocol() {
          return "ftp:";
        }
      }
      globalThis.URL = MockURL as any;

      try {
        const res = validateBang("!ftp", "https://ftp.com?q=%s", existingBangs);
        expect(res.isValid).toBe(false);
        expect(res.urlError).toBe("URL must use http or https.");
      } finally {
        globalThis.URL = OriginalURL;
      }
    });

    it("accepts valid bang definitions", () => {
      const res = validateBang(
        "!npm",
        "https://www.npmjs.com/search?q=%s",
        existingBangs,
      );
      expect(res.isValid).toBe(true);
      expect(res.normalizedPrefix).toBe("!npm");
      expect(res.normalizedUrl).toBe("https://www.npmjs.com/search?q=%s");
    });
  });

  describe("storage methods", () => {
    it("saves and loads custom bangs using chrome.storage.sync", async () => {
      const initial = await getCustomBangs();
      expect(initial).toEqual({});

      await saveCustomBangs({ "!npm": "https://npmjs.com/search?q=%s" });

      const loaded = await getCustomBangs();
      expect(loaded).toEqual({ "!npm": "https://npmjs.com/search?q=%s" });

      const all = await getAllBangs();
      expect(all["!npm"]).toBe("https://npmjs.com/search?q=%s");
      expect(all["!g"]).toBeDefined();
    });

    it("falls back to chrome.storage.local if sync is unavailable", async () => {
      const originalSync = (globalThis as any).chrome.storage.sync;
      (globalThis as any).chrome.storage.sync = undefined;

      await saveCustomBangs({ "!local": "https://local.test?q=%s" });
      const loaded = await getCustomBangs();
      expect(loaded["!local"]).toBe("https://local.test?q=%s");

      (globalThis as any).chrome.storage.sync = originalSync;
    });

    it("catches and handles storage read errors gracefully", async () => {
      const originalGet = (globalThis as any).chrome.storage.sync.get;
      (globalThis as any).chrome.storage.sync.get = vi
        .fn()
        .mockRejectedValue(new Error("disk error"));

      const res = await getCustomBangs();
      expect(res).toEqual({});

      (globalThis as any).chrome.storage.sync.get = originalGet;
    });

    it("rethrows error when saveCustomBangs fails", async () => {
      const originalSet = (globalThis as any).chrome.storage.sync.set;
      (globalThis as any).chrome.storage.sync.set = vi
        .fn()
        .mockRejectedValue(new Error("Disk write error"));

      await expect(
        saveCustomBangs({ "!fail": "https://fail.com?q=%s" }),
      ).rejects.toThrow("Disk write error");

      (globalThis as any).chrome.storage.sync.set = originalSet;
    });
  });
});
