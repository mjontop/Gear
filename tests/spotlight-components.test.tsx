import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { createRef } from "react";
import { ActiveTabs } from "@/components/spotlight/components/active-tabs";
import type { SpotlightResultData } from "@/components/spotlight/components/active-tabs";
import { SpotlightView } from "@/components/spotlight/components/spotlight-view";
import { Spotlight } from "@/components/spotlight";
import { MESSAGE_TYPES } from "@/constants";

describe("Spotlight UI and Views", () => {
  const mockResults: SpotlightResultData[] = [
    {
      id: "tab-1",
      kind: "open-tab",
      title: "GitHub Home",
      url: "https://github.com",
      windowId: 1,
      active: true,
      priority: 10,
    },
    {
      id: "direct-1",
      kind: "direct-url",
      title: "Open URL",
      url: "https://google.com",
      priority: 9,
    },
    {
      id: "bm-1",
      kind: "bookmark",
      title: "Documentation",
      url: "https://react.dev",
      priority: 8,
    },
    {
      id: "hist-1",
      kind: "history",
      title: "StackOverflow Question",
      url: "https://stackoverflow.com/questions/1",
      priority: 7,
    },
    {
      id: "sug-1",
      kind: "search-suggestion",
      title: "react testing library",
      query: "react testing library",
      url: "https://google.com/search?q=react",
      priority: 6,
    },
  ];

  describe("ActiveTabs", () => {
    it("returns null when results array is empty", () => {
      const { container } = render(
        <ActiveTabs results={[]} selectedIndex={0} onSelectResult={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders all result kinds with their respective labels and icons", () => {
      const onSelect = vi.fn();
      render(
        <ActiveTabs
          results={mockResults}
          selectedIndex={0}
          onSelectResult={onSelect}
        />,
      );

      expect(screen.getByText("GitHub Home")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("StackOverflow Question")).toBeInTheDocument();
      expect(screen.getByText("react testing library")).toBeInTheDocument();

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(mockResults.length);

      fireEvent.click(buttons[1]);
      expect(onSelect).toHaveBeenCalledWith(mockResults[1]);
    });

    it("handles unknown result kind gracefully with undefined action and fallback", () => {
      const unknownResult = {
        id: "unknown-1",
        kind: "custom-unknown" as any,
        title: "Unknown Item",
        url: "https://unknown.com",
        priority: 1,
      };

      const { container } = render(
        <ActiveTabs
          results={[unknownResult]}
          selectedIndex={0}
          onSelectResult={vi.fn()}
        />,
      );

      expect(container.querySelector(".suggestion_title")).toHaveTextContent(
        "Unknown Item",
      );
    });
  });

  describe("SpotlightView", () => {
    it("renders dialog and interacts with search input", () => {
      const inputRef = createRef<HTMLInputElement>();
      const overlayRef = createRef<HTMLDialogElement>();
      const onSearchChange = vi.fn();
      const onKeyDown = vi.fn();
      const onClose = vi.fn();
      const onSelect = vi.fn();

      HTMLDialogElement.prototype.showModal = vi.fn(function (
        this: HTMLDialogElement,
      ) {
        this.open = true;
      });
      HTMLDialogElement.prototype.close = vi.fn(function (
        this: HTMLDialogElement,
      ) {
        this.open = false;
      });

      const { rerender } = render(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue="test search"
          validUrl={null}
          results={mockResults}
          selectedTabIndex={0}
          enableBackgroundBlur={false}
          shouldSelectInputText={true}
          onClose={onClose}
          onSearchChange={onSearchChange}
          onKeyDown={onKeyDown}
          onSelectResult={onSelect}
        />,
      );

      const dialog = overlayRef.current!;
      expect(dialog.classList.contains("spotlight_overlay_no_blur")).toBe(true);

      const input = screen.getByPlaceholderText("Search or Enter URL....");
      expect(input).toHaveValue("test search");

      fireEvent.change(input, { target: { value: "new query" } });
      expect(onSearchChange).toHaveBeenCalledWith("new query");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(onKeyDown).toHaveBeenCalled();

      const backdrop = screen.getByLabelText("Close Spotlight search");
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();

      // Trigger native cancel event
      fireEvent(dialog, new Event("cancel"));
      expect(onClose).toHaveBeenCalledTimes(2);

      // Rerender with validUrl
      rerender(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue="https://react.dev"
          validUrl="https://react.dev"
          results={mockResults}
          selectedTabIndex={0}
          enableBackgroundBlur={true}
          onClose={onClose}
          onSearchChange={onSearchChange}
          onKeyDown={onKeyDown}
          onSelectResult={onSelect}
        />,
      );
      expect(dialog.classList.contains("spotlight_overlay_no_blur")).toBe(
        false,
      );
    });
  });

  describe("Spotlight root component", () => {
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

      expect(
        screen.queryByPlaceholderText("Search or Enter URL...."),
      ).toBeNull();
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

      expect(
        (globalThis as any).chrome.runtime.sendMessage,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MESSAGE_TYPES.OPEN_URL,
          url: expect.stringContaining("nomatchquery"),
        }),
      );

      // Reopen and test backdrop close
      await act(async () => {
        messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
      });
      const backdrop = screen.getByLabelText("Close Spotlight search");
      await act(async () => {
        fireEvent.click(backdrop);
      });
      expect(
        screen.queryByPlaceholderText("Search or Enter URL...."),
      ).toBeNull();
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

      expect(
        (globalThis as any).chrome.runtime.sendMessage,
      ).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://bm1.com",
      });

      // Test selecting direct-url
      await act(async () => {
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

      expect(
        (globalThis as any).chrome.runtime.sendMessage,
      ).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://vite.dev/",
      });
    });

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

      expect(
        (globalThis as any).chrome.runtime.sendMessage,
      ).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=react%20docs",
      });
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

      expect(
        (globalThis as any).chrome.runtime.sendMessage,
      ).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://www.google.com/search?q=react%20plain",
      });
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
      const originalSendMessage = (globalThis as any).chrome.runtime
        .sendMessage;
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
  });
});
