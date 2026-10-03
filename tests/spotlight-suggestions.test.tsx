import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Spotlight } from "@/components/spotlight";
import { MESSAGE_TYPES } from "@/constants";

describe("Spotlight Suggestions & Autocompletion", () => {
  it("handles selecting search suggestion with bang", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS && cb) {
          cb({
            suggestions: [
              {
                id: "s_react_docs",
                title: "react docs",
                url: "",
                query: "react docs",
              },
            ],
          });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");

    fireEvent.change(input, { target: { value: "!g react" } });

    const suggestionBtn = await screen.findByRole("button", {
      name: /react docs/i,
    });

    await act(async () => {
      fireEvent.click(suggestionBtn);
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=react%20docs",
      },
    );
  });

  it("handles selecting search suggestion without bang", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS && cb) {
          cb({
            suggestions: [
              {
                id: "s_react_plain",
                title: "react plain",
                url: "",
                query: "react plain",
              },
            ],
          });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");

    fireEvent.change(input, { target: { value: "react" } });

    const suggestionBtn = await screen.findByRole("button", {
      name: /react plain/i,
    });

    await act(async () => {
      fireEvent.click(suggestionBtn);
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=react%20plain",
      },
    );
  });

  it("handles ArrowDown, ArrowUp, and Tab when no spotlight results exist", async () => {
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
    fireEvent.change(input, { target: { value: "" } });

    // When empty, spotlightResults is empty
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Tab" });

    expect(input).toHaveValue("");
  });

  it("handles Tab autocompletion on search suggestion and fallback to window.open", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS && cb) {
          cb({
            suggestions: [
              {
                id: "s_auto",
                title: "react autocompleted query",
                url: "",
                query: "react autocompleted query",
              },
            ],
          });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");
    fireEvent.change(input, { target: { value: "react" } });

    await screen.findByRole("button", {
      name: /react autocompleted query/i,
    });

    // Press Tab to autocomplete input
    await act(async () => {
      fireEvent.keyDown(input, { key: "Tab" });
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });
    expect(input).toHaveValue("react autocompleted query");

    // Test window.open fallback when chrome.runtime.sendMessage is absent
    const originalSendMessage = (globalThis as any).chrome.runtime.sendMessage;
    delete (globalThis as any).chrome.runtime.sendMessage;
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    try {
      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining("react"),
        "_blank",
        "noopener",
      );
    } finally {
      (globalThis as any).chrome.runtime.sendMessage = originalSendMessage;
      windowOpenSpy.mockRestore();
    }
  });

  it("handles search suggestion with active bang format", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    (globalThis as any).chrome.runtime.sendMessage = vi.fn(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_SEARCH_SUGGESTIONS && cb) {
          cb({
            suggestions: [
              {
                id: "s_bang",
                title: "gear repo",
                url: "",
                query: "gear repo",
              },
            ],
          });
        }
      },
    );

    render(<Spotlight />);

    await act(async () => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    const input = screen.getByPlaceholderText("Search or Enter URL....");
    fireEvent.change(input, { target: { value: "!wi gear" } });

    const suggestionBtn = await screen.findByRole("button", {
      name: /gear repo/i,
    });

    await act(async () => {
      fireEvent.click(suggestionBtn);
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=gear%20repo+site:wikipedia.org",
      },
    );
  });

  it("redirects to web search provider on Enter when no result is selected", async () => {
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
    fireEvent.change(input, { target: { value: "my direct search" } });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=my%20direct%20search",
      },
    );
  });
});
