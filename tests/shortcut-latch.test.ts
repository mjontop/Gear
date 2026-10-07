import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createShortcutLatch } from "@/lib/shortcut-latch";

describe("createShortcutLatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("executes action on initial trigger and returns true", () => {
    const latch = createShortcutLatch();
    const action = vi.fn();

    const result = latch.handleTrigger(action);
    expect(result).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("suppresses repeated triggers while key is held and returns false", () => {
    const latch = createShortcutLatch();
    const action = vi.fn();

    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);

    // Repeated triggers within hold period
    expect(latch.handleTrigger(action)).toBe(false);
    expect(latch.handleTrigger(action)).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("allows re-triggering once key is released via handleRelease", () => {
    const latch = createShortcutLatch();
    const action = vi.fn();

    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);

    latch.handleRelease();

    // Next press should execute
    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("falls back to resetting after timeout if handleRelease is not called", () => {
    const latch = createShortcutLatch(300);
    const action = vi.fn();

    expect(latch.handleTrigger(action)).toBe(true);

    vi.advanceTimersByTime(299);
    expect(latch.handleTrigger(action)).toBe(false);

    vi.advanceTimersByTime(301);
    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("holding key refreshes the fallback timeout so it never prematurely unlocks", () => {
    const latch = createShortcutLatch(300);
    const action = vi.fn();

    expect(latch.handleTrigger(action)).toBe(true);

    // Repeated events every 100ms
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(100);
      expect(latch.handleTrigger(action)).toBe(false);
    }
    expect(action).toHaveBeenCalledTimes(1);

    // Now user releases key
    latch.handleRelease();
    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("clears timer and state when reset is called", () => {
    const latch = createShortcutLatch(500);
    const action = vi.fn();

    latch.handleTrigger(action);
    latch.reset();

    expect(latch.handleTrigger(action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("catches rejected promises in action gracefully", async () => {
    const latch = createShortcutLatch();
    const errorAction = vi.fn().mockRejectedValue(new Error("async fail"));

    expect(() => latch.handleTrigger(errorAction)).not.toThrow();
  });
});
