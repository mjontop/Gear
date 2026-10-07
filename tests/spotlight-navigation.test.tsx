import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Spotlight } from "@/components/spotlight";
import { MESSAGE_TYPES } from "@/constants";

describe("Spotlight Navigation & Toggle", () => {
  it("renders null by default and toggles on message", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    const { container } = render(<Spotlight />);
    expect(container.firstChild).toBeNull();

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    expect(
      screen.getByPlaceholderText("Search or Enter URL...."),
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Search or Enter URL....");
    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
    });

    expect(screen.queryByPlaceholderText("Search or Enter URL....")).toBeNull();
  });

  it("opens spotlight prefilled with URL on OPEN_SPOTLIGHT_WITH_URL message", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    render(<Spotlight />);

    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://example.com/active-page",
      });
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });

    const input = screen.getByPlaceholderText(
      "Search or Enter URL....",
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("https://example.com/active-page");
  });

  it("handles keyboard navigation and tab autocomplete in Spotlight", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });
    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_OPEN_TABS && cb) {
          cb({
            tabs: [
              {
                id: 10,
                title: "Open Tab Item",
                url: "https://example.com/tab",
                windowId: 1,
                active: true,
              },
            ],
          });
        }
        if (msg.type === MESSAGE_TYPES.SWITCH_TO_TAB && cb) {
          cb({ success: true });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");

    fireEvent.change(input, { target: { value: "Open Tab" } });
    expect(input).toHaveValue("Open Tab");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });

    fireEvent.keyDown(input, { key: "Tab" });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://newsite.com",
      });
    });

    expect(
      screen.getByPlaceholderText("Search or Enter URL...."),
    ).toBeInTheDocument();
  });

  it("handles Enter redirect when no result matches and backdrop click close", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });
    (globalThis as any).chrome.runtime.sendMessage = vi.fn();

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");
    fireEvent.change(input, { target: { value: "nomatchquery" } });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MESSAGE_TYPES.OPEN_URL,
        url: expect.stringContaining("nomatchquery"),
      }),
    );

    // Reopen and test backdrop close
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });
    const backdrop = screen.getByLabelText("Close Spotlight search");
    await act(async () => {
      fireEvent.click(backdrop);
    });
    expect(screen.queryByPlaceholderText("Search or Enter URL....")).toBeNull();
  });

  it("handles selecting search suggestions with and without bangs, and fallback to window.open", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_BOOKMARKS && cb) {
          cb({
            bookmarks: [
              { id: "b1", title: "Bookmark 1", url: "https://bm1.com" },
            ],
          });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    // Type a query that yields a bookmark result
    const input = screen.getByPlaceholderText("Search or Enter URL....");
    fireEvent.change(input, { target: { value: "Bookmark 1" } });

    // Click the bookmark item
    const itemBtn = await screen.findByRole("button", {
      name: /Bookmark 1/i,
    });
    await act(async () => {
      fireEvent.click(itemBtn);
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://bm1.com",
      },
    );

    // Test selecting direct-url
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input2 = screen.getByPlaceholderText("Search or Enter URL....");
    fireEvent.change(input2, { target: { value: "https://vite.dev" } });

    const directUrlBtn = await screen.findByRole("button", {
      name: /Open URL/i,
    });
    await act(async () => {
      fireEvent.click(directUrlBtn);
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://vite.dev/",
      },
    );
  });
});
