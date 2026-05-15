# StyleSync

A hi-fi prototype of a wardrobe + outfit-building app, built as a static React-in-the-browser site.

## Local preview

Open `StyleSync.html` directly in a browser, or serve the folder with any static server, e.g.:

```bash
npx serve .
```

## Deploy to Vercel

### Option 1 — Drag & drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag this folder onto the page
3. Done — you'll get a `*.vercel.app` URL

### Option 2 — Git connected (recommended for ongoing work)
1. Push this folder to a GitHub/GitLab/Bitbucket repo
2. On Vercel: **Add New → Project → Import Git Repository**
3. Framework Preset: **Other**
4. Build command: *(leave empty)*
5. Output directory: *(leave empty)*
6. Deploy

`vercel.json` rewrites `/` to `/StyleSync.html`, so the site loads at the root URL.

## Project structure

- `StyleSync.html` — entry point, loads React + Babel + all screens
- `app.jsx` — reducer + top-level navigation + canvas layout
- `data.js` — seed wardrobe, swatches, genre tags
- `screens-*.jsx` — Home, Add, Closet, Build, Looks, Remix screens
- `garment.jsx` — clothing tile placeholder
- `design-canvas.jsx`, `browser-window.jsx`, `ios-frame.jsx` — design-canvas chrome
- `tweaks-panel.jsx` — in-design tweak controls (does not persist when hosted on Vercel)

## Notes

- This is a **static prototype**. Image upload, AI tagging, and user accounts are mocked.
- The Tweaks panel works in-session but cannot write changes back to the file once deployed.
