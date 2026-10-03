import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpotlightScrollLock } from "@/components/spotlight/scroll-lock";

describe("useSpotlightScrollLock", () => {
  it("locks background input and closes on Escape", () => {
    const setIsOpen = vi.fn();
    const overlayRef = {
      current: document.createElement("dialog"),
    };

    const { unmount } = renderHook(() =>
      useSpotlightScrollLock({
        isOpen: true,
        overlayRef,
        setIsOpen,
      }),
    );

    // Background click
    const clickEvent = new MouseEvent("click", { bubbles: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");
    document.dispatchEvent(clickEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();

    // Escape keydown
    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    document.dispatchEvent(escEvent);
    expect(setIsOpen).toHaveBeenCalledWith(false);

    // Wheel event on overlay backdrop outside container
    const overlayEl = overlayRef.current;
    document.body.appendChild(overlayEl);

    const wheelEvent = new Event("wheel", {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultWheelSpy = vi.spyOn(wheelEvent, "preventDefault");
    const stopPropSpy = vi.spyOn(wheelEvent, "stopPropagation");
    overlayEl.dispatchEvent(wheelEvent);

    expect(preventDefaultWheelSpy).toHaveBeenCalled();
    expect(stopPropSpy).toHaveBeenCalled();

    document.body.removeChild(overlayEl);
    unmount();
  });
});
