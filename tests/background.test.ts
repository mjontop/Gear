import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { COMMAND_NAMES, MESSAGE_TYPES } from "@/constants";

describe("background script", () => {
  let commandListener: (cmd: string) => Promise<void>;
  let messageListener: (msg: any, sender: any, sendResponse: any) => boolean;
  let tabUpdatedListener: (tabId: number, changeInfo: any, tab: any) => void;

  let backgroundModule: any;

  beforeAll(async () => {
    (globalThis as any).chrome.commands.onCommand.addListener = (fn: any) => {
      commandListener = fn;
    };
    (globalThis as any).chrome.runtime.onMessage.addListener = (fn: any) => {
      messageListener = fn;
    };
    (globalThis as any).chrome.tabs.onUpdated.addListener = (fn: any) => {
      tabUpdatedListener = fn;
    };

    backgroundModule = await import("@/background");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    backgroundModule?.resetCommandLatches();
  });

  it("handles toggle-spotlight command on unrestricted tab", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 101, url: "https://example.com" }]);

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(
      101,
      {
        type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT,
      },
    );
  });

  it("ignores toggle-spotlight on restricted tab", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 102, url: "chrome://extensions" }]);

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);

    expect((globalThis as any).chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("handles copy-current-url command", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 103, url: "https://github.com" }]);

    await commandListener(COMMAND_NAMES.COPY_CURRENT_URL);

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(
      103,
      {
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://github.com",
      },
    );
  });

  it("handles open-spotlight-with-url command", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 104, url: "https://vitest.dev" }]);

    await commandListener(COMMAND_NAMES.OPEN_SPOTLIGHT_WITH_URL);

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(
      104,
      {
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://vitest.dev",
      },
    );
  });

  it("ignores unrecognized commands", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 105, url: "https://vitest.dev" }]);

    await commandListener("unknown-command");

    expect((globalThis as any).chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("handles runtime message: GET_OPEN_TABS", async () => {
    (globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([
      {
        id: 1,
        title: "Tab 1",
        url: "https://tab1.com",
        active: false,
        index: 0,
        windowId: 1,
      },
    ]);

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_OPEN_TABS },
      { tab: { id: 2 } },
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalled();
  });

  it("handles runtime message: SWITCH_TO_TAB", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.SWITCH_TO_TAB, tabId: 5, windowId: 1 },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it("handles runtime message: OPEN_URL", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.OPEN_URL, url: "https://newsite.com" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://newsite.com",
    });
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it("handles runtime message: GET_SEARCH_SUGGESTIONS", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      {
        type: MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS,
        query: "   ",
        provider: "google",
      },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ suggestions: [] });
  });

  it("handles runtime message: GET_SEARCH_SUGGESTIONS failure fallback", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      {
        type: MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS,
        query: null as any,
        provider: "google",
      },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ suggestions: [] });
  });

  it("handles runtime message: GET_BOOKMARKS", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_BOOKMARKS, query: "test" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalled();
  });

  it("handles runtime message: GET_HISTORY", async () => {
    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_HISTORY, query: "test" },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalled();
  });

  it("handles tabs.sendMessage rejection gracefully on commands", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 105, url: "https://example.com" }]);
    (globalThis as any).chrome.tabs.sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("Frame error"));

    await expect(
      commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT),
    ).resolves.not.toThrow();
    await expect(
      commandListener(COMMAND_NAMES.COPY_CURRENT_URL),
    ).resolves.not.toThrow();
    await expect(
      commandListener(COMMAND_NAMES.OPEN_SPOTLIGHT_WITH_URL),
    ).resolves.not.toThrow();
  });

  it("ignores commands when no active tab is found", async () => {
    (globalThis as any).chrome.tabs.query = vi.fn().mockResolvedValue([]);

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);
    await commandListener(COMMAND_NAMES.COPY_CURRENT_URL);
    await commandListener(COMMAND_NAMES.OPEN_SPOTLIGHT_WITH_URL);

    expect((globalThis as any).chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("handles tab updated discarded event", async () => {
    const removeSpy = vi
      .spyOn(chrome.tabs, "remove")
      .mockResolvedValue(undefined as any);

    await tabUpdatedListener(
      55,
      { discarded: true },
      { id: 55, url: "https://example.com/disc", title: "Discarded" },
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(removeSpy).toHaveBeenCalledWith(55);
  });

  it("ignores tab updated event when discarded is false or missing", async () => {
    const removeSpy = vi
      .spyOn(chrome.tabs, "remove")
      .mockResolvedValue(undefined as any);

    await tabUpdatedListener(
      55,
      { status: "complete" },
      { id: 55, url: "https://example.com/disc", title: "Discarded" },
    );

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("suppresses repeated command triggers while held and resets on SHORTCUT_KEY_UP", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 101, url: "https://example.com" }]);

    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);
    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledTimes(
      1,
    );

    // Repeated triggers while held
    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);
    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledTimes(
      1,
    );

    // Key released
    messageListener({ type: MESSAGE_TYPES.SHORTCUT_KEY_UP }, {}, () => {});

    // Next press triggers again
    await commandListener(COMMAND_NAMES.TOGGLE_SPOTLIGHT);
    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledTimes(
      2,
    );
  });
});
