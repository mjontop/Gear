import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyUrlToast } from "@/content/components/CopyUrlToast";
import { SuggestionItem } from "@/components/spotlight/components/suggestion-item";
import { NavigationTabs } from "@/popup/components/NavigationTabs";
import { PopupHeader } from "@/popup/components/PopupHeader";
import { PopupFooter } from "@/popup/components/PopupFooter";
import { BangForm } from "@/popup/components/BangForm";
import { BangsList } from "@/popup/components/BangsList";
import { BookmarkForm } from "@/popup/components/BookmarkForm";
import { BookmarksList } from "@/popup/components/BookmarksList";
import { SourcesView } from "@/popup/components/SourcesView";
import { SettingsView } from "@/popup/components/SettingsView";
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

  it("renders NavigationTabs, switches tabs, handles wheel scroll and active tab change", () => {
    const onTabChange = vi.fn();
    const { rerender, container } = render(
      <NavigationTabs
        activeTab="sources"
        onTabChange={onTabChange}
        bangsCount={2}
        bookmarksCount={3}
      />,
    );

    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("Bangs")).toBeInTheDocument();

    const nav = container.querySelector("nav")!;
    expect(nav).toBeInTheDocument();

    // Wheel event with deltaY
    fireEvent.wheel(nav, { deltaY: 100 });
    // Wheel event with deltaY = 0
    fireEvent.wheel(nav, { deltaY: 0 });

    fireEvent.click(screen.getByText("Bangs"));
    expect(onTabChange).toHaveBeenCalledWith("bangs");

    fireEvent.click(screen.getByText("Bookmarks"));
    expect(onTabChange).toHaveBeenCalledWith("bookmarks");

    fireEvent.click(screen.getByText("Settings"));
    expect(onTabChange).toHaveBeenCalledWith("settings");

    // Rerender with different activeTab to trigger scrollIntoView effect
    rerender(
      <NavigationTabs
        activeTab="settings"
        onTabChange={onTabChange}
        bangsCount={2}
        bookmarksCount={3}
      />,
    );
  });

  it("renders PopupHeader and PopupFooter", () => {
    render(<PopupHeader activeTab="bangs" totalCount={5} />);
    expect(screen.getByText("Gear Manager")).toBeInTheDocument();
    expect(screen.getByText("5 Bangs")).toBeInTheDocument();

    render(<PopupFooter />);
    expect(screen.getByText("Gear Launcher")).toBeInTheDocument();
  });

  it("renders BangForm and captures submit", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <BangForm
        prefixInput="!g"
        urlInput="https://google.com?q=%s"
        editingPrefix={null}
        formErrors={{}}
        onPrefixChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={onSubmit}
        onCancelEdit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Add Bang/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("renders BangForm in edit mode and allows canceling edit", () => {
    const onCancelEdit = vi.fn();
    render(
      <BangForm
        prefixInput="!edit"
        urlInput="https://edit.com?q=%s"
        editingPrefix="!edit"
        formErrors={{ prefix: "Prefix exists", url: "Invalid url" }}
        onPrefixChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancelEdit={onCancelEdit}
      />,
    );

    expect(screen.getByText("Edit Bang: !edit")).toBeInTheDocument();
    expect(screen.getByText("Prefix exists")).toBeInTheDocument();
    expect(screen.getByText("Invalid url")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Update Bang/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(onCancelEdit).toHaveBeenCalled();
  });

  it("renders BangsList with items, search filter, empty state, and handles edit/delete/reset", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onReset = vi.fn();
    const onSearchFilterChange = vi.fn();

    const { rerender } = render(
      <BangsList
        bangs={[
          { prefix: "!custom", url: "https://custom.com?q=%s", isCustom: true },
          { prefix: "!g", url: "https://google.com?q=%s", isCustom: false },
        ]}
        searchFilter="cust"
        customCount={1}
        onSearchFilterChange={onSearchFilterChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onResetDefaults={onReset}
      />,
    );

    expect(screen.getByText("!custom")).toBeInTheDocument();
    expect(screen.getByText("!g")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search bangs...");
    fireEvent.change(searchInput, { target: { value: "new filter" } });
    expect(onSearchFilterChange).toHaveBeenCalledWith("new filter");

    const editBtn = screen.getByTitle("Edit bang");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith("!custom", "https://custom.com?q=%s");

    const deleteBtn = screen.getByTitle("Delete bang");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("!custom");

    const resetBtn = screen.getByTitle("Reset all custom bangs to defaults");
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();

    // Rerender with empty bangs and customCount 0
    rerender(
      <BangsList
        bangs={[]}
        searchFilter="no match"
        customCount={0}
        onSearchFilterChange={onSearchFilterChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onResetDefaults={onReset}
      />,
    );
    expect(
      screen.getByText("No bangs matching your search."),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Reset all custom bangs to defaults"),
    ).toBeNull();
  });

  it("renders BookmarksList with search filter, image error fallback, and empty state", () => {
    const onCancelEdit = vi.fn();
    render(
      <BookmarkForm
        titleInput="Edit Me"
        urlInput="https://editme.com"
        editingId="bm-edit"
        formErrors={{ title: "Title error", url: "URL error" }}
        onTitleChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancelEdit={onCancelEdit}
      />,
    );

    expect(screen.getByText("Edit Bookmark")).toBeInTheDocument();
    expect(screen.getByText("Title error")).toBeInTheDocument();
    expect(screen.getByText("URL error")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Update Bookmark/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(onCancelEdit).toHaveBeenCalled();

    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onSearchFilterChange = vi.fn();

    const { rerender, container } = render(
      <BookmarksList
        bookmarks={[
          {
            id: "1",
            title: "My Bookmark",
            url: "https://mybookmark.com",
            favIconUrl: "https://mybookmark.com/favicon.png",
            dateAdded: 12345,
          },
        ]}
        searchFilter="test"
        onSearchFilterChange={onSearchFilterChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("My Bookmark")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search bookmarks...");
    fireEvent.change(searchInput, { target: { value: "filter bookmarks" } });
    expect(onSearchFilterChange).toHaveBeenCalledWith("filter bookmarks");

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    fireEvent.error(img!);

    const editBtn = screen.getByTitle("Edit bookmark");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();

    const deleteBtn = screen.getByTitle("Delete bookmark");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");

    // Empty state
    rerender(
      <BookmarksList
        bookmarks={[]}
        searchFilter="empty"
        onSearchFilterChange={onSearchFilterChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(
      screen.getByText("No bookmarks matching your search."),
    ).toBeInTheDocument();
  });

  it("renders SourcesView and toggles options and providers", () => {
    const onPreferenceChange = vi.fn();
    render(
      <SourcesView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
        }}
        onPreferenceChange={onPreferenceChange}
      />,
    );

    expect(screen.getByText("Include Bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Include Browsing History")).toBeInTheDocument();

    const bookmarkToggle = screen.getByLabelText("Include Bookmarks");
    fireEvent.click(bookmarkToggle);
    expect(onPreferenceChange).toHaveBeenCalledWith("includeBookmarks", false);

    const historyToggle = screen.getByLabelText("Include Browsing History");
    fireEvent.click(historyToggle);
    expect(onPreferenceChange).toHaveBeenCalledWith("includeHistory", false);

    const ddgRadio = screen.getByDisplayValue("duckduckgo");
    fireEvent.click(ddgRadio);
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "searchProvider",
      "duckduckgo",
    );
  });

  it("renders SourcesView with fallback default provider when searchProvider is omitted", () => {
    render(
      <SourcesView
        preferences={
          {
            includeBookmarks: true,
            includeHistory: true,
            enableBackgroundBlur: true,
            theme: "dark",
          } as any
        }
        onPreferenceChange={vi.fn()}
      />,
    );

    const googleRadio = screen.getByDisplayValue("google") as HTMLInputElement;
    expect(googleRadio.checked).toBe(true);
  });

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

  it("renders SettingsView typography and styles controls and updates preferences", () => {
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
          fontSize: 16,
          fontWeight: "400",
          fontFamily: "Roboto",
          fontColor: "#ffffff",
          secondaryFontColor: "#aaaaaa",
          accentColor: "#38bdf8",
          borderRadius: 10,
        }}
        onPreferenceChange={onPreferenceChange}
        onShowStatus={onShowStatus}
      />,
    );

    expect(screen.getByText("Typography & Styles")).toBeInTheDocument();
    expect(screen.getByText("Live Preview")).toBeInTheDocument();

    // Font size slider & preset
    const fontSizeSlider = screen.getByLabelText("Font size");
    fireEvent.change(fontSizeSlider, { target: { value: "18" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 18);

    const smallPresetBtn = screen.getByRole("button", {
      name: /Small \(14px\)/i,
    });
    fireEvent.click(smallPresetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 14);

    // Font weight preset
    const boldWeightBtn = screen.getByRole("button", {
      name: /Bold \(700\)/i,
    });
    fireEvent.click(boldWeightBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontWeight", "700");

    // Font family dropdown
    const fontFamilySelect = screen.getByLabelText("Font family");
    fireEvent.change(fontFamilySelect, { target: { value: "Inter" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontFamily", "Inter");

    // Corner radius slider & preset
    const borderRadiusSlider = screen.getByLabelText("Corner radius");
    fireEvent.change(borderRadiusSlider, { target: { value: "16" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("borderRadius", 16);

    const pillPresetBtn = screen.getByRole("button", {
      name: /Pill \(24px\)/i,
    });
    fireEvent.click(pillPresetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("borderRadius", 24);

    // Color Palette preset
    const emeraldPaletteBtn = screen.getByTitle(/Emerald Palette/i);
    fireEvent.click(emeraldPaletteBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#ecfdf5");
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#a7f3d0",
    );
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#10b981");
    expect(onShowStatus).toHaveBeenCalledWith('Applied "Emerald" palette');

    // Custom color input & clear
    const fontColorSwatch = screen.getByLabelText("Primary font color");
    fireEvent.change(fontColorSwatch, { target: { value: "#abcdef" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#abcdef");

    const fontColorInput = screen.getByLabelText("Primary font color hex code");
    fireEvent.change(fontColorInput, { target: { value: "#123456" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#123456");

    const secColorSwatch = screen.getByLabelText("Secondary font color");
    fireEvent.change(secColorSwatch, { target: { value: "#654321" } });
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#654321",
    );

    const secColorInput = screen.getByLabelText(
      "Secondary font color hex code",
    );
    fireEvent.change(secColorInput, { target: { value: "#555555" } });
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#555555",
    );

    const accentColorSwatch = screen.getByLabelText("Accent color");
    fireEvent.change(accentColorSwatch, { target: { value: "#778899" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#778899");

    const accentColorInput = screen.getByLabelText("Accent color hex code");
    fireEvent.change(accentColorInput, { target: { value: "#8899aa" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#8899aa");

    const clearBtns = screen.getAllByRole("button", { name: "Clear" });
    fireEvent.click(clearBtns[0]);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "");

    fireEvent.click(clearBtns[1]);
    expect(onPreferenceChange).toHaveBeenCalledWith("secondaryFontColor", "");

    fireEvent.click(clearBtns[2]);
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "");

    // Reset styles
    const resetBtn = screen.getByRole("button", {
      name: /Reset/i,
    });
    fireEvent.click(resetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 16);
    expect(onShowStatus).toHaveBeenCalledWith("Styles reset to defaults");
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
