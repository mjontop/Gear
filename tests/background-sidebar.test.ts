import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import {
  ARCHIVED_TABS_STORAGE_KEY,
  COMMAND_NAMES,
  MESSAGE_TYPES,
} from "@/constants";

describe("background script - sidebar handlers", () => {
  let commandListener: (cmd: string) => Promise<void>;
  let messageListener: (msg: any, sender: any, sendResponse: any) => boolean;

  beforeAll(async () => {
    (globalThis as any).chrome.commands.onCommand.addListener = (fn: any) => {
      commandListener = fn;
    };
    (globalThis as any).chrome.runtime.onMessage.addListener = (fn: any) => {
      messageListener = fn;
    };

    await import("@/background");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles toggle-sidebar command on unrestricted tab", async () => {
    (globalThis as any).chrome.tabs.query = vi
      .fn()
      .mockResolvedValue([{ id: 201, url: "https://example.com" }]);

    await commandListener(COMMAND_NAMES.TOGGLE_SIDEBAR);

    expect((globalThis as any).chrome.tabs.sendMessage).toHaveBeenCalledWith(
      201,
      {
        type: MESSAGE_TYPES.TOGGLE_SIDEBAR,
      },
    );
  });

  it("handles runtime message: GET_ARCHIVED_TABS", async () => {
    (globalThis as any).chrome.storage.local.get = vi.fn().mockResolvedValue({
      [ARCHIVED_TABS_STORAGE_KEY]: [
        {
          id: "arc-1",
          url: "https://example.com/archived",
          title: "Archived Tab",
          discardedAt: Date.now(),
        },
      ],
    });

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_ARCHIVED_TABS },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({
      tabs: expect.arrayContaining([expect.objectContaining({ id: "arc-1" })]),
    });
  });

  it("handles runtime message: GET_RECENTLY_CLOSED_TABS", async () => {
    (globalThis as any).chrome.sessions.getRecentlyClosed = vi
      .fn()
      .mockResolvedValue([
        {
          lastModified: 1000,
          tab: { url: "https://rec.com", title: "Rec Tab" },
        },
      ]);

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({
      tabs: expect.arrayContaining([
        expect.objectContaining({ url: "https://rec.com" }),
      ]),
    });
  });

  it("handles runtime message: GET_DOWNLOADS", async () => {
    (globalThis as any).chrome.downloads.search = vi.fn().mockResolvedValue([
      {
        id: 11,
        filename: "C:/file.pdf",
        url: "https://file.pdf",
        state: "complete",
        startTime: "2026-03-30T10:00:00Z",
      },
    ]);

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.GET_DOWNLOADS },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({
      downloads: expect.arrayContaining([expect.objectContaining({ id: 11 })]),
    });
  });

  it("handles runtime message: OPEN_DOWNLOAD", async () => {
    (globalThis as any).chrome.downloads.open = vi
      .fn()
      .mockResolvedValue(undefined);

    const sendResponse = vi.fn();
    const willRespond = messageListener(
      { type: MESSAGE_TYPES.OPEN_DOWNLOAD, downloadId: 11 },
      {},
      sendResponse,
    );

    expect(willRespond).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});
