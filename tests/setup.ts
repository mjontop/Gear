import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";

let syncStorage: Record<string, any> = {};
let localStorage: Record<string, any> = {};
let storageListeners: Array<
  (changes: Record<string, any>, area: string) => void
> = [];

export const resetStorageMocks = () => {
  syncStorage = {};
  localStorage = {};
};

export const getStorageData = () => ({ syncStorage, localStorage });

export const createChromeMock = () => {
  return {
    runtime: {
      getURL: vi.fn(
        (path: string) =>
          `chrome-extension://gear-test-id${path.startsWith("/") ? path : `/${path}`}`,
      ),
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    storage: {
      sync: {
        get: vi.fn(
          async (keys?: string | string[] | Record<string, any> | null) => {
            if (!keys) return { ...syncStorage };
            if (typeof keys === "string") return { [keys]: syncStorage[keys] };
            if (Array.isArray(keys)) {
              const res: Record<string, any> = {};
              for (const k of keys) res[k] = syncStorage[k];
              return res;
            }
            return { ...syncStorage };
          },
        ),
        set: vi.fn(async (items: Record<string, any>) => {
          const changes: Record<string, any> = {};
          for (const [k, v] of Object.entries(items)) {
            changes[k] = { oldValue: syncStorage[k], newValue: v };
            syncStorage[k] = v;
          }
          for (const listener of storageListeners) {
            listener(changes, "sync");
          }
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const kArr = Array.isArray(keys) ? keys : [keys];
          for (const k of kArr) delete syncStorage[k];
        }),
        clear: vi.fn(async () => {
          syncStorage = {};
        }),
      },
      local: {
        get: vi.fn(
          async (keys?: string | string[] | Record<string, any> | null) => {
            if (!keys) return { ...localStorage };
            if (typeof keys === "string") return { [keys]: localStorage[keys] };
            if (Array.isArray(keys)) {
              const res: Record<string, any> = {};
              for (const k of keys) res[k] = localStorage[k];
              return res;
            }
            return { ...localStorage };
          },
        ),
        set: vi.fn(async (items: Record<string, any>) => {
          const changes: Record<string, any> = {};
          for (const [k, v] of Object.entries(items)) {
            changes[k] = { oldValue: localStorage[k], newValue: v };
            localStorage[k] = v;
          }
          for (const listener of storageListeners) {
            listener(changes, "local");
          }
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const kArr = Array.isArray(keys) ? keys : [keys];
          for (const k of kArr) delete localStorage[k];
        }),
        clear: vi.fn(async () => {
          localStorage = {};
        }),
      },
      onChanged: {
        addListener: vi.fn((listener: (changes: any, area: string) => void) => {
          storageListeners.push(listener);
        }),
        removeListener: vi.fn(
          (listener: (changes: any, area: string) => void) => {
            storageListeners = storageListeners.filter((l) => l !== listener);
          },
        ),
      },
    },
    tabs: {
      query: vi.fn(async () => []),
      sendMessage: vi.fn(async () => {}),
      create: vi.fn(async (props: any) => ({ id: 999, ...props })),
      update: vi.fn(async (tabId: number, props: any) => ({
        id: tabId,
        ...props,
      })),
    },
    windows: {
      update: vi.fn(async (winId: number, props: any) => ({
        id: winId,
        ...props,
      })),
    },
    bookmarks: {
      getRecent: vi.fn(async () => []),
      search: vi.fn(async () => []),
      create: vi.fn(async (data: any) => ({ id: "bm_1", ...data })),
      update: vi.fn(async (id: string, data: any) => ({ id, ...data })),
      remove: vi.fn(async () => {}),
    },
    history: {
      search: vi.fn(async () => []),
    },
    commands: {
      getAll: vi.fn(async (cb?: (commands: any[]) => void) => {
        const cmds = [
          { name: "toggle-spotlight", shortcut: "Alt+M" },
          { name: "copy-current-url", shortcut: "Alt+Shift+L" },
          { name: "open-spotlight-with-url", shortcut: "Alt+L" },
        ];
        if (cb) cb(cmds);
        return cmds;
      }),
      onCommand: {
        addListener: vi.fn(),
      },
    },
  };
};

(globalThis as any).chrome = createChromeMock();

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.Element.prototype.scrollIntoView = vi.fn();
}

beforeEach(() => {
  resetStorageMocks();
});
