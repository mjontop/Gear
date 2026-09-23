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
import HelloWorld from "@/components/HelloWorld";
import { MESSAGE_TYPES } from "@/constants";

describe("UI Components", () => {
  it("renders HelloWorld component and handles click", () => {
    render(<HelloWorld msg="Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /count is 0/i });
    fireEvent.click(btn);
    expect(
      screen.getByRole("button", { name: /count is 1/i }),
    ).toBeInTheDocument();
  });

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

  it("renders SuggestionItem and handles onSelect", () => {
    const onSelect = vi.fn();
    render(
      <SuggestionItem
        item={{ id: "1", title: "Vitest Testing", url: "https://vitest.dev" }}
        isSelected={true}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Vitest Testing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders NavigationTabs and switches tabs", () => {
    const onTabChange = vi.fn();
    render(
      <NavigationTabs
        activeTab="sources"
        onTabChange={onTabChange}
        bangsCount={0}
        bookmarksCount={0}
      />,
    );

    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("Bangs")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Bangs"));
    expect(onTabChange).toHaveBeenCalledWith("bangs");
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

  it("renders BangsList with items and handles edit, delete, reset", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onReset = vi.fn();

    render(
      <BangsList
        bangs={[
          { prefix: "!custom", url: "https://custom.com?q=%s", isCustom: true },
          { prefix: "!g", url: "https://google.com?q=%s", isCustom: false },
        ]}
        searchFilter=""
        customCount={1}
        onSearchFilterChange={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onResetDefaults={onReset}
      />,
    );

    expect(screen.getByText("!custom")).toBeInTheDocument();
    expect(screen.getByText("!g")).toBeInTheDocument();

    const editBtn = screen.getByTitle("Edit bang");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith("!custom", "https://custom.com?q=%s");

    const deleteBtn = screen.getByTitle("Delete bang");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("!custom");

    const resetBtn = screen.getByTitle("Reset all custom bangs to defaults");
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();
  });

  it("renders BookmarkForm in edit mode and BookmarksList with edit/delete", () => {
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
    render(
      <BookmarksList
        bookmarks={[
          {
            id: "1",
            title: "My Bookmark",
            url: "https://mybookmark.com",
            dateAdded: 12345,
          },
        ]}
        searchFilter=""
        onSearchFilterChange={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("My Bookmark")).toBeInTheDocument();
    const editBtn = screen.getByTitle("Edit bookmark");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();

    const deleteBtn = screen.getByTitle("Delete bookmark");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("renders SourcesView and toggles options", () => {
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
  });

  it("renders SettingsView with themes and shortcuts", () => {
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
  });
});
