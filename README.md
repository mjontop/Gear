# Gear ⚙️

**Gear** is a fast, keyboard-first Spotlight search and command palette for Google Chrome (Manifest V3). Built with React 19, TypeScript, and Vite via CRXJS, Gear brings an OS-level launcher experience (like macOS Spotlight or Raycast) into any webpage.

---

## ✨ Features

- **⚡ Instant Spotlight Palette**: Summoned with a single hotkey (`Alt+M`) over any webpage.
- **📑 Tab Search & Switcher**: Search through all open tabs across windows and jump to them instantly.
- **⭐ Bookmarks Search**: Instantly find and open saved bookmarks.
- **🕒 Browsing History**: Search through previously visited pages, ranked by recency.
- **🔍 Google Search Suggestions**: Live, debounced query auto-suggestions powered by Google Complete.
- **💥 Search Bangs**: DuckDuckGo-style shortcuts (e.g., `!yt`, `!g`, `!wi`) with custom bang support.
- **🌐 Smart URL & Localhost Detection**: Intelligently identifies domains, localhost, and IP addresses for direct navigation without performing a web search.
- **🛡️ Shadow DOM Isolation**: Injected via an open Shadow DOM root to completely isolate styles from the host page without CSS conflicts.
- **🔒 Interaction Lock**: Locks page scrolling and prevents host page event leaks while the spotlight overlay is active.

---

## ⌨️ Keyboard Shortcuts

| Shortcut                      | Action                                             |
| :---------------------------- | :------------------------------------------------- |
| <kbd>Alt</kbd> + <kbd>M</kbd> | Toggle Spotlight overlay on/off                    |
| <kbd>↑</kbd> / <kbd>↓</kbd>   | Navigate search results and tabs                   |
| <kbd>Enter</kbd>              | Select tab / open search suggestion / navigate URL |
| <kbd>Esc</kbd>                | Close Spotlight overlay                            |

> **Tip**: You can customize the shortcut anytime by visiting `chrome://extensions/shortcuts` in your browser.

---

## 💥 Search Bangs

Type the bang prefix anywhere in your search query to search targeted destinations:

| Bang  | Destination            | Example                    |
| :---- | :--------------------- | :------------------------- |
| `!g`  | Google Search          | `!g modern web design`     |
| `!yt` | YouTube                | `!yt lofi hip hop`         |
| `!wi` | Wikipedia (via Google) | `!wi quantum computing`    |
| `!gi` | Google Images          | `!gi minimalist wallpaper` |
| `!bi` | Bing Search            | `!bi typescript tips`      |
| `!px` | Pexels Photos          | `!px nature photography`   |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Extension Framework**: [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) (Manifest V3)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Modular CSS injected directly into Shadow DOM with scalable `em` units

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (v8+ or v9+)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mjontop/gear.git
   cd gear
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start development mode with HMR:

   ```bash
   pnpm dev
   ```

4. Load the extension in Google Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the `dist` folder generated in the project root.

---

## 📦 Building for Production

To create an optimized production build:

```bash
pnpm build
```

This will:

- Type-check the codebase with `tsc -b`.
- Compile and bundle production assets into `dist/`.
- Package a ready-to-distribute `.zip` file into `release/` via `vite-plugin-zip-pack`.
