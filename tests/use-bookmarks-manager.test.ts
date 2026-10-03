import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookmarksManager } from "@/popup/hooks/useBookmarksManager";
import { createChromeMock } from "./setup";

describe("useBookmarksManager", () => {
  beforeEach(() => {
    (globalThis as any).chrome = createChromeMock();
    (globalThis as any).chrome.bookmarks.getRecent = vi.fn().mockResolvedValue([
      {
        id: "bm1",
        title: "Vitest",
        url: "https://vitest.dev",
        dateAdded: 100,
      },
      {
        id: "bm2",
        title: "GitHub Docs",
        url: "https://docs.github.com",
        dateAdded: 200,
      },
    ]);
  });

  it("loads and filters bookmarks", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    await act(async () => {
      await result.current.loadBookmarks();
    });

    expect(result.current.bookmarks).toHaveLength(2);

    await act(async () => {
      result.current.setSearchFilter("github");
    });
    expect(result.current.filteredBookmarks).toHaveLength(1);
    expect(result.current.filteredBookmarks[0].title).toBe("GitHub Docs");

    await act(async () => {
      result.current.setSearchFilter("vitest.dev");
    });
    expect(result.current.filteredBookmarks).toHaveLength(1);
    expect(result.current.filteredBookmarks[0].title).toBe("Vitest");
  });

  it("validates input when submitting bookmark", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    await act(async () => {
      result.current.setTitleInput("");
      result.current.setUrlInput("");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.formErrors.title).toBe("Title cannot be empty.");
    expect(result.current.formErrors.url).toBe("URL cannot be empty.");
    expect(onStatus).not.toHaveBeenCalled();
  });

  it("adds bookmark through hook successfully and handles null return", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    await act(async () => {
      result.current.setTitleInput("MDN Docs");
      result.current.setUrlInput("developer.mozilla.org");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onStatus).toHaveBeenCalledWith(
      "Added bookmark 'MDN Docs'",
      "success",
    );

    // Test when create returns empty/null URL
    (globalThis as any).chrome.bookmarks.create = vi.fn().mockResolvedValue({});
    await act(async () => {
      result.current.setTitleInput("Null Bookmark");
      result.current.setUrlInput("https://null.com");
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });
    expect(onStatus).toHaveBeenCalledWith(
      "Failed to create bookmark.",
      "error",
    );
  });

  it("edits bookmark and cancels edit", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    await act(async () => {
      result.current.handleEditClick({
        id: "bm1",
        title: "Vitest",
        url: "https://vitest.dev",
      });
    });

    expect(result.current.editingId).toBe("bm1");
    expect(result.current.titleInput).toBe("Vitest");
    expect(result.current.urlInput).toBe("https://vitest.dev");

    await act(async () => {
      result.current.setTitleInput("Vitest Updated");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onStatus).toHaveBeenCalledWith(
      "Updated bookmark 'Vitest Updated'",
      "success",
    );
    expect(result.current.editingId).toBeNull();

    // Test cancel edit
    await act(async () => {
      result.current.handleEditClick({
        id: "bm1",
        title: "Vitest",
        url: "https://vitest.dev",
      });
      result.current.handleCancelEdit();
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.titleInput).toBe("");
  });

  it("handles error during bookmark submit", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    (globalThis as any).chrome.bookmarks.create = vi
      .fn()
      .mockRejectedValue(new Error("Bookmarks create error"));

    await act(async () => {
      result.current.setTitleInput("Fail");
      result.current.setUrlInput("https://fail.com");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onStatus).toHaveBeenCalledWith("Error saving bookmark.", "error");
  });

  it("deletes a bookmark and handles delete error", async () => {
    const onStatus = vi.fn();
    const { result } = renderHook(() => useBookmarksManager(onStatus));

    // Delete another bookmark while editing bm1
    await act(async () => {
      result.current.handleEditClick({
        id: "bm1",
        title: "Vitest",
        url: "https://vitest.dev",
      });
    });
    expect(result.current.editingId).toBe("bm1");

    await act(async () => {
      await result.current.handleDelete("bm-other");
    });
    // editingId should still be bm1 because bm-other was deleted
    expect(result.current.editingId).toBe("bm1");

    // Delete the currently edited bookmark bm1
    await act(async () => {
      await result.current.handleDelete("bm1");
    });

    expect(onStatus).toHaveBeenCalledWith("Deleted bookmark", "success");
    expect(result.current.editingId).toBeNull();

    // Delete error
    (globalThis as any).chrome.bookmarks.remove = vi
      .fn()
      .mockRejectedValue(new Error("Cannot remove"));

    await act(async () => {
      await result.current.handleDelete("bm2");
    });
    expect(onStatus).toHaveBeenCalledWith(
      "Failed to delete bookmark.",
      "error",
    );
  });
});
