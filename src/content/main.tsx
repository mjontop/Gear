import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./views/App.tsx";
import appStyles from "./views/App.css?raw";
import spotlightStyles from "@/components/spotlight/spotlight.module.css?raw";
import activeTabsStyles from "@/components/spotlight/components/active-tabs.module.css?raw";
import suggestionItemStyles from "@/components/spotlight/components/suggestion-item.module.css?raw";

const host = document.createElement("div");
host.id = "crxjs-app";
document.body.appendChild(host);

const shadowRoot = host.attachShadow({ mode: "open" });
const style = document.createElement("style");
style.textContent = [
  appStyles,
  spotlightStyles,
  activeTabsStyles,
  suggestionItemStyles,
].join("\n");
shadowRoot.appendChild(style);

const container = document.createElement("div");
shadowRoot.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
