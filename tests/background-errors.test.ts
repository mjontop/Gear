import { describe, it, expect, vi, beforeAll } from "vitest";
import { MESSAGE_TYPES } from "@/constants";

describe("background script error handling", () => {
  let messageListener: (msg: any, sender: any, sendResponse: any) => boolean;

  beforeAll(async () => {
    (globalThis as any).chrome.runtime.onMessage.addListener = (fn: any) => {
      messageListener = fn;
    };

    await import("@/background");
  });

  it("handles failure in GET_OPEN_TABS", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockRejectedValue(new Error("Tabs error"));

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_OPEN_TABS },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ tabs: [] });
  });

  it("handles failure in SWITCH_TO_TAB", async () => {
    (globalThis as any).chrome.tabs.update = vi
      .fn()
      .mockRejectedValue(new Error("Tab update error"));

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.SWITCH_TO_TAB, tabId: 99, windowId: 1 },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ success: false });
  });

  it("handles failure in OPEN_URL", async () => {
    (globalThis as any).chrome.tabs.create = vi
      .fn()
      .mockRejectedValue(new Error("Create failed"));

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.OPEN_URL, url: "https://badurl.com" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ success: false });
  });

  it("handles failure in GET_BOOKMARKS", async () => {
    (globalThis as any).chrome.bookmarks.getRecent = vi
      .fn()
      .mockRejectedValue(new Error("Bookmarks error"));

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_BOOKMARKS, query: "" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ bookmarks: [] });
  });

  it("handles failure in GET_HISTORY", async () => {
    (globalThis as any).chrome.history.search = vi
      .fn()
      .mockRejectedValue(new Error("History error"));

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_HISTORY, query: "error test" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ history: [] });
  });

  it("returns false for unknown runtime messages", () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: "UNKNOWN_ACTION" } as any,
      {},
      sendResponse,
    );
    expect(willRespond).toBe(false);
  });
});
