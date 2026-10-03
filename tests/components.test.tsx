import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyUrlToast } from "@/content/components/CopyUrlToast";
import { SuggestionItem } from "@/components/spotlight/components/suggestion-item";
import { MESSAGE_TYPES } from "@/constants";

describe("UI Components", () => {
  it("renders and interacts with CopyUrlToast upon receiving message", async () => {
    let msgListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      msgListener = fn;
    });

    const { container } = render(<CopyUrlToast />);
    expect(container.firstChild).toBeNull();

    await act(async () => {
      await msgListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://example.com",
      });
    });

    expect(await screen.findByText("Copied Current URL")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Click to dismiss"));
    expect(screen.queryByText("Copied Current URL")).toBeNull();
  });

  it("handles CopyUrlToast with navigator.clipboard and auto-dismiss timer", async () => {
    vi.useFakeTimers();
    let msgListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      msgListener = fn;
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
    (window as any).isSecureContext = true;

    render(<CopyUrlToast />);

    await act(async () => {
      await msgListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
      });
    });

    expect(writeTextMock).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByText("Copied Current URL")).toBeInTheDocument();

    // Trigger another message before timer expires to cover timerRef clear
    await act(async () => {
      await msgListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://second.com",
      });
    });

    // Advance timers by 2500ms
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.queryByText("Copied Current URL")).toBeNull();
    vi.useRealTimers();
  });

  it("handles CopyUrlToast clipboard rejection fallback", async () => {
    let msgListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      msgListener = fn;
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });
    (window as any).isSecureContext = true;

    document.execCommand = vi.fn().mockReturnValue(true);

    render(<CopyUrlToast />);

    await act(async () => {
      await msgListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://exec-fallback.com",
      });
    });

    expect(await screen.findByText("Copied Current URL")).toBeInTheDocument();
  });

  it("renders SuggestionItem and handles onSelect, audio indicators, and fallbacks", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <SuggestionItem
        item={{
          id: "1",
          title: "Vitest Testing",
          url: "https://vitest.dev",
          audible: true,
          muted: false,
        }}
        isSelected={true}
        onSelect={onSelect}
        actionLabel="Switch to Tab"
      />,
    );

    expect(screen.getByText("Vitest Testing")).toBeInTheDocument();
    expect(screen.getByText("Switch to Tab")).toBeInTheDocument();
    expect(screen.getByLabelText("Playing audio")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();

    // Rerender with muted tab and favicon
    rerender(
      <SuggestionItem
        item={{
          id: "2",
          title: "Muted Tab",
          url: "https://muted.com",
          favIconUrl: "https://muted.com/favicon.ico",
          audible: true,
          muted: true,
        }}
        isSelected={false}
        isActive={true}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByLabelText("Tab is muted")).toBeInTheDocument();

    const img = screen.getByRole("button").querySelector("img");
    expect(img).toBeInTheDocument();
    // Trigger image error
    fireEvent.error(img!);

    // Rerender with empty title / no favicon to test GlobeIcon fallback
    rerender(
      <SuggestionItem
        item={{ id: "3", title: "", url: "https://empty.com" }}
        isSelected={false}
        onSelect={onSelect}
      />,
    );
    expect(
      screen.getByRole("button").querySelector(".search_suggestion_icon"),
    ).toBeInTheDocument();
  });
});
