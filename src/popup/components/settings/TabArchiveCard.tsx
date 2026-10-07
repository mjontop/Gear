import { ArchiveIcon } from "lucide-react";

export type TabArchiveCardProps = {
  autoCloseDiscardedTabs: boolean;
  maxArchivedTabs: number;
  archiveRetentionDays: number;
  onToggleAutoClose: (enabled: boolean) => void;
  onChangeMaxTabs: (max: number) => void;
  onChangeRetentionDays: (days: number) => void;
};

const MAX_TABS_PRESETS = [50, 100, 200, 500];
const RETENTION_DAYS_PRESETS = [3, 7, 14, 30];

export const TabArchiveCard = ({
  autoCloseDiscardedTabs,
  maxArchivedTabs,
  archiveRetentionDays,
  onToggleAutoClose,
  onChangeMaxTabs,
  onChangeRetentionDays,
}: TabArchiveCardProps) => {
  return (
    <div className="form_card">
      <div className="form_header">
        <div className="settings_card_title_row">
          <ArchiveIcon size={18} className="settings_title_icon" />
          <span className="form_title">Tab Archiving</span>
        </div>
      </div>

      <p className="settings_subtitle">
        Automatically close inactive tabs when discarded by Chrome Memory Saver
        and save them to local archive storage.
      </p>

      <div className="settings_list">
        <div className="setting_row">
          <div className="setting_label_group">
            <label
              htmlFor="pref-auto-close-discarded"
              className="setting_label"
            >
              <span>Auto-close discarded tabs</span>
            </label>
            <span
              id="pref-auto-close-discarded-desc"
              className="setting_helper"
            >
              Close tabs immediately upon discard to free up system resources.
            </span>
          </div>
          <div className="setting_control">
            <input
              id="pref-auto-close-discarded"
              type="checkbox"
              checked={autoCloseDiscardedTabs}
              aria-describedby="pref-auto-close-discarded-desc"
              onChange={(e) => onToggleAutoClose(e.target.checked)}
              className="setting_checkbox"
            />
          </div>
        </div>

        {autoCloseDiscardedTabs && (
          <>
            <div
              className="setting_row"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: "8px",
              }}
            >
              <div className="setting_label_group">
                <div className="style_control_header">
                  <label
                    htmlFor="pref-max-archived-tabs"
                    className="style_control_label"
                  >
                    Maximum archived tabs
                  </label>
                  <span className="style_value_badge">
                    {maxArchivedTabs} tabs
                  </span>
                </div>
                <span
                  id="pref-max-archived-tabs-desc"
                  className="setting_helper"
                >
                  Limit the total number of discarded tabs stored (oldest are
                  removed first).
                </span>
              </div>
              <input
                id="pref-max-archived-tabs"
                type="number"
                min="10"
                max="1000"
                step="10"
                value={maxArchivedTabs}
                aria-describedby="pref-max-archived-tabs-desc"
                onChange={(e) => {
                  const val = e.currentTarget.valueAsNumber;
                  if (Number.isFinite(val) && val > 0) {
                    onChangeMaxTabs(val);
                  }
                }}
                className="form_input"
              />
              <div
                className="preset_buttons_row"
                role="group"
                aria-label="Maximum tabs presets"
              >
                {MAX_TABS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset_pill_btn ${
                      maxArchivedTabs === preset ? "preset_pill_btn_active" : ""
                    }`}
                    onClick={() => onChangeMaxTabs(preset)}
                  >
                    {preset} tabs
                  </button>
                ))}
              </div>
            </div>

            <div
              className="setting_row"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: "8px",
              }}
            >
              <div className="setting_label_group">
                <div className="style_control_header">
                  <label
                    htmlFor="pref-retention-days"
                    className="style_control_label"
                  >
                    Retention period
                  </label>
                  <span className="style_value_badge">
                    {archiveRetentionDays} days
                  </span>
                </div>
                <span id="pref-retention-days-desc" className="setting_helper">
                  Remove archived tabs older than this duration.
                </span>
              </div>
              <input
                id="pref-retention-days"
                type="number"
                min="1"
                max="365"
                step="1"
                value={archiveRetentionDays}
                aria-describedby="pref-retention-days-desc"
                onChange={(e) => {
                  const val = e.currentTarget.valueAsNumber;
                  if (Number.isFinite(val) && val > 0) {
                    onChangeRetentionDays(val);
                  }
                }}
                className="form_input"
              />
              <div
                className="preset_buttons_row"
                role="group"
                aria-label="Retention days presets"
              >
                {RETENTION_DAYS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset_pill_btn ${
                      archiveRetentionDays === preset
                        ? "preset_pill_btn_active"
                        : ""
                    }`}
                    onClick={() => onChangeRetentionDays(preset)}
                  >
                    {preset} days
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
