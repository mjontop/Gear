import { defineManifest } from "@crxjs/vite-plugin";
import {
  CONTENT_SCRIPT_MATCHES,
  SEARCH_SUGGESTIONS_HOST_PERMISSION,
} from "./src/constants.ts";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_popup: "src/popup/index.html",
  },
  commands: {
    "toggle-spotlight": {
      suggested_key: {
        default: "Alt+M",
      },
      description: "Toggle Spotlight",
    },
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  permissions: ["contentSettings", "tabs"],
  host_permissions: [SEARCH_SUGGESTIONS_HOST_PERMISSION],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: CONTENT_SCRIPT_MATCHES,
    },
  ],
});
