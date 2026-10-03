import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsView } from "@/popup/components/SettingsView";

describe("SettingsView Typography & Styles", () => {
  it("renders SettingsView typography and styles controls and updates preferences", () => {
    const onPreferenceChange = vi.fn();
    const onShowStatus = vi.fn();
    render(
      <SettingsView
        preferences={{
          includeBookmarks: true,
          includeHistory: true,
          searchProvider: "google",
          enableBackgroundBlur: true,
          theme: "dark",
          fontSize: 16,
          fontWeight: "400",
          fontFamily: "Roboto",
          fontColor: "#ffffff",
          secondaryFontColor: "#aaaaaa",
          accentColor: "#38bdf8",
          borderRadius: 10,
        }}
        onPreferenceChange={onPreferenceChange}
        onShowStatus={onShowStatus}
      />,
    );

    expect(screen.getByText("Typography & Styles")).toBeInTheDocument();
    expect(screen.getByText("Live Preview")).toBeInTheDocument();

    // Font size slider & preset
    const fontSizeSlider = screen.getByLabelText("Font size");
    fireEvent.change(fontSizeSlider, { target: { value: "18" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 18);

    const smallPresetBtn = screen.getByRole("button", {
      name: /Small \(14px\)/i,
    });
    fireEvent.click(smallPresetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 14);

    // Font weight preset
    const boldWeightBtn = screen.getByRole("button", {
      name: /Bold \(700\)/i,
    });
    fireEvent.click(boldWeightBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontWeight", "700");

    // Font family dropdown
    const fontFamilySelect = screen.getByLabelText("Font family");
    fireEvent.change(fontFamilySelect, { target: { value: "Inter" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontFamily", "Inter");

    // Corner radius slider & preset
    const borderRadiusSlider = screen.getByLabelText("Corner radius");
    fireEvent.change(borderRadiusSlider, { target: { value: "16" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("borderRadius", 16);

    const pillPresetBtn = screen.getByRole("button", {
      name: /Pill \(24px\)/i,
    });
    fireEvent.click(pillPresetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("borderRadius", 24);

    // Color Palette preset
    const emeraldPaletteBtn = screen.getByTitle(/Emerald Palette/i);
    fireEvent.click(emeraldPaletteBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#ecfdf5");
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#a7f3d0",
    );
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#10b981");
    expect(onShowStatus).toHaveBeenCalledWith('Applied "Emerald" palette');

    // Custom color input & clear
    const fontColorSwatch = screen.getByLabelText("Primary font color");
    fireEvent.change(fontColorSwatch, { target: { value: "#abcdef" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#abcdef");

    const fontColorInput = screen.getByLabelText("Primary font color hex code");
    fireEvent.change(fontColorInput, { target: { value: "#123456" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "#123456");

    const secColorSwatch = screen.getByLabelText("Secondary font color");
    fireEvent.change(secColorSwatch, { target: { value: "#654321" } });
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#654321",
    );

    const secColorInput = screen.getByLabelText(
      "Secondary font color hex code",
    );
    fireEvent.change(secColorInput, { target: { value: "#555555" } });
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "secondaryFontColor",
      "#555555",
    );

    const accentColorSwatch = screen.getByLabelText("Accent color");
    fireEvent.change(accentColorSwatch, { target: { value: "#778899" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#778899");

    const accentColorInput = screen.getByLabelText("Accent color hex code");
    fireEvent.change(accentColorInput, { target: { value: "#8899aa" } });
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "#8899aa");

    const clearBtns = screen.getAllByRole("button", { name: "Clear" });
    fireEvent.click(clearBtns[0]);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontColor", "");

    fireEvent.click(clearBtns[1]);
    expect(onPreferenceChange).toHaveBeenCalledWith("secondaryFontColor", "");

    fireEvent.click(clearBtns[2]);
    expect(onPreferenceChange).toHaveBeenCalledWith("accentColor", "");

    // Reset styles
    const resetBtn = screen.getByRole("button", {
      name: /Reset/i,
    });
    fireEvent.click(resetBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("fontSize", 16);
    expect(onShowStatus).toHaveBeenCalledWith("Styles reset to defaults");
  });
});
