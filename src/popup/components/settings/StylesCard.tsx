import { RotateCcwIcon, TypeIcon } from "lucide-react";
import {
  COLOR_PALETTE_PRESETS,
  DEFAULT_STYLE_VALUES,
  FONT_FAMILY_OPTIONS,
} from "@/constants";
import type { SpotlightPreferences } from "@/lib/preferences";
import {
  BorderRadiusControl,
  ColorCustomizerControl,
  FontFamilyControl,
  FontSizeControl,
  FontWeightControl,
  StylesLivePreview,
} from "./StyleControls";

export type StylesCardProps = {
  preferences: SpotlightPreferences;
  onPreferenceChange: <K extends keyof SpotlightPreferences>(
    key: K,
    value: SpotlightPreferences[K],
  ) => void;
  onResetStyles: () => void;
  onShowStatus: (text: string, type?: "success" | "error") => void;
};

export const StylesCard = ({
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
