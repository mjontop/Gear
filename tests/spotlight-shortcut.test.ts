import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpotlightShortcut } from "@/components/spotlight/hooks";
import { MESSAGE_TYPES } from "@/constants";

describe("useSpotlightShortcut", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("listens for TOGGLE_SPOTLIGHT message and toggles state", () => {
    const setIsOpen = vi.fn();
    const onToggle = vi.fn();

    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    renderHook(() => useSpotlightShortcut({ setIsOpen, onToggle }));

    act(() => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated TOGGLE_SPOTLIGHT messages while key is held down", () => {
    const setIsOpen = vi.fn();
    const onToggle = vi.fn();

    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    renderHook(() => useSpotlightShortcut({ setIsOpen, onToggle }));

    // First press
    act(() => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledTimes(1);

    // Repeated triggers (key hold)
    act(() => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledTimes(1);

    // Key released
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
    });

    // Next press toggles again
    act(() => {
      messageListener({ type: MESSAGE_TYPES.TOGGLE_SPOTLIGHT });
    });
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(setIsOpen).toHaveBeenCalledTimes(2);
  });

  it("toggles OPEN_SPOTLIGHT_WITH_URL: opens when closed, closes when open", () => {
    let isOpenState = false;
    const setIsOpen = vi.fn((updater: any) => {
      isOpenState =
        typeof updater === "function" ? updater(isOpenState) : updater;
    });
    const onOpenWithUrl = vi.fn();
    const onToggle = vi.fn();

    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    renderHook(() =>
      useSpotlightShortcut({
        setIsOpen,
        onToggle,
        onOpenWithUrl,
      }),
    );

    // 1st press: opens with URL
    act(() => {
      messageListener({
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://prefill.com",
      });
    });

    expect(onOpenWithUrl).toHaveBeenCalledWith("https://prefill.com");
    expect(isOpenState).toBe(true);

    // Repeated while held: ignored
    act(() => {
      messageListener({
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://prefill.com",
      });
    });
    expect(isOpenState).toBe(true);

    // Key released
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
    });

    // 2nd press: closes
    act(() => {
      messageListener({
        type: MESSAGE_TYPES.OPEN_SPOTLIGHT_WITH_URL,
        url: "https://prefill.com",
      });
    });

    expect(onToggle).toHaveBeenCalled();
    expect(isOpenState).toBe(false);
  });

  it("handles Alt+L keydown shortcut on window and ignores e.repeat", () => {
    let isOpenState = false;
    const setIsOpen = vi.fn((updater: any) => {
      isOpenState =
        typeof updater === "function" ? updater(isOpenState) : updater;
    });
    const onOpenWithUrl = vi.fn();

    renderHook(() =>
      useSpotlightShortcut({
        setIsOpen,
        onToggle: vi.fn(),
        onOpenWithUrl,
      }),
    );

    // Initial press
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "l",
          code: "KeyL",
          altKey: true,
          repeat: false,
        }),
      );
    });

    expect(onOpenWithUrl).toHaveBeenCalled();
    expect(isOpenState).toBe(true);

    // Held down repeat event should be ignored
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "l",
          code: "KeyL",
          altKey: true,
          repeat: true,
        }),
      );
    });

    expect(isOpenState).toBe(true);
  });

  it("sends SHORTCUT_KEY_UP to background on keyup", () => {
    const setIsOpen = vi.fn();
    const onToggle = vi.fn();

    renderHook(() => useSpotlightShortcut({ setIsOpen, onToggle }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
    });

    expect((globalThis as any).chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: MESSAGE_TYPES.SHORTCUT_KEY_UP,
      },
    );
  });
});
