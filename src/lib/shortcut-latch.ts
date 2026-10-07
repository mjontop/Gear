export type ShortcutLatch = {
  handleTrigger: (action: () => void | Promise<void>) => boolean;
  handleRelease: () => void;
  reset: () => void;
};

export function createShortcutLatch(timeoutMs: number = 400): ShortcutLatch {
  let isPressed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    isPressed = false;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handleRelease = () => {
    reset();
  };

  const handleTrigger = (action: () => void | Promise<void>): boolean => {
    if (isPressed) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(reset, timeoutMs);
      return false;
    }

    isPressed = true;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(reset, timeoutMs);

    try {
      const result = action();
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch (err) {
      console.error("Error executing shortcut action:", err);
    }

    return true;
  };

  return { handleTrigger, handleRelease, reset };
}
