import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBangsManager } from "@/popup/hooks/useBangsManager";
import { useBookmarksManager } from "@/popup/hooks/useBookmarksManager";

describe("popup custom hooks", () => {
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

    it("handles edit and cancel edit", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      act(() => {
        result.current.handleEditClick("!g", "https://google.com?q=%s");
      });

      expect(result.current.editingPrefix).toBe("!g");
      expect(result.current.prefixInput).toBe("!g");

      act(() => {
        result.current.handleCancelEdit();
      });

      expect(result.current.editingPrefix).toBeNull();
      expect(result.current.prefixInput).toBe("");
    });

    it("filters bangs based on searchFilter", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBangsManager(onStatus));

      act(() => {
        result.current.setSearchFilter("youtube");
      });

      expect(result.current.filteredBangsList.length).toBeGreaterThanOrEqual(1);
      expect(result.current.filteredBangsList[0].prefix).toBe("!yt");
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
        ]);
    });

    it("loads and filters bookmarks", async () => {
      const onStatus = vi.fn();
      const { result } = renderHook(() => useBookmarksManager(onStatus));

      await act(async () => {
        await result.current.loadBookmarks();
      });

      expect(result.current.bookmarks).toHaveLength(1);
      expect(result.current.bookmarks[0].title).toBe("Vitest");
    });

    it("adds bookmark through hook", async () => {
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
    });
  });
});
