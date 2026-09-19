import { useEffect, useMemo, useState } from "react";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import { BANG_SEARCH_URLS } from "@/constants";
import {
  getCustomBangs,
  saveCustomBangs,
  validateBang,
} from "@/lib/bangs-storage";
import { BangForm } from "./components/BangForm";
import { BangsList } from "./components/BangsList";
import { PopupFooter } from "./components/PopupFooter";
import { PopupHeader } from "./components/PopupHeader";
import "./App.css";

export default function App() {
  const [customBangs, setCustomBangs] = useState<Record<string, string>>({});

  const [prefixInput, setPrefixInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [editingPrefix, setEditingPrefix] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    prefix?: string;
    url?: string;
  }>({});
  const [searchFilter, setSearchFilter] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    getCustomBangs().then((loaded) => {
      setCustomBangs(loaded);
    });
  }, []);

  const allBangs = useMemo(() => {
    return { ...BANG_SEARCH_URLS, ...customBangs };
  }, [customBangs]);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    window.setTimeout(() => {
      setStatusMessage(null);
    }, 2800);
  };

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
      showStatus(
        editingPrefix
          ? `Updated bang '${finalPrefix}'`
          : `Added bang '${finalPrefix}'`,
        "success",
      );
    } catch {
      showStatus("Failed to save bang to storage.", "error");
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
      showStatus(`Deleted bang '${prefix}'`, "success");
    } catch {
      showStatus("Failed to delete bang.", "error");
    }
  };

  const handleResetDefaults = async () => {
    try {
      await saveCustomBangs({});
      setCustomBangs({});
      handleCancelEdit();
      showStatus("Reset all bangs to defaults", "success");
    } catch {
      showStatus("Failed to reset bangs.", "error");
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

  return (
    <div className="popup_container">
      <PopupHeader totalBangs={Object.keys(allBangs).length} />

      {statusMessage && (
        <div className={`status_banner status_${statusMessage.type}`}>
          {statusMessage.type === "success" ? (
            <CheckIcon size={14} />
          ) : (
            <AlertCircleIcon size={14} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <BangForm
        prefixInput={prefixInput}
        urlInput={urlInput}
        editingPrefix={editingPrefix}
        formErrors={formErrors}
        onPrefixChange={(value) => {
          setPrefixInput(value);
          if (formErrors.prefix) {
            setFormErrors((prev) => ({ ...prev, prefix: undefined }));
          }
        }}
        onUrlChange={(value) => {
          setUrlInput(value);
          if (formErrors.url) {
            setFormErrors((prev) => ({ ...prev, url: undefined }));
          }
        }}
        onSubmit={handleSubmit}
        onCancelEdit={handleCancelEdit}
      />

      <BangsList
        bangs={filteredBangsList}
        searchFilter={searchFilter}
        customCount={Object.keys(customBangs).length}
        onSearchFilterChange={setSearchFilter}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onResetDefaults={handleResetDefaults}
      />

      <PopupFooter />
    </div>
  );
}
