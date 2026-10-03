import { useEffect, useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  KeyboardIcon,
  MoonIcon,
  PaletteIcon,
  RotateCcwIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SunIcon,
  TypeIcon,
  UploadIcon,
} from "lucide-react";
import {
  BORDER_RADIUS_PRESETS,
  COLOR_PALETTE_PRESETS,
  DEFAULT_STYLE_VALUES,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_OPTIONS,
} from "@/constants";
import { getCustomBangs, saveCustomBangs } from "@/lib/bangs-storage";
import { isFirefoxBrowser } from "@/lib/favicon";
import {
  DEFAULT_STYLE_PREFERENCES,
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

    <div
      className="theme_selector"
      role="radiogroup"
      aria-label="Theme selection"
    >
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

type StylesLivePreviewProps = {
  borderRadius: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
  secondaryFontColor: string;
  accentColor: string;
};

const StylesLivePreview = ({
  borderRadius,
  fontFamily,
  fontSize,
  fontWeight,
  fontColor,
  secondaryFontColor,
  accentColor,
}: StylesLivePreviewProps) => (
  <div className="preview_section">
    <div className="preview_label_row">
      <EyeIcon size={14} className="preview_icon" />
      <span className="preview_heading">Live Preview</span>
    </div>
    <div
      className="spotlight_preview_container"
      style={{
        borderRadius: `${borderRadius}px`,
        fontFamily,
      }}
    >
      <div className="preview_search_header">
        <SearchIcon
          size={18}
          style={{
            color: accentColor || "var(--color-primary)",
          }}
          className="preview_search_icon"
        />
        <span
          className="preview_search_text"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            color: fontColor || "inherit",
          }}
        >
          Search or enter URL...
        </span>
      </div>
      <div className="preview_results_list">
        <div className="preview_item">
          <span
            className="preview_item_bullet"
            style={{
              backgroundColor: accentColor || "var(--color-primary)",
            }}
          />
          <span
            className="preview_item_title"
            style={{
              fontSize: `calc(${fontSize}px * 0.9)`,
              fontWeight,
              color: fontColor || "inherit",
            }}
          >
            GitHub Dashboard
          </span>
          <span
            className="preview_item_badge"
            style={{
              fontSize: `calc(${fontSize}px * 0.7)`,
              color: secondaryFontColor || "var(--text-muted)",
            }}
          >
            Jump to tab ↵
          </span>
        </div>
      </div>
    </div>
  </div>
);

type FontSizeControlProps = {
  fontSize: number;
  onChange: (fontSize: number) => void;
};

const FontSizeControl = ({ fontSize, onChange }: FontSizeControlProps) => (
  <div className="style_control_group">
    <div className="style_control_header">
      <label htmlFor="pref-font-size" className="style_control_label">
        Font Size
      </label>
      <span className="style_value_badge">{fontSize}px</span>
    </div>
    <input
      id="pref-font-size"
      type="range"
      min="12"
      max="24"
      step="1"
      value={fontSize}
      onChange={(e) => onChange(Number(e.target.value))}
      className="style_range_slider"
      aria-label="Font size"
    />
    <div
      className="preset_buttons_row"
      role="group"
      aria-label="Font size presets"
    >
      {FONT_SIZE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          className={`preset_pill_btn ${fontSize === preset.value ? "preset_pill_btn_active" : ""}`}
          onClick={() => onChange(preset.value)}
        >
          {preset.label} ({preset.value}px)
        </button>
      ))}
    </div>
  </div>
);

type FontWeightControlProps = {
  fontWeight: string;
  onChange: (fontWeight: string) => void;
};

const FontWeightControl = ({
  fontWeight,
  onChange,
}: FontWeightControlProps) => (
  <div className="style_control_group">
    <div className="style_control_header">
      <span id="label-font-weight" className="style_control_label">
        Font Weight
      </span>
      <span className="style_value_badge">
        {FONT_WEIGHT_OPTIONS.find((o) => o.value === fontWeight)?.label ||
          fontWeight}
      </span>
    </div>
    <div
      className="preset_buttons_row"
      role="group"
      aria-labelledby="label-font-weight"
    >
      {FONT_WEIGHT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`preset_pill_btn ${fontWeight === opt.value ? "preset_pill_btn_active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label} ({opt.value})
        </button>
      ))}
    </div>
  </div>
);

type FontFamilyControlProps = {
  fontFamily: string;
  onChange: (fontFamily: string) => void;
};

const FontFamilyControl = ({
  fontFamily,
  onChange,
}: FontFamilyControlProps) => (
  <div className="style_control_group">
    <div className="style_control_header">
      <label htmlFor="pref-font-family" className="style_control_label">
        Font Family
      </label>
    </div>
    <select
      id="pref-font-family"
      value={fontFamily}
      onChange={(e) => onChange(e.target.value)}
      className="style_select_input"
      aria-label="Font family"
    >
      {FONT_FAMILY_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
);

type BorderRadiusControlProps = {
  borderRadius: number;
  onChange: (borderRadius: number) => void;
};

const BorderRadiusControl = ({
  borderRadius,
  onChange,
}: BorderRadiusControlProps) => (
  <div className="style_control_group">
    <div className="style_control_header">
      <label htmlFor="pref-border-radius" className="style_control_label">
        Corner Radius
      </label>
      <span className="style_value_badge">{borderRadius}px</span>
    </div>
    <input
      id="pref-border-radius"
      type="range"
      min="0"
      max="24"
      step="2"
      value={borderRadius}
      onChange={(e) => onChange(Number(e.target.value))}
      className="style_range_slider"
      aria-label="Corner radius"
    />
    <div
      className="preset_buttons_row"
      role="group"
      aria-label="Corner radius presets"
    >
      {BORDER_RADIUS_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          className={`preset_pill_btn ${borderRadius === preset.value ? "preset_pill_btn_active" : ""}`}
          onClick={() => onChange(preset.value)}
        >
          {preset.label} ({preset.value}px)
        </button>
      ))}
    </div>
  </div>
);

type ColorPickerRowProps = {
  id: string;
  label: string;
  value: string;
  defaultColor: string;
  ariaLabel: string;
  hexAriaLabel: string;
  onChange: (color: string) => void;
  onClear: () => void;
};

const ColorPickerRow = ({
  id,
  label,
  value,
  defaultColor,
  ariaLabel,
  hexAriaLabel,
  onChange,
  onClear,
}: ColorPickerRowProps) => (
  <div className="color_picker_row">
    <label htmlFor={id} className="color_picker_name">
      {label}
    </label>
    <div className="color_picker_actions">
      <input
        id={id}
        type="color"
        value={value || defaultColor}
        onChange={(e) => onChange(e.target.value)}
        className="color_picker_swatch_input"
        aria-label={ariaLabel}
      />
      <input
        type="text"
        value={value}
        placeholder="Default"
        onChange={(e) => onChange(e.target.value)}
        className="color_hex_text_input"
        aria-label={hexAriaLabel}
      />
      {value && (
        <button type="button" className="btn_clear_small" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  </div>
);

type ColorCustomizerControlProps = {
  fontColor: string;
  secondaryFontColor: string;
  accentColor: string;
  onFontColorChange: (color: string) => void;
  onSecondaryFontColorChange: (color: string) => void;
  onAccentColorChange: (color: string) => void;
  onApplyPalette: (palette: (typeof COLOR_PALETTE_PRESETS)[number]) => void;
};

const ColorCustomizerControl = ({
  fontColor,
  secondaryFontColor,
  accentColor,
  onFontColorChange,
  onSecondaryFontColorChange,
  onAccentColorChange,
  onApplyPalette,
}: ColorCustomizerControlProps) => (
  <div className="style_control_group">
    <div className="style_control_header">
      <span id="label-color-palettes" className="style_control_label">
        Color Palettes
      </span>
    </div>
    <div
      className="palette_presets_row"
      role="group"
      aria-labelledby="label-color-palettes"
    >
      {COLOR_PALETTE_PRESETS.map((palette) => (
        <button
          key={palette.name}
          type="button"
          className="palette_preset_btn"
          onClick={() => onApplyPalette(palette)}
          title={`${palette.name} Palette`}
        >
          <span
            className="palette_swatch"
            style={{
              backgroundColor: palette.accent || "var(--color-primary)",
            }}
          />
          <span>{palette.name}</span>
        </button>
      ))}
    </div>

    <div className="color_pickers_list">
      <ColorPickerRow
        id="pref-font-color"
        label="Primary Text Color"
        value={fontColor}
        defaultColor="#ffffff"
        ariaLabel="Primary font color"
        hexAriaLabel="Primary font color hex code"
        onChange={onFontColorChange}
        onClear={() => onFontColorChange("")}
      />
      <ColorPickerRow
        id="pref-secondary-font-color"
        label="Secondary / Hint Color"
        value={secondaryFontColor}
        defaultColor="#94a3b8"
        ariaLabel="Secondary font color"
        hexAriaLabel="Secondary font color hex code"
        onChange={onSecondaryFontColorChange}
        onClear={() => onSecondaryFontColorChange("")}
      />
      <ColorPickerRow
        id="pref-accent-color"
        label="Accent / Highlight Color"
        value={accentColor}
        defaultColor="#38bdf8"
        ariaLabel="Accent color"
        hexAriaLabel="Accent color hex code"
        onChange={onAccentColorChange}
        onClear={() => onAccentColorChange("")}
      />
    </div>
  </div>
);

type StylesCardProps = {
  preferences: SpotlightPreferences;
  onPreferenceChange: <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => void;
  onResetStyles: () => void;
  onShowStatus: (text: string, type?: "success" | "error") => void;
};

const StylesCard = ({
  preferences,
  onPreferenceChange,
  onResetStyles,
  onShowStatus,
}: StylesCardProps) => {
  const currentFontSize = preferences.fontSize ?? DEFAULT_STYLE_VALUES.fontSize;
  const currentFontWeight =
    preferences.fontWeight ?? DEFAULT_STYLE_VALUES.fontWeight;
  const currentFontFamily =
    preferences.fontFamily ?? DEFAULT_STYLE_VALUES.fontFamily;
  const currentFontColor = preferences.fontColor ?? "";
  const currentSecondaryFontColor = preferences.secondaryFontColor ?? "";
  const currentAccentColor = preferences.accentColor ?? "";
  const currentBorderRadius =
    preferences.borderRadius ?? DEFAULT_STYLE_VALUES.borderRadius;

  const resolvedFontFamily =
    FONT_FAMILY_OPTIONS.find(
      (f) =>
        f.id.toLowerCase() === currentFontFamily.toLowerCase() ||
        f.name.toLowerCase() === currentFontFamily.toLowerCase(),
    )?.value || currentFontFamily;

  const handleApplyPalette = (
    palette: (typeof COLOR_PALETTE_PRESETS)[number],
  ) => {
    onPreferenceChange("fontColor", palette.primary);
    onPreferenceChange("secondaryFontColor", palette.secondary);
    onPreferenceChange("accentColor", palette.accent);
    onShowStatus(`Applied "${palette.name}" palette`);
  };

  return (
    <div className="form_card">
      <div className="form_header">
        <div className="settings_card_title_row">
          <TypeIcon size={18} className="settings_title_icon" />
          <span className="form_title">Typography & Styles</span>
        </div>
        <button
          type="button"
          className="btn_reset_header"
          onClick={onResetStyles}
          title="Reset styles to defaults"
        >
          <RotateCcwIcon size={13} />
          <span>Reset</span>
        </button>
      </div>

      <p className="settings_subtitle">
        Customize font size, weight, colors, typeface, and corner curvature.
      </p>

      <StylesLivePreview
        borderRadius={currentBorderRadius}
        fontFamily={resolvedFontFamily}
        fontSize={currentFontSize}
        fontWeight={currentFontWeight}
        fontColor={currentFontColor}
        secondaryFontColor={currentSecondaryFontColor}
        accentColor={currentAccentColor}
      />

      <FontSizeControl
        fontSize={currentFontSize}
        onChange={(val) => onPreferenceChange("fontSize", val)}
      />

      <FontWeightControl
        fontWeight={currentFontWeight}
        onChange={(val) => onPreferenceChange("fontWeight", val)}
      />

      <FontFamilyControl
        fontFamily={currentFontFamily}
        onChange={(val) => onPreferenceChange("fontFamily", val)}
      />

      <BorderRadiusControl
        borderRadius={currentBorderRadius}
        onChange={(val) => onPreferenceChange("borderRadius", val)}
      />

      <ColorCustomizerControl
        fontColor={currentFontColor}
        secondaryFontColor={currentSecondaryFontColor}
        accentColor={currentAccentColor}
        onFontColorChange={(val) => onPreferenceChange("fontColor", val)}
        onSecondaryFontColorChange={(val) =>
          onPreferenceChange("secondaryFontColor", val)
        }
        onAccentColorChange={(val) => onPreferenceChange("accentColor", val)}
        onApplyPalette={handleApplyPalette}
      />
    </div>
  );
};

type ShortcutsCardProps = {
  shortcuts: {
    toggle: string[];
    copyUrl: string[];
    openWithUrl: string[];
  };
  isFirefox: boolean;
  onOpenShortcuts: () => void;
};

const ShortcutsCard = ({
  shortcuts,
  isFirefox,
  onOpenShortcuts,
}: ShortcutsCardProps) => (
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

    {isFirefox ? (
      <p className="shortcut_tip_text">
        💡 <strong>In Firefox:</strong> Open <kbd>about:addons</kbd> in a new
        tab → click ⚙️ (gear icon) → select{" "}
        <strong>Manage Extension Shortcuts</strong> to customize these keys.
      </p>
    ) : (
      <>
        <p className="shortcut_tip_text">
          💡 <strong>Tip:</strong> You can customize any shortcut in browser
          settings. For instance, rebind Spotlight to <kbd>Ctrl</kbd> +{" "}
          <kbd>T</kbd> / <kbd>Cmd</kbd> + <kbd>T</kbd> to replace your new tab
          page!
        </p>

        <button
          type="button"
          className="btn btn_secondary shortcut_action_btn"
          onClick={onOpenShortcuts}
        >
          <ExternalLinkIcon size={14} />
          <span>Configure Shortcuts in Browser</span>
        </button>
      </>
    )}
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
      Export your custom bangs and preferences to a backup file, or restore from
      a previous backup.
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

      <BackupRestoreCard
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
        onImportFile={handleImportFile}
        fileInputRef={fileInputRef}
      />
    </div>
  );
};
