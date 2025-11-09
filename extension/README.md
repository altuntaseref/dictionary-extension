# WordSnap Chrome Extension

A Chrome (MV3) extension built with React that:
- Lets users sign in with Supabase (email/password)
- Shows the 10 most recent words
- On any website, select text → a small star button appears → click to translate and save via your Cloudflare Workers backend

## Tech Stack
- **React 19** - Modern UI framework
- **Vite** - Fast build tool
- **Chrome Extension MV3** - Manifest V3 compliant

## Project Structure
- `manifest.json` – MV3 manifest
- `src/popup/` – React popup application
  - `main.jsx` – Entry point
  - `App.jsx` – Main app component
  - `components/` – React components (Login, WordsList)
  - `popup.css` – Styling (matching web app design)
- `src/background.js` – Service worker for API calls
- `src/contentScript.js` – Content script for text selection tooltip
- `dist/` – Built files (generated after build)

## Setup

1. Install dependencies:
```bash
cd extension
npm install
```

2. Build the extension:
```bash
npm run build
```

3. For development with watch mode:
```bash
npm run dev
```

## Load in Chrome

1. Build the extension: `npm run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. **Important**: Select the `extension/dist/` folder (not `extension/` folder)
6. Pin "WordSnap" to the toolbar for easy access

**Note**: After making changes, rebuild with `npm run build` and click the reload icon (🔄) on the extension card in `chrome://extensions`.

## Configuration

The following URLs are configured in the code:
- `src/popup/App.jsx` and components – `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE`
- `src/contentScript.js` – `API_BASE`

Update these if needed for your environment.

## Development

- **Build**: `npm run build` - Builds to `dist/` folder
- **Watch**: `npm run dev` - Watches for changes and rebuilds
- **Preview**: `npm run preview` - Preview the built extension

## Notes

- The popup shares the Supabase session with the background via `chrome.storage`
- Content script asks the background to perform authenticated API calls
- Styling mirrors the web app's palette (Reseda Green #777B5D, Drab Dark Brown #3E3B32, Umber #6B5B53)
- The extension uses Lexend font family for consistency with the web app


