import { describe, it, expect } from "vitest";
import { isValidUrl, getRedirectUrl } from "@/lib/redirect";

describe("isValidUrl", () => {
  it("returns null for empty or whitespace-only strings", () => {
    expect(isValidUrl("")).toBeNull();
    expect(isValidUrl("   ")).toBeNull();
  });

  it("recognizes browser internal schemes", () => {
    expect(isValidUrl("about:blank")).toBe("about:blank");
    expect(isValidUrl("about:config")).toBe("about:config");
    expect(isValidUrl("chrome://extensions")).toBe("chrome://extensions");
    expect(isValidUrl("moz-extension://1234-uuid/index.html")).toBe(
      "moz-extension://1234-uuid/index.html",
    );
    expect(isValidUrl("edge://settings")).toBe("edge://settings");
    expect(isValidUrl("brave://flags")).toBe("brave://flags");
  });

  it("recognizes Windows local file paths and converts to file:/// URL", () => {
    expect(isValidUrl("C:\\Users\\name\\file.txt")).toBe(
      "file:///C:/Users/name/file.txt",
    );
    expect(isValidUrl("D:/Documents/report.pdf")).toBe(
      "file:///D:/Documents/report.pdf",
    );
  });

  it("recognizes file:/// URLs", () => {
    expect(isValidUrl("file:///C:/test.txt")).toBe("file:///C:/test.txt");
  });

  it("rejects multi-word strings with spaces", () => {
    expect(isValidUrl("hello world")).toBeNull();
    expect(isValidUrl("how to install react")).toBeNull();
    expect(isValidUrl("github.com /test")).toBeNull();
  });

  it("recognizes valid domain names and prepends https:// by default", () => {
    expect(isValidUrl("google.com")).toBe("https://google.com/");
    expect(isValidUrl("github.com/manikantjha/gear")).toBe(
      "https://github.com/manikantjha/gear",
    );
    expect(isValidUrl("https://news.ycombinator.com")).toBe(
      "https://news.ycombinator.com/",
    );
    expect(isValidUrl("http://example.com")).toBe("http://example.com/");
  });

  it("recognizes localhost and 127.0.0.1 and prepends http:// by default", () => {
    expect(isValidUrl("localhost")).toBe("http://localhost/");
    expect(isValidUrl("localhost:3000")).toBe("http://localhost:3000/");
    expect(isValidUrl("127.0.0.1:8080")).toBe("http://127.0.0.1:8080/");
  });

  it("rejects invalid hostnames", () => {
    expect(isValidUrl("not_a_valid_hostname")).toBeNull();
    expect(isValidUrl("xyz")).toBeNull();
  });

  it("handles malformed URLs that throw during URL construction", () => {
    expect(isValidUrl("chrome://test:999999")).toBeNull();
    expect(isValidUrl("https://test:999999")).toBeNull();
  });

  it("handles error during URL construction for Windows paths and file URLs", () => {
    const OriginalURL = globalThis.URL;
    class ThrowingURL extends OriginalURL {
      constructor(url: string | URL, base?: string | URL) {
        if (
          typeof url === "string" &&
          (url.startsWith("file:///") || url.includes("mock-fail"))
        ) {
          throw new Error("Invalid URL");
        }
        super(url, base);
      }
    }
    globalThis.URL = ThrowingURL;

    try {
      expect(isValidUrl("C:\\mock-fail\\test.txt")).toBeNull();
      expect(isValidUrl("file:///mock-fail/test.txt")).toBeNull();
    } finally {
      globalThis.URL = OriginalURL;
    }
  });
});

describe("getRedirectUrl", () => {
  it("returns valid URLs directly without running a search query", () => {
    expect(getRedirectUrl("github.com")).toBe("https://github.com/");
    expect(getRedirectUrl("https://example.com/test")).toBe(
      "https://example.com/test",
    );
    expect(getRedirectUrl("about:blank")).toBe("about:blank");
  });

  it("resolves built-in bangs to their respective search destinations", () => {
    expect(getRedirectUrl("!g react hooks")).toBe(
      "https://www.google.com/search?q=react%20hooks",
    );
    expect(getRedirectUrl("!wi typescript")).toBe(
      "https://www.google.com/search?q=typescript+site:wikipedia.org",
    );
    expect(getRedirectUrl("!yt lo-fi beats")).toBe(
      "https://www.youtube.com/results?search_query=lo-fi%20beats",
    );
  });

  it("falls back to the configured search provider when no bang is present", () => {
    expect(getRedirectUrl("learn rust", "google")).toBe(
      "https://www.google.com/search?q=learn%20rust",
    );
    expect(getRedirectUrl("learn rust", "duckduckgo")).toBe(
      "https://duckduckgo.com/?q=learn%20rust",
    );
    expect(getRedirectUrl("learn rust", "bing")).toBe(
      "https://www.bing.com/search?q=learn%20rust",
    );
    expect(getRedirectUrl("learn rust", "brave")).toBe(
      "https://search.brave.com/search?q=learn%20rust",
    );
  });

  it("falls back to default provider if unknown provider is supplied", () => {
    expect(getRedirectUrl("vite react", "unknown" as any)).toBe(
      "https://www.google.com/search?q=vite%20react",
    );
  });
});
