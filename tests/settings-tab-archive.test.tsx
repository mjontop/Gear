import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabArchiveCard } from "@/popup/components/settings/TabArchiveCard";
import { SettingsView } from "@/popup/components/SettingsView";
import { DEFAULT_SPOTLIGHT_PREFERENCES } from "@/lib/preferences";

describe("TabArchiveCard", () => {
  it("renders TabArchiveCard with all controls when auto-close is enabled", () => {
    const onToggleAutoClose = vi.fn();
    const onChangeMaxTabs = vi.fn();
    const onChangeRetentionDays = vi.fn();

    render(
      <TabArchiveCard
        autoCloseDiscardedTabs={true}
        maxArchivedTabs={100}
        archiveRetentionDays={7}
        onToggleAutoClose={onToggleAutoClose}
        onChangeMaxTabs={onChangeMaxTabs}
        onChangeRetentionDays={onChangeRetentionDays}
      />,
    );

    expect(screen.getByText("Tab Archiving")).toBeInTheDocument();
    const checkbox = screen.getByLabelText(/Auto-close discarded tabs/i);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(onToggleAutoClose).toHaveBeenCalledWith(false);

    // Test preset buttons
    const preset200Btn = screen.getByRole("button", { name: "200 tabs" });
    fireEvent.click(preset200Btn);
    expect(onChangeMaxTabs).toHaveBeenCalledWith(200);

    const preset14DaysBtn = screen.getByRole("button", { name: "14 days" });
    fireEvent.click(preset14DaysBtn);
    expect(onChangeRetentionDays).toHaveBeenCalledWith(14);

    // Test number inputs
    const maxTabsInput = screen.getByLabelText(/Maximum archived tabs/i);
    fireEvent.change(maxTabsInput, { target: { value: "150" } });
    expect(onChangeMaxTabs).toHaveBeenCalledWith(150);

    const retentionInput = screen.getByLabelText(/Retention period/i);
    fireEvent.change(retentionInput, { target: { value: "30" } });
    expect(onChangeRetentionDays).toHaveBeenCalledWith(30);
  });

  it("hides extra controls when auto-close is disabled", () => {
    render(
      <TabArchiveCard
        autoCloseDiscardedTabs={false}
        maxArchivedTabs={100}
        archiveRetentionDays={7}
        onToggleAutoClose={vi.fn()}
        onChangeMaxTabs={vi.fn()}
        onChangeRetentionDays={vi.fn()}
      />,
    );

    const checkbox = screen.getByLabelText(/Auto-close discarded tabs/i);
    expect(checkbox).not.toBeChecked();

    expect(
      screen.queryByLabelText(/Maximum archived tabs/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Retention period/i),
    ).not.toBeInTheDocument();
  });

  it("integrates with SettingsView and triggers preference changes", () => {
    const onPreferenceChange = vi.fn();

    render(
      <SettingsView
        preferences={DEFAULT_SPOTLIGHT_PREFERENCES}
        onPreferenceChange={onPreferenceChange}
        onShowStatus={vi.fn()}
      />,
    );

    expect(screen.getByText("Tab Archiving")).toBeInTheDocument();

    const checkbox = screen.getByLabelText(/Auto-close discarded tabs/i);
    fireEvent.click(checkbox);
    expect(onPreferenceChange).toHaveBeenCalledWith(
      "autoCloseDiscardedTabs",
      false,
    );

    const preset50Btn = screen.getByRole("button", { name: "50 tabs" });
    fireEvent.click(preset50Btn);
    expect(onPreferenceChange).toHaveBeenCalledWith("maxArchivedTabs", 50);

    const preset3DaysBtn = screen.getByRole("button", { name: "3 days" });
    fireEvent.click(preset3DaysBtn);
    expect(onPreferenceChange).toHaveBeenCalledWith("archiveRetentionDays", 3);
  });
});
