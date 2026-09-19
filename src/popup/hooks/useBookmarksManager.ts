import { useEffect, useMemo, useState } from "react";
import {
  addBookmark,
  deleteBookmark,
  editBookmark,
  fetchBookmarks,
  validateBookmark,
} from "@/lib/bookmarks-manager";
import type { ManageableBookmark } from "@/lib/bookmarks-manager";

export function useBookmarksManager(
  onStatus: (text: string, type?: "success" | "error") => void,
) {
  const [bookmarks, setBookmarks] = useState<ManageableBookmark[]>([]);
  const [titleInput, setTitleInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    url?: string;
  }>({});
  const [searchFilter, setSearchFilter] = useState("");

  const loadData = () => {
    fetchBookmarks().then((items) => {
      setBookmarks(items);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (bookmark: ManageableBookmark) => {
    setEditingId(bookmark.id);
    setTitleInput(bookmark.title);
    setUrlInput(bookmark.url);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitleInput("");
    setUrlInput("");
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateBookmark(titleInput, urlInput);

    if (!validation.isValid) {
      setFormErrors({
        title: validation.titleError,
        url: validation.urlError,
      });
      return;
    }

    const finalTitle = validation.normalizedTitle!;
    const finalUrl = validation.normalizedUrl!;

    try {
      if (editingId) {
        await editBookmark(editingId, finalTitle, finalUrl);
        handleCancelEdit();
        loadData();
        onStatus(`Updated bookmark '${finalTitle}'`, "success");
      } else {
        const created = await addBookmark(finalTitle, finalUrl);
        if (created) {
          handleCancelEdit();
          loadData();
          onStatus(`Added bookmark '${finalTitle}'`, "success");
        } else {
          onStatus("Failed to create bookmark.", "error");
        }
      }
    } catch {
      onStatus("Error saving bookmark.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookmark(id);
      if (editingId === id) {
        handleCancelEdit();
      }
      loadData();
      onStatus("Deleted bookmark", "success");
    } catch {
      onStatus("Failed to delete bookmark.", "error");
    }
  };

  const filteredBookmarks = useMemo(() => {
    if (!searchFilter.trim()) {
      return bookmarks;
    }

    const query = searchFilter.trim().toLowerCase();
    return bookmarks.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query),
    );
  }, [bookmarks, searchFilter]);

  return {
    bookmarks,
    titleInput,
    urlInput,
    editingId,
    formErrors,
    searchFilter,
    filteredBookmarks,
    setTitleInput,
    setUrlInput,
    setSearchFilter,
    setFormErrors,
    handleEditClick,
    handleCancelEdit,
    handleSubmit,
    handleDelete,
  };
}
