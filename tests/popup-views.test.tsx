import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationTabs } from "@/popup/components/NavigationTabs";
import { PopupHeader } from "@/popup/components/PopupHeader";
import { PopupFooter } from "@/popup/components/PopupFooter";
import { BangForm } from "@/popup/components/BangForm";
import { BangsList } from "@/popup/components/BangsList";
import { BookmarkForm } from "@/popup/components/BookmarkForm";
import { BookmarksList } from "@/popup/components/BookmarksList";
import { SourcesView } from "@/popup/components/SourcesView";

describe("Popup Views & Components", () => {
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

    expect(screen.getByDisplayValue("google")).toBeChecked();
  });
});
