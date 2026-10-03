import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import ContentApp from "@/content/views/App";
import PopupApp from "@/popup/App";

import { SPOTLIGHT_PREFERENCES_STORAGE_KEY } from "@/constants";

describe("Application Root Views", () => {
  describe("Content App (content/views/App.tsx)", () => {
    it("renders ContentApp and sets data-theme and style variables on host container", async () => {
      const hostElem = document.createElement("div");
      hostElem.id = "crxjs-app";
      document.body.appendChild(hostElem);

      await (globalThis as any).chrome.storage.sync.set({
        [SPOTLIGHT_PREFERENCES_STORAGE_KEY]: {
          fontSize: 18,
          fontColor: "",
          secondaryFontColor: "",
          accentColor: "",
        },
      });

      let container: any;
      await act(async () => {
        const rendered = render(<ContentApp />);
        container = rendered.container;
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(container).toBeInTheDocument();
      expect(hostElem.getAttribute("data-theme")).toBeTruthy();

      document.body.removeChild(hostElem);
    });

    it("renders ContentApp safely when crxjs-app host is not present", async () => {
      let container: any;
      await act(async () => {
        const rendered = render(<ContentApp />);
        container = rendered.container;
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe("Popup App (popup/App.tsx)", () => {
    it("handles bang and bookmark forms and error clearing in PopupApp", async () => {
      render(<PopupApp />);

      expect(screen.getByText("Gear Manager")).toBeInTheDocument();
      expect(screen.getByText("Add Custom Bang")).toBeInTheDocument();

      // Typing into inputs when no errors exist (false branch of if (formErrors...))
      const prefixInput = screen.getByPlaceholderText("e.g. !gh, !ddg");
      fireEvent.change(prefixInput, { target: { value: "!temp" } });
      const urlInput = screen.getByPlaceholderText(
        "https://github.com/search?q=%s",
      );
      fireEvent.change(urlInput, {
        target: { value: "https://temp.com?q=%s" },
      });

      // Clear inputs to trigger validation errors
      fireEvent.change(prefixInput, { target: { value: "" } });
      fireEvent.change(urlInput, { target: { value: "" } });

      // Trigger validation error on Bang form by submitting empty inputs
      const addBangBtn = screen.getByRole("button", { name: /Add Bang/i });
      await act(async () => {
        fireEvent.click(addBangBtn);
      });
      expect(
        screen.getByText("Bang prefix cannot be empty."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Destination URL cannot be empty."),
      ).toBeInTheDocument();

      // Typing into inputs when errors exist (true branch of if (formErrors...))
      fireEvent.change(prefixInput, { target: { value: "!myb" } });
      expect(screen.queryByText("Bang prefix cannot be empty.")).toBeNull();

      fireEvent.change(urlInput, {
        target: { value: "https://mysite.com?q=%s" },
      });
      expect(screen.queryByText("Destination URL cannot be empty.")).toBeNull();

      await act(async () => {
        fireEvent.click(addBangBtn);
      });

      // Switch to Bookmarks tab
      fireEvent.click(screen.getByText("Bookmarks"));
      expect(screen.getByText("Add New Bookmark")).toBeInTheDocument();

      // Typing when no errors exist (false branch of if (formErrors...))
      const titleInput = screen.getByPlaceholderText(
        "e.g. !f Facebook, GitHub Dashboard",
      );
      fireEvent.change(titleInput, { target: { value: "Initial Title" } });
      const bmUrlInput = screen.getByPlaceholderText("https://facebook.com");
      fireEvent.change(bmUrlInput, {
        target: { value: "https://initial.com" },
      });

      // Clear inputs to trigger validation error
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.change(bmUrlInput, { target: { value: "" } });

      // Trigger bookmark validation error by submitting empty
      const addBmBtn = screen.getByRole("button", { name: /Add Bookmark/i });
      await act(async () => {
        fireEvent.click(addBmBtn);
      });
      expect(screen.getByText("Title cannot be empty.")).toBeInTheDocument();
      expect(screen.getByText("URL cannot be empty.")).toBeInTheDocument();

      // Typing should clear errors (true branch of if (formErrors...))
      fireEvent.change(titleInput, { target: { value: "My Book" } });
      expect(screen.queryByText("Title cannot be empty.")).toBeNull();

      fireEvent.change(bmUrlInput, { target: { value: "https://mybook.com" } });
      expect(screen.queryByText("URL cannot be empty.")).toBeNull();

      await act(async () => {
        fireEvent.click(addBmBtn);
      });
    }, 15000);

    it("handles switching tabs, sources, and backup import in PopupApp", async () => {
      render(<PopupApp />);

      // Switch to Sources tab
      fireEvent.click(screen.getByText("Sources"));
      expect(screen.getByText("Spotlight Sources")).toBeInTheDocument();

      const bookmarksToggle = screen.getByLabelText(/Include Bookmarks/i);
      await act(async () => {
        fireEvent.click(bookmarksToggle);
      });
      expect(screen.getByText("Preferences saved")).toBeInTheDocument();

      // Switch to Settings tab
      fireEvent.click(screen.getByText("Settings"));
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Backup & Restore")).toBeInTheDocument();

      // Export backup
      const exportBtn = screen.getByRole("button", { name: /Export Backup/i });
      await act(async () => {
        fireEvent.click(exportBtn);
      });

      // Import backup file to trigger onDataImported
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const validJson = JSON.stringify({
        customBangs: { "!imported": "https://imported.com?q=%s" },
      });
      const validFile = new File([validJson], "backup.json", {
        type: "application/json",
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [validFile] } });
      });

      expect(screen.getByText(/Restored successfully/i)).toBeInTheDocument();
    }, 15000);

    it("clears status message after timeout in PopupApp", async () => {
      vi.useFakeTimers();
      render(<PopupApp />);

      fireEvent.click(screen.getByText("Sources"));
      const bookmarksToggle = screen.getByLabelText(/Include Bookmarks/i);

      await act(async () => {
        fireEvent.click(bookmarksToggle);
      });

      expect(screen.getByText("Preferences saved")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText("Preferences saved")).toBeNull();
      vi.useRealTimers();
    });

    it("renders error status message banner with alert icon", async () => {
      render(<PopupApp />);

      fireEvent.click(screen.getByText("Settings"));
      const originalCreateObjectURL = window.URL.createObjectURL;
      window.URL.createObjectURL = vi.fn(() => {
        throw new Error("Blob error");
      });

      try {
        const exportBtn = screen.getByRole("button", {
          name: /Export Backup/i,
        });
        await act(async () => {
          fireEvent.click(exportBtn);
        });

        expect(screen.getByText("Failed to export backup")).toBeInTheDocument();
        expect(document.querySelector(".status_error")).toBeInTheDocument();
      } finally {
        window.URL.createObjectURL = originalCreateObjectURL;
      }
    });
  });
});
