import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { ActiveTabs } from "@/components/spotlight/components/active-tabs";
import type { SpotlightResultData } from "@/components/spotlight/components/active-tabs";
import { SpotlightView } from "@/components/spotlight/components/spotlight-view";

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

    it("applies custom style preferences to dialog and container", () => {
      const inputRef = createRef<HTMLInputElement>();
      const overlayRef = createRef<HTMLDialogElement>();

      const { container } = render(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue=""
          validUrl={null}
          results={[]}
          selectedTabIndex={0}
          preferences={{
            includeBookmarks: true,
            includeHistory: true,
            searchProvider: "google",
            enableBackgroundBlur: true,
            theme: "dark",
            fontSize: 20,
            fontWeight: "600",
            fontFamily: "Inter",
            fontColor: "#ffffff",
            secondaryFontColor: "#aaaaaa",
            accentColor: "#38bdf8",
            borderRadius: 18,
          }}
          onClose={vi.fn()}
          onSearchChange={vi.fn()}
          onKeyDown={vi.fn()}
          onSelectResult={vi.fn()}
        />,
      );

      const dialog = overlayRef.current!;
      expect(dialog.style.getPropertyValue("--spotlight-font-size")).toBe(
        "20px",
      );
      expect(dialog.style.getPropertyValue("--spotlight-font-weight")).toBe(
        "600",
      );
      expect(dialog.style.getPropertyValue("--spotlight-font-color")).toBe(
        "#ffffff",
      );
      expect(dialog.style.getPropertyValue("--spotlight-border-radius")).toBe(
        "18px",
      );

      const spotlightContainer = container.querySelector(
        ".spotlight_container",
      ) as HTMLElement;
      expect(
        spotlightContainer.style.getPropertyValue("--spotlight-border-radius"),
      ).toBe("18px");
    });

    it("handles shouldSelectInputText, enableBackgroundBlur disabled, and dialog cleanup", () => {
      const inputRef = createRef<HTMLInputElement>();
      const overlayRef = createRef<HTMLDialogElement>();

      const { unmount, rerender } = render(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue="initial text"
          validUrl={null}
          results={[]}
          selectedTabIndex={0}
          enableBackgroundBlur={false}
          shouldSelectInputText={true}
          preferences={{
            includeBookmarks: true,
            includeHistory: true,
            searchProvider: "google",
            enableBackgroundBlur: false,
            theme: "dark",
          }}
          onClose={vi.fn()}
          onSearchChange={vi.fn()}
          onKeyDown={vi.fn()}
          onSelectResult={vi.fn()}
        />,
      );

      const dialog = overlayRef.current!;
      expect(dialog.classList.contains("spotlight_overlay_no_blur")).toBe(true);
      expect(dialog.showModal).toHaveBeenCalled();

      // Rerender when dialog is already open to verify early return
      rerender(
        <SpotlightView
          inputRef={inputRef}
          overlayRef={overlayRef}
          searchValue="changed text"
          validUrl={null}
          results={[]}
          selectedTabIndex={0}
          enableBackgroundBlur={false}
          shouldSelectInputText={true}
          preferences={{
            includeBookmarks: true,
            includeHistory: true,
            searchProvider: "google",
            enableBackgroundBlur: false,
            theme: "dark",
          }}
          onClose={vi.fn()}
          onSearchChange={vi.fn()}
          onKeyDown={vi.fn()}
          onSelectResult={vi.fn()}
        />,
      );

      unmount();
      expect(dialog.close).toHaveBeenCalled();
    });
  });
});
