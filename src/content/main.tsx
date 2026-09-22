import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./views/App.tsx";
import contentStyles from "./content.css?raw";

const host = document.createElement("div");
host.id = "crxjs-app";
document.body.appendChild(host);

const shadowRoot = host.attachShadow({ mode: "open" });
const style = document.createElement("style");
style.textContent = contentStyles;
shadowRoot.appendChild(style);

const container = document.createElement("div");
shadowRoot.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
