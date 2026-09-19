import { useEffect, useMemo, useState } from "react";
import { BANG_SEARCH_URLS } from "@/constants";
import {
  getCustomBangs,
  saveCustomBangs,
  validateBang,
} from "@/lib/bangs-storage";

export function useBangsManager(
  onStatus: (text: string, type?: "success" | "error") => void,
) {
  const [customBangs, setCustomBangs] = useState<Record<string, string>>({});
  const [prefixInput, setPrefixInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [editingPrefix, setEditingPrefix] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    prefix?: string;
    url?: string;
  }>({});
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    getCustomBangs().then((loaded) => {
      setCustomBangs(loaded);
    });
  }, []);

  const allBangs = useMemo(() => {
    return { ...BANG_SEARCH_URLS, ...customBangs };
  }, [customBangs]);

  const handleEditClick = (prefix: string, url: string) => {
    setEditingPrefix(prefix);
    setPrefixInput(prefix);
    setUrlInput(url);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingPrefix(null);
    setPrefixInput("");
    setUrlInput("");
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateBang(
      prefixInput,
      urlInput,
      allBangs,
      editingPrefix || undefined,
    );

    if (!validation.isValid) {
      setFormErrors({
        prefix: validation.prefixError,
        url: validation.urlError,
      });
      return;
    }

    const finalPrefix = validation.normalizedPrefix!;
    const finalUrl = validation.normalizedUrl!;

    const updated = { ...customBangs };

    if (editingPrefix && editingPrefix !== finalPrefix) {
      delete updated[editingPrefix];
    }

    updated[finalPrefix] = finalUrl;

    try {
      await saveCustomBangs(updated);
      setCustomBangs(updated);
      handleCancelEdit();
      onStatus(
        editingPrefix
          ? `Updated bang '${finalPrefix}'`
          : `Added bang '${finalPrefix}'`,
        "success",
      );
    } catch {
      onStatus("Failed to save bang to storage.", "error");
    }
  };

  const handleDelete = async (prefix: string) => {
    if (!customBangs[prefix]) return;

    const updated = { ...customBangs };
    delete updated[prefix];

    try {
      await saveCustomBangs(updated);
      setCustomBangs(updated);
      if (editingPrefix === prefix) {
        handleCancelEdit();
      }
      onStatus(`Deleted bang '${prefix}'`, "success");
    } catch {
      onStatus("Failed to delete bang.", "error");
    }
  };

  const handleResetDefaults = async () => {
    try {
      await saveCustomBangs({});
      setCustomBangs({});
      handleCancelEdit();
      onStatus("Reset all bangs to defaults", "success");
    } catch {
      onStatus("Failed to reset bangs.", "error");
    }
  };

  const filteredBangsList = useMemo(() => {
    const list = Object.entries(allBangs).map(([prefix, url]) => ({
      prefix,
      url,
      isCustom: Boolean(customBangs[prefix]),
    }));

    if (!searchFilter.trim()) {
      return list;
    }

    const query = searchFilter.trim().toLowerCase();
    return list.filter(
      (item) =>
        item.prefix.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query),
    );
  }, [allBangs, customBangs, searchFilter]);

  return {
    allBangs,
    customBangs,
    prefixInput,
    urlInput,
    editingPrefix,
    formErrors,
    searchFilter,
    filteredBangsList,
    setPrefixInput,
    setUrlInput,
    setSearchFilter,
    setFormErrors,
    handleEditClick,
    handleCancelEdit,
    handleSubmit,
    handleDelete,
    handleResetDefaults,
  };
}
