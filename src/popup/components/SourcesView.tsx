import { BookmarkIcon, HistoryIcon, LayersIcon } from "lucide-react";
import type { SpotlightPreferences } from "@/lib/preferences";

type SourcesViewProps = {
  preferences: SpotlightPreferences;
  onPreferenceChange: <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => void;
};

export const SourcesView = ({
  preferences,
  onPreferenceChange,
}: SourcesViewProps) => {
  return (
    <div className="settings_container">
      <div className="form_card">
        <div className="form_header">
          <div className="settings_card_title_row">
            <LayersIcon size={18} className="settings_title_icon" />
            <span className="form_title">Spotlight Sources</span>
          </div>
        </div>

        <p className="settings_subtitle">
          Configure which local sources appear in your Spotlight search
          suggestions. By default, both are included.
        </p>

        <div className="settings_list">
          {/* Bookmarks Checkbox */}
          <div className="setting_row">
            <div className="setting_label_group">
              <label htmlFor="pref-bookmarks" className="setting_label">
                <BookmarkIcon size={16} className="setting_icon" />
                <span>Include Bookmarks</span>
              </label>
              <span id="pref-bookmarks-desc" className="setting_helper">
                Include matching bookmarks in Spotlight suggestions. Omitted if
                unchecked.
              </span>
            </div>
            <div className="setting_control">
              <input
                id="pref-bookmarks"
                type="checkbox"
                checked={preferences.includeBookmarks}
                aria-describedby="pref-bookmarks-desc"
                onChange={(e) =>
                  onPreferenceChange("includeBookmarks", e.target.checked)
                }
                className="setting_checkbox"
              />
            </div>
          </div>

          {/* History Checkbox */}
          <div className="setting_row">
            <div className="setting_label_group">
              <label htmlFor="pref-history" className="setting_label">
                <HistoryIcon size={16} className="setting_icon" />
                <span>Include Browsing History</span>
              </label>
              <span id="pref-history-desc" className="setting_helper">
                Include recently visited pages in Spotlight suggestions. Omitted
                if unchecked.
              </span>
            </div>
            <div className="setting_control">
              <input
                id="pref-history"
                type="checkbox"
                checked={preferences.includeHistory}
                aria-describedby="pref-history-desc"
                onChange={(e) =>
                  onPreferenceChange("includeHistory", e.target.checked)
                }
                className="setting_checkbox"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings_tip_card">
        <span className="settings_tip_title">💡 Active Search Scope</span>
        <p className="settings_tip_text">
          Open tabs and web searches (including your custom bangs) are always
          accessible in Spotlight. Use the toggles above if you want to omit
          bookmarks or browsing history from query suggestions.
        </p>
      </div>
    </div>
  );
};
