import { EyeIcon, SearchIcon } from "lucide-react";
import {
  BORDER_RADIUS_PRESETS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_PRESETS,
  FONT_WEIGHT_OPTIONS,
} from "@/constants";

export {
  ColorPickerRow,
  ColorCustomizerControl,
  type ColorPickerRowProps,
  type ColorCustomizerControlProps,
} from "./ColorControls";

export type StylesLivePreviewProps = {
  borderRadius: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
  secondaryFontColor: string;
  accentColor: string;
};

export const StylesLivePreview = ({
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

export type FontSizeControlProps = {
  fontSize: number;
  onChange: (fontSize: number) => void;
};

export const FontSizeControl = ({
  fontSize,
  onChange,
}: FontSizeControlProps) => (
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

export type FontWeightControlProps = {
  fontWeight: string;
  onChange: (fontWeight: string) => void;
};

export const FontWeightControl = ({
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

export type FontFamilyControlProps = {
  fontFamily: string;
  onChange: (fontFamily: string) => void;
};

export const FontFamilyControl = ({
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

export type BorderRadiusControlProps = {
  borderRadius: number;
  onChange: (borderRadius: number) => void;
};

export const BorderRadiusControl = ({
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
