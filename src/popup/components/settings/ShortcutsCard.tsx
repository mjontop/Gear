import { KeyboardIcon, ExternalLinkIcon } from "lucide-react";

export type ShortcutsCardProps = {
  shortcuts: {
    toggle: string[];
    copyUrl: string[];
    openWithUrl: string[];
    toggleSidebar?: string[];
  };
  isFirefox: boolean;
  onOpenShortcuts: () => void;
};

export const ShortcutsCard = ({
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

    {shortcuts.toggleSidebar && (
      <div className="shortcut_setting_row" style={{ marginTop: "8px" }}>
        <div className="shortcut_info">
          <span className="shortcut_name">Toggle Sidebar</span>
          <span className="shortcut_desc">
            Open the sidebar drawer on the left side of the screen.
          </span>
        </div>
        <div className="shortcut_keys">
          {shortcuts.toggleSidebar.map((k, idx) => (
            <span
              key={`toggleSidebar-${k}-${idx}`}
              className="shortcut_key_piece"
            >
              {idx > 0 && <span className="shortcut_plus">+</span>}
              <kbd>{k}</kbd>
            </span>
          ))}
        </div>
      </div>
    )}

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
