import { useEffect, useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  KeyboardIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SparklesIcon,
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
  preferences: SpotlightPreferences;
  onPreferenceChange: <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => void;
  onShowStatus: (text: string, type?: "success" | "error") => void;
  onDataImported?: () => void;
};

type AppearanceCardProps = {
  selectedTheme: "dark" | "light" | "system";
  onSelectTheme: (theme: "dark" | "light" | "system") => void;
  enableBackgroundBlur: boolean;
  onToggleBackgroundBlur: (enabled: boolean) => void;
};

const AppearanceCard = ({
  selectedTheme,
  onSelectTheme,
  enableBackgroundBlur,
  onToggleBackgroundBlur,
}: AppearanceCardProps) => (
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
        onClick={() => onSelectTheme("dark")}
        role="radio"
        aria-checked={selectedTheme === "dark"}
      >
        <MoonIcon size={15} />
        <span>Dark</span>
        {selectedTheme === "dark" && (
          <span className="theme_badge_current">Active</span>
        )}
      </button>

      <button
        type="button"
        className={`theme_btn ${selectedTheme === "light" ? "theme_btn_active" : ""}`}
        onClick={() => onSelectTheme("light")}
        role="radio"
        aria-checked={selectedTheme === "light"}
      >
        <SunIcon size={15} />
        <span>Light</span>
        {selectedTheme === "light" && (
          <span className="theme_badge_current">Active</span>
        )}
      </button>

      <button
        type="button"
        className={`theme_btn ${selectedTheme === "system" ? "theme_btn_active" : ""}`}
        onClick={() => onSelectTheme("system")}
        role="radio"
        aria-checked={selectedTheme === "system"}
      >
        <SettingsIcon size={15} />
        <span>System</span>
        {selectedTheme === "system" && (
          <span className="theme_badge_current">Active</span>
        )}
      </button>
    </div>

    <div
      className="settings_list"
      style={{
        marginTop: "16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        paddingTop: "14px",
      }}
    >
      <div className="setting_row">
        <div className="setting_label_group">
          <label htmlFor="pref-background-blur" className="setting_label">
            <SparklesIcon size={16} className="setting_icon" />
            <span>Background Blur</span>
          </label>
          <span id="pref-background-blur-desc" className="setting_helper">
            Blur the page background when Spotlight is open. Uncheck to disable.
          </span>
        </div>
        <div className="setting_control">
          <input
            id="pref-background-blur"
            type="checkbox"
            checked={enableBackgroundBlur}
            aria-describedby="pref-background-blur-desc"
            onChange={(e) => onToggleBackgroundBlur(e.target.checked)}
            className="setting_checkbox"
          />
        </div>
      </div>
    </div>
  </div>
);

type ShortcutsCardProps = {
  shortcuts: {
    toggle: string[];
    copyUrl: string[];
    openWithUrl: string[];
  };
  onOpenShortcuts: () => void;
};

const ShortcutsCard = ({ shortcuts, onOpenShortcuts }: ShortcutsCardProps) => (
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
        <span className="shortcut_name">Open with Current URL</span>
        <span className="shortcut_desc">
          Open Spotlight with active page URL prefilled and selected.
        </span>
      </div>
      <div className="shortcut_keys">
        {shortcuts.openWithUrl.map((k, idx) => (
          <span key={`openWithUrl-${k}-${idx}`} className="shortcut_key_piece">
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
      onClick={onOpenShortcuts}
    >
      <ExternalLinkIcon size={14} />
      <span>Configure Shortcuts in Browser</span>
    </button>
  </div>
);

type BackupRestoreCardProps = {
  onExport: () => void;
  onImportClick: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

const BackupRestoreCard = ({
  onExport,
  onImportClick,
  onImportFile,
  fileInputRef,
}: BackupRestoreCardProps) => (
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
        onClick={onExport}
      >
        <DownloadIcon size={14} />
        <span>Export Backup (.json)</span>
      </button>

      <button
        type="button"
        className="btn btn_secondary backup_btn"
        onClick={onImportClick}
      >
        <UploadIcon size={14} />
        <span>Import Backup</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onImportFile}
        className="sr_only"
        aria-label="Upload backup JSON file"
      />
    </div>
  </div>
);

export const SettingsView = ({
  preferences,
  onPreferenceChange,
  onShowStatus,
  onDataImported,
}: SettingsViewProps) => {
  const handleSelectTheme = (theme: "dark" | "light" | "system") => {
    onPreferenceChange("theme", theme);
    const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
    onShowStatus(`Theme switched to ${themeName}`);
  };
  const [shortcuts, setShortcuts] = useState({
    toggle: ["Alt", "M"],
    copyUrl: ["Alt", "Shift", "L"],
    openWithUrl: ["Alt", "L"],
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
          if (cmd.name === "open-spotlight-with-url" && cmd.shortcut) {
            setShortcuts((prev) => ({
              ...prev,
              openWithUrl: cmd.shortcut!.split("+").map((s) => s.trim()),
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
      const storedPreferences = await getSpotlightPreferences();

      const backupData = {
        name: "Gear Backup",
        version: "0.1.0",
        exportDate: new Date().toISOString(),
        customBangs,
        preferences: storedPreferences,
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
      <AppearanceCard
        selectedTheme={preferences.theme || "dark"}
        onSelectTheme={handleSelectTheme}
        enableBackgroundBlur={preferences.enableBackgroundBlur}
        onToggleBackgroundBlur={(enabled) =>
          onPreferenceChange("enableBackgroundBlur", enabled)
        }
      />

      <ShortcutsCard
        shortcuts={shortcuts}
        onOpenShortcuts={handleOpenShortcuts}
      />

      <BackupRestoreCard
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
        onImportFile={handleImportFile}
        fileInputRef={fileInputRef}
      />
    </div>
  );
};
