import {
  BookmarkIcon,
  GlobeIcon,
  HistoryIcon,
  LayersIcon,
} from "lucide-react";
import { SEARCH_PROVIDERS } from "@/constants";
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

      <div className="form_card">
        <div className="form_header">
          <div className="settings_card_title_row">
            <GlobeIcon size={18} className="settings_title_icon" />
            <span className="form_title">Search Engine Provider</span>
          </div>
        </div>

        <p className="settings_subtitle">
          Choose which search engine to use for web searches and query
          suggestions in Spotlight.
        </p>

        <div
          className="search_provider_list"
          role="radiogroup"
          aria-label="Search Engine Provider"
        >
          {Object.values(SEARCH_PROVIDERS).map((provider) => {
            const isSelected =
              (preferences.searchProvider || "google") === provider.id;

            return (
              <label
                key={provider.id}
                htmlFor={`provider-${provider.id}`}
                className={`search_provider_option ${
                  isSelected ? "search_provider_option_active" : ""
                }`}
              >
                <div className="search_provider_radio_wrap">
                  <input
                    id={`provider-${provider.id}`}
                    type="radio"
                    name="search-provider"
                    value={provider.id}
                    checked={isSelected}
                    onChange={() =>
                      onPreferenceChange("searchProvider", provider.id)
                    }
                    className="search_provider_radio"
                  />
                </div>
                <div className="search_provider_info">
                  <span className="search_provider_name">{provider.name}</span>
                  <span className="search_provider_domain">
                    {provider.domain}
                  </span>
                </div>
                {provider.id === "google" && (
                  <span className="provider_badge_default">Default</span>
                )}
              </label>
            );
          })}
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
