import { COLOR_PALETTE_PRESETS } from "@/constants";

export type ColorPickerRowProps = {
  id: string;
  label: string;
  value: string;
  defaultColor: string;
  ariaLabel: string;
  hexAriaLabel: string;
  onChange: (color: string) => void;
  onClear: () => void;
};

export const ColorPickerRow = ({
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

export type ColorCustomizerControlProps = {
  fontColor: string;
  secondaryFontColor: string;
  accentColor: string;
  onFontColorChange: (color: string) => void;
  onSecondaryFontColorChange: (color: string) => void;
  onAccentColorChange: (color: string) => void;
  onApplyPalette: (palette: (typeof COLOR_PALETTE_PRESETS)[number]) => void;
};

export const ColorCustomizerControl = ({
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
