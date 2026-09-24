import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBangsManager } from "@/popup/hooks/useBangsManager";
import { useBookmarksManager } from "@/popup/hooks/useBookmarksManager";
import { createChromeMock } from "./setup";

describe("popup custom hooks", () => {
  beforeEach(() => {
    (globalThis as any).chrome = createChromeMock();
  });

  describe("useBangsManager", () => {
    it("initializes with default bangs and allows adding custom bang", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        result.current.setPrefixInput("!gh");
        result.current.setUrlInput("https://github.com/search?q=%s");
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(onStatus).toHaveBeenCalledWith("Added bang '!gh'", "success");
      expect(result.current.allBangs["!gh"]).toBe(
        "https://github.com/search?q=%s",
      );
    });

    it("validates form input and sets formErrors on invalid submit", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        result.current.setPrefixInput("");
        result.current.setUrlInput("");
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.formErrors.prefix).toBe(
        "Bang prefix cannot be empty.",
      );
      expect(result.current.formErrors.url).toBe(
        "Destination URL cannot be empty.",
      );
      expect(onStatus).not.toHaveBeenCalled();
    });

    it("handles edit and updating an existing bang with a new prefix", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      // First add a custom bang
      await act(async () => {
        result.current.setPrefixInput("!old");
        result.current.setUrlInput("https://old.com?q=%s");
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      // Now edit it and change prefix
      await act(async () => {
        result.current.handleEditClick("!old", "https://old.com?q=%s");
      });
      expect(result.current.editingPrefix).toBe("!old");

      await act(async () => {
        result.current.setPrefixInput("!renamed");
        result.current.setUrlInput("https://renamed.com?q=%s");
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(onStatus).toHaveBeenCalledWith(
        "Updated bang '!renamed'",
        "success",
      );
      expect(result.current.customBangs["!old"]).toBeUndefined();
      expect(result.current.customBangs["!renamed"]).toBe(
        "https://renamed.com?q=%s",
      );
    });

    it("handles edit and cancel edit", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        result.current.handleEditClick("!g", "https://google.com?q=%s");
      });

      expect(result.current.editingPrefix).toBe("!g");
      expect(result.current.prefixInput).toBe("!g");

      await act(async () => {
        result.current.handleCancelEdit();
      });

      expect(result.current.editingPrefix).toBeNull();
      expect(result.current.prefixInput).toBe("");
    });

    it("handles storage error on handleSubmit", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      (globalThis as any).chrome.storage.sync.set = vi
        .fn()
        .mockRejectedValue(new Error("Storage full"));

      await act(async () => {
        result.current.setPrefixInput("!err");
        result.current.setUrlInput("https://err.com?q=%s");
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(onStatus).toHaveBeenCalledWith(
        "Failed to save bang to storage.",
        "error",
      );
    });

    it("deletes a custom bang and handles non-existent or editing state", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      // Add bang
      await act(async () => {
        result.current.setPrefixInput("!del");
        result.current.setUrlInput("https://del.com?q=%s");
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      // Try deleting non-existent prefix
      await act(async () => {
        await result.current.handleDelete("!nonexistent");
      });

      // Edit the bang being deleted
      await act(async () => {
        result.current.handleEditClick("!del", "https://del.com?q=%s");
      });
      expect(result.current.editingPrefix).toBe("!del");

      // Delete it
      await act(async () => {
        await result.current.handleDelete("!del");
      });

      expect(onStatus).toHaveBeenCalledWith("Deleted bang '!del'", "success");
      expect(result.current.editingPrefix).toBeNull();
      expect(result.current.customBangs["!del"]).toBeUndefined();
    });

    it("handles storage error on handleDelete", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        result.current.setPrefixInput("!delerr");
        result.current.setUrlInput("https://delerr.com?q=%s");
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      (globalThis as any).chrome.storage.sync.set = vi
        .fn()
        .mockRejectedValue(new Error("Disk error"));

      await act(async () => {
        await result.current.handleDelete("!delerr");
      });

      expect(onStatus).toHaveBeenCalledWith("Failed to delete bang.", "error");
    });

    it("resets bangs to defaults and handles reset error", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        await result.current.handleResetDefaults();
      });
      expect(onStatus).toHaveBeenCalledWith(
        "Reset all bangs to defaults",
        "success",
      );

      (globalThis as any).chrome.storage.sync.set = vi
        .fn()
        .mockRejectedValue(new Error("Reset fail"));

      await act(async () => {
        await result.current.handleResetDefaults();
      });
      expect(onStatus).toHaveBeenCalledWith("Failed to reset bangs.", "error");
    });

    it("filters bangs based on searchFilter", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      await act(async () => {
        result.current.setSearchFilter("youtube");
      });

      expect(result.current.filteredBangsList.length).toBeGreaterThanOrEqual(1);
      expect(result.current.filteredBangsList[0].prefix).toBe("!yt");

      await act(async () => {
        result.current.setSearchFilter("   ");
      });
      expect(result.current.filteredBangsList.length).toBeGreaterThan(1);
    });
  });

  describe("useBookmarksManager", () => {
    beforeEach(() => {
      (globalThis as any).chrome.bookmarks.getRecent = vi
        .fn()
        .mockResolvedValue([
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
      (globalThis as any).chrome.bookmarks.create = vi
        .fn()
        .mockResolvedValue({});
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

      await act(async () => {
        result.current.handleEditClick({
          id: "bm1",
          title: "Vitest",
          url: "https://vitest.dev",
        });
      });

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
});
