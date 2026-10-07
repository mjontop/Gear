import { useEffect, useRef, useState } from "react";
import { MESSAGE_TYPES } from "@/constants";
import { useSpotlightPreferences } from "@/lib/preferences";
import { SidebarMainView } from "./components/SidebarMainView";
import { SidebarArchiveView } from "./components/SidebarArchiveView";
import { SidebarDownloadsView } from "./components/SidebarDownloadsView";

export type SidebarProps = {
  defaultOpen?: boolean;
  enableBackgroundBlur?: boolean;
};

export const Sidebar = ({
  defaultOpen = false,
  enableBackgroundBlur,
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeView, setActiveView] = useState<
    "main" | "archive" | "downloads"
  >("main");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { preferences } = useSpotlightPreferences();

  const shouldBlur = enableBackgroundBlur ?? preferences.enableBackgroundBlur;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (typeof dialog.showModal === "function" && !dialog.open) {
        dialog.showModal();
      }
    } else {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      }
      setActiveView("main");
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.type === MESSAGE_TYPES.TOGGLE_SIDEBAR) {
        setIsOpen((prev) => !prev);
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Alt+S
      if (
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="sidebar_drawer_overlay"
      aria-label="Sidebar navigation"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className={`sidebar_backdrop ${!shouldBlur ? "sidebar_backdrop_no_blur" : ""}`}
        onClick={handleClose}
        aria-label="Close sidebar backdrop"
      />

      {/* Docked Drawer Left: 0, Top: 0, Bottom: 0 */}
      <aside className="sidebar_drawer_panel">
        {activeView === "main" && (
          <SidebarMainView
            onOpenArchive={() => setActiveView("archive")}
            onOpenDownloads={() => setActiveView("downloads")}
            onClose={handleClose}
          />
        )}

        {activeView === "archive" && (
          <SidebarArchiveView
            onBack={() => setActiveView("main")}
            onClose={handleClose}
          />
        )}

        {activeView === "downloads" && (
          <SidebarDownloadsView
            onBack={() => setActiveView("main")}
            onClose={handleClose}
          />
        )}
      </aside>
    </dialog>
  );
};
