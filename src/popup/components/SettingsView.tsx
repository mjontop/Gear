import { useEffect, useRef, useState } from "react";
import { getCustomBangs, saveCustomBangs } from "@/lib/bangs-storage";
import { isFirefoxBrowser } from "@/lib/favicon";
import { DEFAULT_ARCHIVE_CONFIG } from "@/constants";
import {
  DEFAULT_STYLE_PREFERENCES,
  getSpotlightPreferences,
  saveSpotlightPreferences,
  type SpotlightPreferences,
} from "@/lib/preferences";
import { AppearanceCard } from "./settings/AppearanceCard";
import { BackupRestoreCard } from "./settings/BackupRestoreCard";
import { ShortcutsCard } from "./settings/ShortcutsCard";
import { StylesCard } from "./settings/StylesCard";
import { TabArchiveCard } from "./settings/TabArchiveCard";

export type SettingsViewProps = {
  preferences: SpotlightPreferences;
  onPreferenceChange: <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => void;
  onShowStatus: (text: string, type?: "success" | "error") => void;
  onDataImported?: () => void;
};

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

  const isFirefox = isFirefoxBrowser();

  const handleOpenShortcuts = () => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    } else {
      window.open(
        "chrome://extensions/shortcuts",
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const handleExport = async () => {
    try {
      const customBangs = await getCustomBangs();
      const storedPreferences = await getSpotlightPreferences();

      const backupData = {
        name: "Gear Backup",
        version: "0.1.1",
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

  const handleResetStyles = () => {
    onPreferenceChange("fontSize", DEFAULT_STYLE_PREFERENCES.fontSize);
    onPreferenceChange("fontWeight", DEFAULT_STYLE_PREFERENCES.fontWeight);
    onPreferenceChange("fontFamily", DEFAULT_STYLE_PREFERENCES.fontFamily);
    onPreferenceChange("fontColor", DEFAULT_STYLE_PREFERENCES.fontColor);
    onPreferenceChange(
      "secondaryFontColor",
      DEFAULT_STYLE_PREFERENCES.secondaryFontColor,
    );
    onPreferenceChange("accentColor", DEFAULT_STYLE_PREFERENCES.accentColor);
    onPreferenceChange("borderRadius", DEFAULT_STYLE_PREFERENCES.borderRadius);
    onShowStatus("Styles reset to defaults");
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

      <StylesCard
        preferences={preferences}
        onPreferenceChange={onPreferenceChange}
        onResetStyles={handleResetStyles}
        onShowStatus={onShowStatus}
      />

      <ShortcutsCard
        shortcuts={shortcuts}
        isFirefox={isFirefox}
        onOpenShortcuts={handleOpenShortcuts}
      />

      <TabArchiveCard
        autoCloseDiscardedTabs={
          preferences.autoCloseDiscardedTabs ??
          DEFAULT_ARCHIVE_CONFIG.AUTO_CLOSE_DISCARDED
        }
        maxArchivedTabs={
          preferences.maxArchivedTabs ??
          DEFAULT_ARCHIVE_CONFIG.MAX_ARCHIVED_TABS
        }
        archiveRetentionDays={
          preferences.archiveRetentionDays ??
          DEFAULT_ARCHIVE_CONFIG.RETENTION_DAYS
        }
        onToggleAutoClose={(enabled) =>
          onPreferenceChange("autoCloseDiscardedTabs", enabled)
        }
        onChangeMaxTabs={(max) => onPreferenceChange("maxArchivedTabs", max)}
        onChangeRetentionDays={(days) =>
          onPreferenceChange("archiveRetentionDays", days)
        }
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
