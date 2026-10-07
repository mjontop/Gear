import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SidebarArchiveView } from "@/components/sidebar/components/SidebarArchiveView";
import { MESSAGE_TYPES } from "@/constants";

describe("SidebarArchiveView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders closed tabs showing only title by default and allows copying URL", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    vi.spyOn(chrome.runtime, "sendMessage").mockImplementation(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_ARCHIVED_TABS && cb) {
          cb({
            tabs: [
              {
                id: "tab-1",
                title: "GitHub Repository",
                url: "https://github.com/manikantjha/gear",
                favIconUrl: "https://github.com/favicon.ico",
                discardedAt: Date.now() - 1000,
              },
            ],
          });
        }
        if (msg.type === MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS && cb) {
          cb({
            tabs: [
              {
                id: "tab-2",
                title: "Manual Closed Page",
                url: "https://example.com/manual-doc",
                closedAt: Date.now() - 2000,
              },
            ],
          });
        }
      },
    );

    const onBack = vi.fn();
    const onClose = vi.fn();

    render(<SidebarArchiveView onBack={onBack} onClose={onClose} />);

    // Shows title
    expect(screen.getByText("GitHub Repository")).toBeInTheDocument();

    // Has URL tooltip on main item button
    const mainItemBtn = screen.getByRole("button", {
      name: "GitHub Repository",
    });
    expect(mainItemBtn).toHaveAttribute(
      "title",
      "https://github.com/manikantjha/gear",
    );

    // Verify copy button exists
    const copyBtn = screen.getByRole("button", {
      name: "Copy URL",
    });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).toHaveAttribute("title", "Copy URL");

    // Click copy button
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Should have copied the full URL
    expect(writeTextMock).toHaveBeenCalledWith(
      "https://github.com/manikantjha/gear",
    );

    // Should NOT have opened URL or closed sidebar
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: MESSAGE_TYPES.OPEN_URL,
      }),
    );
    expect(onClose).not.toHaveBeenCalled();

    // Feedback shows copied title
    expect(copyBtn).toHaveAttribute("title", "Copied!");

    // Switch active filter to manual
    const filterToggleBtn = screen.getByRole("button", {
      name: /Toggle filters/i,
    });
    fireEvent.click(filterToggleBtn);

    const manualFilterBtn = screen.getByRole("button", {
      name: /Manual closed/i,
    });
    fireEvent.click(manualFilterBtn);

    expect(screen.getByText("Manual Closed Page")).toBeInTheDocument();

    const manualCopyBtn = screen.getByRole("button", {
      name: "Copy URL",
    });
    expect(manualCopyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(manualCopyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      "https://example.com/manual-doc",
    );
  });

  it("navigates to url and closes sidebar when clicking main item button", () => {
    vi.spyOn(chrome.runtime, "sendMessage").mockImplementation(
      (msg: any, cb: any) => {
        if (msg.type === MESSAGE_TYPES.GET_ARCHIVED_TABS && cb) {
          cb({
            tabs: [
              {
                id: "tab-1",
                title: "Test Tab",
                url: "https://test.com",
                discardedAt: Date.now(),
              },
            ],
          });
        }
      },
    );

    const onBack = vi.fn();
    const onClose = vi.fn();

    render(<SidebarArchiveView onBack={onBack} onClose={onClose} />);

    const itemBtn = screen.getByRole("button", { name: /Test Tab/i });
    expect(itemBtn).toHaveAttribute("title", "https://test.com");
    fireEvent.click(itemBtn);

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.OPEN_URL,
      url: "https://test.com",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
