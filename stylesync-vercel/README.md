# stylesync-vercel — Next.js backend + static frontend host

This is the deployed StyleSync app. It bundles:

- **Frontend** (static) — the cozy React prototype from `../StyleSync-Frontend/`, served from `public/`.
- **API routes** (Next.js) — under `app/api/*`:
  - `POST /api/predict` — runs your ResNet via the Hugging Face Space
  - `POST /api/upload` — uploads images to Vercel Blob storage, returns a CDN URL
  - `GET/POST /api/wardrobe` + `DELETE/PATCH /api/wardrobe/[id]` — wardrobe CRUD
  - `GET/POST /api/outfits` + `DELETE /api/outfits/[id]` — saved looks CRUD
- **Storage** — Vercel KV (wardrobe + saved looks metadata) + Vercel Blob (image files).
- **ML** — Hugging Face Space hosting the ResNet-50 classifier.

```
┌────────────────────────────────────────────────────────────┐
│  Browser                                                   │
│  ─ Static cozy frontend (public/index.html + screens)      │
│  ─ Calls window.SS_API.*                                   │
└────────────────────────────────────────────────────────────┘
       │ fetch
       ▼
┌────────────────────────────────────────────────────────────┐
│  Next.js on Vercel                                         │
│  ─ /api/predict ─────────────▶ HF Space (ResNet-50)        │
│  ─ /api/upload  ─────────────▶ Vercel Blob                 │
│  ─ /api/wardrobe ────────────▶ Vercel KV                   │
│  ─ /api/outfits  ────────────▶ Vercel KV                   │
└────────────────────────────────────────────────────────────┘
```

## One-time setup

### 1. Drop the frontend files in
Copy everything from `../StyleSync-Frontend/` into `public/`. Then also copy
`public-additions/api-client.js` into `public/` alongside them. You should end up with:

```
public/
  index.html
  prod.jsx
  screens-home.jsx
  screens-build.jsx
  ... (all the prototype files)
  api-client.js          ← from public-additions/
```

Update `public/index.html` to include `api-client.js` BEFORE `prod.jsx`:

```html
<script src="api-client.js"></script>
<script type="text/babel" src="prod.jsx"></script>
```

### 2. Local dev
```bash
npm install
cp .env.example .env.local
# edit .env.local — only HF_SPACE_ID needs a value for local dev
npm run dev
```
Open http://localhost:3000. KV + Blob calls will fail locally unless you link to the Vercel project (see below).

### 3. Deploy to Vercel

a. Push this folder to the GitHub repo.

b. On vercel.com → **Add New → Project → Import** the repo. When asked for the
   **Root Directory**, pick `stylesync-vercel/`. Framework auto-detects as Next.js.

c. After the first deploy, in the project's **Storage** tab:
   - Create a **KV** database, attach to this project (env vars auto-populate).
   - Create a **Blob** store, attach to this project.

d. In **Settings → Environment Variables**, add:
   ```
   HF_SPACE_ID = aaron8wong/stylesync-app
   ```

e. **Redeploy** so the new env vars take effect.

### 4. Test the live app
- Visit `https://your-project.vercel.app/`
- Go to **Add** → upload a real clothing photo
- Confirm the model returns reasonable category + color
- Save it → check that it shows up in **Closet** after a refresh (proves KV is wired up)

## Gotchas

- **HF Space cold-start.** Free tier sleeps after ~30 min idle. First request after that takes ~30s. Either upgrade ($9/mo "always on") or accept the warmup.
- **Vercel Blob is paid past the free tier.** 1 GB storage + 100 GB bandwidth free, then ~$0.02/GB. Fine for an MVP.
- **KV free tier** is 30k commands/month. Plenty for personal use; not for a multi-tenant app.
- **No user accounts yet.** The wardrobe is shared across everyone visiting your URL. Adding auth is the next big lift — Supabase or Clerk are the obvious choices.
