import {
  PaletteIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";

export type AppearanceCardProps = {
  selectedTheme: "dark" | "light" | "system";
  onSelectTheme: (theme: "dark" | "light" | "system") => void;
  enableBackgroundBlur: boolean;
  onToggleBackgroundBlur: (enabled: boolean) => void;
};

export const AppearanceCard = ({
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
