import { useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

export type UseSpotlightScrollLockParams = {
  isOpen: boolean;
  overlayRef: RefObject<HTMLDialogElement | null>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const useSpotlightScrollLock = ({
  isOpen,
  overlayRef,
  setIsOpen,
}: UseSpotlightScrollLockParams) => {
  useEffect(() => {
    if (!isOpen) return;

    const blockedEvents = [
      "click",
      "contextmenu",
      "dblclick",
      "mousedown",
      "mouseup",
      "mousemove",
      "pointerdown",
      "pointerup",
      "pointermove",
      "pointercancel",
      "touchstart",
      "touchend",
      "touchmove",
      "wheel",
      "drag",
      "dragstart",
      "dragover",
      "drop",
    ];

    const isInsideSpotlightContainer = (event: Event) => {
      const path = event.composedPath();
      return path.some(
        (target) =>
          target instanceof HTMLElement &&
          target.classList.contains("spotlight_container"),
      );
    };

    const isSpotlightEvent = (event: Event) => {
      const overlay = overlayRef.current;
      return overlay ? event.composedPath().includes(overlay) : false;
    };

    const stopBackgroundInput = (event: Event) => {
      if (isSpotlightEvent(event)) {
        if (
          (event.type === "wheel" || event.type === "touchmove") &&
          !isInsideSpotlightContainer(event)
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const stopBackgroundKeyboardInput = (event: globalThis.KeyboardEvent) => {
      if (isSpotlightEvent(event)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const listenerOptions = { capture: true, passive: false };

    blockedEvents.forEach((eventName) => {
      document.addEventListener(
        eventName,
        stopBackgroundInput,
        listenerOptions,
      );
      window.addEventListener(eventName, stopBackgroundInput, listenerOptions);
    });
    document.addEventListener(
      "keydown",
      stopBackgroundKeyboardInput,
      listenerOptions,
    );
    window.addEventListener(
      "keydown",
      stopBackgroundKeyboardInput,
      listenerOptions,
    );

    return () => {
      blockedEvents.forEach((eventName) => {
        document.removeEventListener(
          eventName,
          stopBackgroundInput,
          listenerOptions,
        );
        window.removeEventListener(
          eventName,
          stopBackgroundInput,
          listenerOptions,
        );
      });
      document.removeEventListener(
        "keydown",
        stopBackgroundKeyboardInput,
        listenerOptions,
      );
      window.removeEventListener(
        "keydown",
        stopBackgroundKeyboardInput,
        listenerOptions,
      );
    };
  }, [isOpen, overlayRef, setIsOpen]);
};
