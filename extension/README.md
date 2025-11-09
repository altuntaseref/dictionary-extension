# WordSnap Chrome Extension

A minimal Chrome (MV3) extension that:
- Lets users sign in with Supabase (email/password)
- Shows the 10 most recent words
- On any website, select text → a small "Translate" button appears → click to translate and save via your Cloudflare Workers backend

## Folder
- `manifest.json` – MV3 manifest
- `src/popup.html`, `src/popup.js`, `src/styles.css` – popup UI
- `src/background.js` – keeps Supabase session token and calls backend
- `src/contentScript.js` – injects selection tooltip and sends translate requests

## Configure
Open these files and replace placeholders:
- `src/popup.js`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `API_BASE` (e.g., `https://dictionary-backend.<your>.workers.dev`)
- `src/contentScript.js`
  - `API_BASE` same as above

## Load in Chrome
1. Build not required (vanilla JS). Open Chrome → `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `extension/` folder.
4. Pin "WordSnap" to the toolbar.

## Notes
- The popup shares the Supabase session with the background via `chrome.storage`. Content script asks the background to perform authenticated API calls.
- Styling mirrors the web app’s palette (Reseda Green, Drab Dark Brown, Umber).
- You can refine the tooltip text, target language, etc., by editing `contentScript.js` and backend.


