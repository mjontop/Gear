import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Sidebar } from "@/components/sidebar";
import { SidebarMainView } from "@/components/sidebar/components/SidebarMainView";
import { SidebarArchiveView } from "@/components/sidebar/components/SidebarArchiveView";
import { SidebarDownloadsView } from "@/components/sidebar/components/SidebarDownloadsView";
import { MESSAGE_TYPES } from "@/constants";

describe("Sidebar Components", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Sidebar Root Drawer", () => {
    it("renders nothing by default and toggles on message or Alt+S", () => {
      let messageListener: any;
      vi.spyOn(chrome.runtime.onMessage, "addListener").mockImplementation(
        (fn) => {
          messageListener = fn;
        },
      );

      const { container } = render(<Sidebar />);
      expect(container).toBeEmptyDOMElement();

      // Toggle open via message
      act(() => {
        messageListener({ type: MESSAGE_TYPES.TOGGLE_SIDEBAR });
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Tabs & Bookmarks")).toBeInTheDocument();

      // Close on Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Toggle open via Alt+S
      fireEvent.keyDown(window, { key: "s", altKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes when backdrop is clicked", () => {
      render(<Sidebar defaultOpen={true} />);
      const backdrop = document.querySelector(".sidebar_backdrop");
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("SidebarMainView", () => {
    it("renders bookmarks accordion and open tabs list", async () => {
      vi.spyOn(chrome.runtime, "sendMessage").mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_BOOKMARKS && cb) {
            cb({
              bookmarks: [
                { id: "b1", title: "GitHub", url: "https://github.com" },
              ],
            });
          }
          if (msg.type === MESSAGE_TYPES.GET_OPEN_TABS && cb) {
            cb({
              tabs: [
                {
                  id: 1,
                  windowId: 1,
                  title: "Active Tab",
                  url: "https://github.com",
                  active: true,
                },
              ],
            });
          }
        },
      );

      const onOpenArchive = vi.fn();
      const onOpenDownloads = vi.fn();
      const onClose = vi.fn();

      render(
        <SidebarMainView
          onOpenArchive={onOpenArchive}
          onOpenDownloads={onOpenDownloads}
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Bookmarks")).toBeInTheDocument();
      expect(screen.getByText("Open Tabs")).toBeInTheDocument();

      // Accordion toggle
      const accordionBtn = screen.getByRole("button", { name: /Bookmarks/i });
      fireEvent.click(accordionBtn);
      expect(screen.getAllByText("GitHub").length).toBeGreaterThan(0);

      // Open tab click
      const tabBtn = screen.getByRole("button", { name: /Active Tab/i });
      fireEvent.click(tabBtn);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.SWITCH_TO_TAB,
        tabId: 1,
        windowId: 1,
      });
      expect(onClose).toHaveBeenCalled();

      // View Archive button
      const archiveBtn = screen.getByRole("button", {
        name: /View Archive tabs/i,
      });
      fireEvent.click(archiveBtn);
      expect(onOpenArchive).toHaveBeenCalled();

      // Downloads button
      const downloadsBtn = screen.getByRole("button", { name: /Downloads/i });
      fireEvent.click(downloadsBtn);
      expect(onOpenDownloads).toHaveBeenCalled();
    });
  });

  describe("SidebarArchiveView", () => {
    it("renders archive search, filters, and items", async () => {
      vi.spyOn(chrome.runtime, "sendMessage").mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_ARCHIVED_TABS && cb) {
            cb({
              tabs: [
                {
                  id: "a1",
                  title: "Archived Tab",
                  url: "https://archived.com",
                  discardedAt: Date.now() - 3600000,
                },
              ],
            });
          }
          if (msg.type === MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS && cb) {
            cb({
              tabs: [
                {
                  id: "m1",
                  title: "Manual Tab",
                  url: "https://manual.com",
                  closedAt: Date.now() - 7200000,
                },
              ],
            });
          }
        },
      );

      const onBack = vi.fn();
      const onClose = vi.fn();

      render(<SidebarArchiveView onBack={onBack} onClose={onClose} />);

      expect(screen.getByText("Recently Closed")).toBeInTheDocument();
      expect(screen.getByText("Archived Tab")).toBeInTheDocument();

      // Toggle filter chips
      const filterToggleBtn = screen.getByLabelText(/Toggle filters/i);
      fireEvent.click(filterToggleBtn);

      const manualFilterBtn = screen.getByRole("button", {
        name: /Manual closed/i,
      });
      fireEvent.click(manualFilterBtn);
      expect(screen.getByText("Manual Tab")).toBeInTheDocument();

      // Search input
      const searchInput = screen.getByPlaceholderText(/Search Archive/i);
      fireEvent.change(searchInput, { target: { value: "Manual" } });
      expect(screen.getByText("Manual Tab")).toBeInTheDocument();

      // Click to open URL
      const itemBtn = screen.getByRole("button", { name: /Manual Tab/i });
      fireEvent.click(itemBtn);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_URL,
        url: "https://manual.com",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("SidebarDownloadsView", () => {
    it("renders downloads list and handles click to open", async () => {
      vi.spyOn(chrome.runtime, "sendMessage").mockImplementation(
        (msg: any, cb: any) => {
          if (msg.type === MESSAGE_TYPES.GET_DOWNLOADS && cb) {
            cb({
              downloads: [
                {
                  id: 99,
                  filename: "sample-guide.pdf",
                  url: "https://example.com/sample-guide.pdf",
                  fileSize: 1048576,
                  startTime: Date.now() - 1000,
                  state: "complete",
                },
              ],
            });
          }
        },
      );

      const onBack = vi.fn();
      const onClose = vi.fn();

      render(<SidebarDownloadsView onBack={onBack} onClose={onClose} />);

      expect(screen.getByText("Downloads")).toBeInTheDocument();
      expect(screen.getByText("sample-guide.pdf")).toBeInTheDocument();

      // Search
      const searchInput = screen.getByPlaceholderText(/Search Downloads/i);
      fireEvent.change(searchInput, { target: { value: "guide" } });
      expect(screen.getByText("sample-guide.pdf")).toBeInTheDocument();

      // Click download item
      const itemBtn = screen.getByRole("button", { name: /sample-guide.pdf/i });
      fireEvent.click(itemBtn);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: MESSAGE_TYPES.OPEN_DOWNLOAD,
        downloadId: 99,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
