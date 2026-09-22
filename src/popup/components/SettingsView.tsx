import { useEffect, useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  KeyboardIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SunIcon,
  UploadIcon,
} from "lucide-react";
import { getCustomBangs, saveCustomBangs } from "@/lib/bangs-storage";
import {
  getSpotlightPreferences,
  saveSpotlightPreferences,
  type SpotlightPreferences,
} from "@/lib/preferences";

type SettingsViewProps = {
  onShowStatus: (text: string, type?: "success" | "error") => void;
  onDataImported?: () => void;
};

export const SettingsView = ({
  onShowStatus,
  onDataImported,
}: SettingsViewProps) => {
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light" | "system">("dark");
  const [shortcuts, setShortcuts] = useState({
    toggle: ["Alt", "M"],
    copyUrl: ["Alt", "Shift", "L"],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.commands?.getAll) {
      chrome.commands.getAll((commands) => {
        for (const cmd of commands) {
          if (cmd.name === "toggle-spotlight" && cmd.shortcut) {
            setShortcuts((prev) => ({
              ...prev,
              toggle: cmd.shortcut!.split("+").map((s) => s.trim()),
            }));
          }
          if (cmd.name === "copy-current-url" && cmd.shortcut) {
            setShortcuts((prev) => ({
              ...prev,
              copyUrl: cmd.shortcut!.split("+").map((s) => s.trim()),
            }));
          }
        }
      });
    }
  }, []);

  const handleOpenShortcuts = () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    } else {
      window.open("chrome://extensions/shortcuts", "_blank", "noopener,noreferrer");
    }
  };

  const handleExport = async () => {
    try {
      const customBangs = await getCustomBangs();
      const preferences = await getSpotlightPreferences();

      const backupData = {
        name: "Gear Backup",
        version: "0.1.0",
        exportDate: new Date().toISOString(),
        customBangs,
        preferences,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `gear-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      onShowStatus("Backup downloaded successfully!");
    } catch {
      onShowStatus("Failed to export backup", "error");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        customBangs?: Record<string, string>;
        preferences?: Partial<SpotlightPreferences>;
      };

      let restoredCount = 0;

      if (data.customBangs && typeof data.customBangs === "object") {
        await saveCustomBangs(data.customBangs);
        restoredCount += Object.keys(data.customBangs).length;
      }

      if (data.preferences && typeof data.preferences === "object") {
        const currentPrefs = await getSpotlightPreferences();
        await saveSpotlightPreferences({
          ...currentPrefs,
          ...data.preferences,
        });
      }

      onShowStatus(`Restored successfully (${restoredCount} bangs)`);
      if (onDataImported) {
        onDataImported();
      }
    } catch {
      onShowStatus("Failed to import: Invalid JSON backup", "error");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="settings_container">
      {/* 1. Appearance / Theme */}
      <div className="form_card">
        <div className="form_header">
          <div className="settings_card_title_row">
            <PaletteIcon size={18} className="settings_title_icon" />
            <span className="form_title">Appearance</span>
          </div>
        </div>

        <p className="settings_subtitle">
          Select your preferred interface color theme.
        </p>

        <div className="theme_selector" role="radiogroup" aria-label="Theme selection">
          <button
            type="button"
            className={`theme_btn ${selectedTheme === "dark" ? "theme_btn_active" : ""}`}
            onClick={() => setSelectedTheme("dark")}
            role="radio"
            aria-checked={selectedTheme === "dark"}
          >
            <MoonIcon size={15} />
            <span>Dark</span>
            <span className="theme_badge_current">Default</span>
          </button>

          <button
            type="button"
            className={`theme_btn theme_btn_disabled ${selectedTheme === "light" ? "theme_btn_active" : ""}`}
            onClick={() => onShowStatus("Light theme coming in future update")}
            role="radio"
            aria-checked={selectedTheme === "light"}
          >
            <SunIcon size={15} />
            <span>Light</span>
            <span className="theme_badge_soon">Soon</span>
          </button>

          <button
            type="button"
            className={`theme_btn theme_btn_disabled ${selectedTheme === "system" ? "theme_btn_active" : ""}`}
            onClick={() => onShowStatus("System theme coming in future update")}
            role="radio"
            aria-checked={selectedTheme === "system"}
          >
            <SettingsIcon size={15} />
            <span>System</span>
            <span className="theme_badge_soon">Soon</span>
          </button>
        </div>
      </div>

      {/* 2. Keyboard Shortcuts */}
      <div className="form_card">
        <div className="form_header">
          <div className="settings_card_title_row">
            <KeyboardIcon size={18} className="settings_title_icon" />
            <span className="form_title">Keyboard Shortcuts</span>
          </div>
        </div>

        <div className="shortcut_setting_row">
          <div className="shortcut_info">
            <span className="shortcut_name">Toggle Spotlight</span>
            <span className="shortcut_desc">
              Shortcut to open the Spotlight search palette.
            </span>
          </div>
          <div className="shortcut_keys">
            {shortcuts.toggle.map((k, idx) => (
              <span key={`toggle-${k}-${idx}`} className="shortcut_key_piece">
                {idx > 0 && <span className="shortcut_plus">+</span>}
                <kbd>{k}</kbd>
              </span>
            ))}
          </div>
        </div>

        <div className="shortcut_setting_row" style={{ marginTop: "8px" }}>
          <div className="shortcut_info">
            <span className="shortcut_name">Copy Current URL</span>
            <span className="shortcut_desc">
              Copy active page URL and display notification toast.
            </span>
          </div>
          <div className="shortcut_keys">
            {shortcuts.copyUrl.map((k, idx) => (
              <span key={`copy-${k}-${idx}`} className="shortcut_key_piece">
                {idx > 0 && <span className="shortcut_plus">+</span>}
                <kbd>{k}</kbd>
              </span>
            ))}
          </div>
        </div>

        <p className="shortcut_tip_text">
          💡 <strong>Tip:</strong> You can customize any shortcut in browser settings. For instance, rebind Spotlight to <kbd>Ctrl</kbd> + <kbd>T</kbd> / <kbd>Cmd</kbd> + <kbd>T</kbd> to replace your new tab page!
        </p>

        <button
          type="button"
          className="btn btn_secondary shortcut_action_btn"
          onClick={handleOpenShortcuts}
        >
          <ExternalLinkIcon size={14} />
          <span>Configure Shortcuts in Browser</span>
        </button>
      </div>

      {/* 3. Export & Import */}
      <div className="form_card">
        <div className="form_header">
          <div className="settings_card_title_row">
            <DownloadIcon size={18} className="settings_title_icon" />
            <span className="form_title">Backup & Restore</span>
          </div>
        </div>

        <p className="settings_subtitle">
          Export your custom bangs and preferences to a backup file, or restore from a previous backup.
        </p>

        <div className="backup_actions">
          <button
            type="button"
            className="btn btn_secondary backup_btn"
            onClick={handleExport}
          >
            <DownloadIcon size={14} />
            <span>Export Backup (.json)</span>
          </button>

          <button
            type="button"
            className="btn btn_secondary backup_btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon size={14} />
            <span>Import Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="sr_only"
            aria-label="Upload backup JSON file"
          />
        </div>
      </div>
    </div>
  );
};
