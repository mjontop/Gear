import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { CopyUrlToast } from "@/content/components/CopyUrlToast";
import { MESSAGE_TYPES } from "@/constants";

describe("CopyUrlToast", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows toast on COPY_CURRENT_URL message and copies text", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    render(<CopyUrlToast />);

    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });

    expect(screen.getByText("Copied Current URL")).toBeInTheDocument();
  });

  it("ignores repeated COPY_CURRENT_URL messages while key is held down", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    render(<CopyUrlToast />);

    // 1st press
    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });
    expect(screen.getByText("Copied Current URL")).toBeInTheDocument();

    // Repeated triggers (key hold)
    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });
    expect(screen.getByText("Copied Current URL")).toBeInTheDocument();
  });

  it("toggles off and dismisses toast when pressed again after key release", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    render(<CopyUrlToast />);

    // 1st press: opens toast
    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });
    expect(screen.getByText("Copied Current URL")).toBeInTheDocument();

    // Key unpressed
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup"));
    });

    // 2nd press: toggles off toast
    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });
    expect(screen.queryByText("Copied Current URL")).toBeNull();
  });

  it("dismisses toast when clicked", async () => {
    let messageListener: any;
    (globalThis as any).chrome.runtime.onMessage.addListener = vi.fn((fn) => {
      messageListener = fn;
    });

    render(<CopyUrlToast />);

    await act(async () => {
      messageListener({
        type: MESSAGE_TYPES.COPY_CURRENT_URL,
        url: "https://gear.example.com",
      });
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.queryByText("Copied Current URL")).toBeNull();
  });
});
