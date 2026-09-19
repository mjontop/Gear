import { defineManifest } from "@crxjs/vite-plugin";
import {
  CONTENT_SCRIPT_MATCHES,
  SEARCH_SUGGESTIONS_HOST_PERMISSION,
} from "./src/constants.ts";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Gear - Spotlight & Command Palette",
  description:
    "Fast, keyboard-first Spotlight search and command palette. Search open tabs, bookmarks, history, and the web with custom bangs.",
  version: pkg.version,
  icons: {
    16: "public/icon-16.png",
    32: "public/icon-32.png",
    48: "public/icon-48.png",
    128: "public/icon-128.png",
  },
  action: {
    default_icon: {
      16: "public/icon-16.png",
      32: "public/icon-32.png",
      48: "public/icon-48.png",
      128: "public/icon-128.png",
    },
    default_popup: "src/popup/index.html",
  },
  commands: {
    "toggle-spotlight": {
      suggested_key: {
        default: "Alt+M",
      },
      description: "Toggle Spotlight search overlay",
    },
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  permissions: [
    "contentSettings",
    "tabs",
    "bookmarks",
    "history",
    "favicon",
    "storage",
  ],
  web_accessible_resources: [
    {
      resources: ["_favicon/*"],
      matches: ["<all_urls>"],
    },
  ],
  host_permissions: [SEARCH_SUGGESTIONS_HOST_PERMISSION],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: CONTENT_SCRIPT_MATCHES,
    },
  ],
});
