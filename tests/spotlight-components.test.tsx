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

      render(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue="test search"
          validUrl={null}
          results={mockResults}
          selectedTabIndex={0}
          onClose={onClose}
          onSearchChange={onSearchChange}
          onKeyDown={onKeyDown}
          onSelectResult={onSelect}
        />,
      );

      const input = screen.getByPlaceholderText("Search or Enter URL....");
      expect(input).toHaveValue("test search");

      fireEvent.change(input, { target: { value: "new query" } });
      expect(onSearchChange).toHaveBeenCalledWith("new query");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(onKeyDown).toHaveBeenCalled();

      const backdrop = screen.getByLabelText("Close Spotlight search");
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
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

      fireEvent.keyDown(input, { key: "Enter" });

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
  });
});
