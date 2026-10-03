import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SettingsView } from "@/popup/components/SettingsView";

describe("SettingsView", () => {
  it("renders SettingsView with themes, background blur, and shortcuts", () => {
    const onPreferenceChange = vi.fn();
    render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={onPreferenceChange}
        onShowStatus={vi.fn()}
      />,
    );

    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Backup & Restore")).toBeInTheDocument();

    const lightBtn = screen.getByRole("radio", { name: /Light/i });
    fireEvent.click(lightBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("theme", "light");

    const blurToggle = screen.getByLabelText(/Background Blur/i);
    fireEvent.click(blurToggle);
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "enableBackgroundBlur",
      false,
    );

    const openShortcutsBtn = screen.getByRole("button", {
      name: /Configure Shortcuts in Browser/i,
    });
    fireEvent.click(openShortcutsBtn);
    expect((globalThis as any).chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome://extensions/shortcuts",
    });
  });

  it("handles SettingsView shortcuts fallback to window.open when chrome.tabs.create is unavailable", () => {
    const originalTabs = (globalThis as any).chrome.tabs;
    (globalThis as any).chrome.tabs = undefined;
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    try {
      render(
        <SettingsView
          preferences={{
            includeBookmarks: true,
            includeHistory: true,
            searchProvider: "google",
            enableBackgroundBlur: true,
            theme: "dark",
          }}
          onPreferenceChange={vi.fn()}
          onShowStatus={vi.fn()}
        />,
      );

      const openShortcutsBtn = screen.getByRole("button", {
        name: /Configure Shortcuts in Browser/i,
      });
      fireEvent.click(openShortcutsBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        "chrome://extensions/shortcuts",
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      (globalThis as any).chrome.tabs = originalTabs;
      windowOpenSpy.mockRestore();
    }
  });

  it("handles SettingsView shortcuts in Firefox environment", () => {
    const originalGetURL = (globalThis as any).chrome.runtime.getURL;
    (globalThis as any).chrome.runtime.getURL = vi
      .fn()
      .mockReturnValue("moz-extension://test-id/");

    try {
      render(
        <SettingsView
          preferences={{
            includeBookmarks: true,
            includeHistory: true,
            searchProvider: "google",
            enableBackgroundBlur: true,
            theme: "dark",
          }}
          onPreferenceChange={vi.fn()}
          onShowStatus={vi.fn()}
        />,
      );

      expect(screen.getByText(/In Firefox:/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: /Configure Shortcuts in Browser/i,
        }),
      ).toBeNull();
    } finally {
      (globalThis as any).chrome.runtime.getURL = originalGetURL;
    }
  });

  it("handles backup export and export failure in SettingsView", async () => {
    const onShowStatus = vi.fn();
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();

    const { rerender } = render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={vi.fn()}
        onShowStatus={onShowStatus}
      />,
    );

    const exportBtn = screen.getByRole("button", { name: /Export Backup/i });
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(onShowStatus).toHaveBeenCalledWith(
      "Backup downloaded successfully!",
    );

    // Test export failure
    window.URL.createObjectURL = vi.fn(() => {
      throw new Error("Blob error");
    });

    rerender(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={vi.fn()}
        onShowStatus={onShowStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(exportBtn);
    });
    expect(onShowStatus).toHaveBeenCalledWith(
      "Failed to export backup",
      "error",
    );
  });

  it("handles backup import success, empty files, and error in SettingsView", async () => {
    const onShowStatus = vi.fn();
    const onDataImported = vi.fn();

    render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={vi.fn()}
        onShowStatus={onShowStatus}
        onDataImported={onDataImported}
      />,
    );

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const importBtn = screen.getByRole("button", { name: /Import Backup/i });
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(importBtn);
    expect(clickSpy).toHaveBeenCalled();

    // Trigger change with no file
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } });
    });

    // Trigger change with valid JSON
    const validJson = JSON.stringify({
      customBangs: { "!mytest": "https://test.com?q=%s" },
      preferences: { theme: "light" },
    });
    const validFile = new File([validJson], "backup.json", {
      type: "application/json",
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    });

    expect(onShowStatus).toHaveBeenCalledWith(
      "Restored successfully (1 bangs)",
    );
    expect(onDataImported).toHaveBeenCalled();

    // Trigger change with invalid JSON
    const invalidFile = new File(["invalid-json-content"], "backup.json", {
      type: "application/json",
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    expect(onShowStatus).toHaveBeenCalledWith(
      "Failed to import: Invalid JSON backup",
      "error",
    );
  });

  it("handles theme selection buttons in SettingsView", () => {
    const onPreferenceChange = vi.fn();
    const onShowStatus = vi.fn();

    render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={onPreferenceChange}
        onShowStatus={onShowStatus}
      />,
    );

    const darkBtn = screen.getByRole("radio", { name: /Dark/i });
    const lightBtn = screen.getByRole("radio", { name: /Light/i });
    const systemBtn = screen.getByRole("radio", { name: /System/i });

    fireEvent.click(lightBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("theme", "light");

    fireEvent.click(systemBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("theme", "system");

    fireEvent.click(darkBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("handles open shortcuts in Chrome without tabs.create", () => {
    const onShowStatus = vi.fn();
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const originalTabs = (globalThis as any).chrome.tabs;
    (globalThis as any).chrome.tabs = {};

    render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={vi.fn()}
        onShowStatus={onShowStatus}
      />,
    );

    const shortcutsBtn = screen.getByRole("button", {
      name: /Configure Shortcuts in Browser/i,
    });
    fireEvent.click(shortcutsBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "chrome://extensions/shortcuts",
      "_blank",
      "noopener,noreferrer",
    );

    (globalThis as any).chrome.tabs = originalTabs;
    windowOpenSpy.mockRestore();
  });
});
