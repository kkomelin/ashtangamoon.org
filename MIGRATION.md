# Migration Plan: AshtangaMoon Solid → MoonTab static page

Replace the current Solid.js + Firebase PWA with the simple, dependency-free MoonTab page from `/srv/apps/my/chrome/moontab/`, while preserving the existing PWA so installed users keep receiving auto-updates through the service worker.

## Goals

- New main page = MoonTab page (vector moon + next new/full moon, computed locally).
- Drop Solid.js, Firebase SDKs, Firebase tooling (functions, emulators, messaging SW), Tailwind, d3, lune, date-fns, clsx, etc.
- Keep Vite + `vite-plugin-pwa` so the installed PWA on existing users' devices auto-updates via Workbox.
- Keep Firebase Hosting as the static deploy target, driven by the existing GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`). No Firebase JS SDKs in the bundle.
- Keep favicons and PWA manifest icons that are already in `public/img/`.

## Inventory

### Source: `/srv/apps/my/chrome/moontab/`

- `newtab.html` - single page, inline CSS, info popup, moon SVG container, "Next event" card.
- `newtab.js` - renders the page via `currentPhase()`, `nextEvents()`, `moonPath()` from `moon.js`.
- `moon.js` - pure functions: Meeus ch. 49 lunar phase math + SVG path geometry. No DOM, no `chrome.*`.
- `icons/` - extension icons (16/32/48/128). Not needed; we already have favicons.

### Target: `/srv/apps/my/ashtangamoon-solid/`

Existing layout to be reduced to a static Vite + PWA project.

## What stays

- `vite.config.ts` (simplified - drop `vite-plugin-solid`, keep `vite-plugin-pwa` + `vite-plugin-minify`).
- `vite-plugin-pwa` PWA manifest block (already has the right `theme_color`, icons, screenshots).
- `public/img/*` (favicons, manifest icons, screenshots, `browserconfig.xml`, `safari-pinned-tab.svg`).
- `.env` with `VITE_APP_NAME`, `VITE_APP_SLOGAN`, `VITE_APP_URL`.
- `.prettierrc`, `.prettierignore`, `.gitignore`, `README.md` (content to be refreshed).
- `firebase.json` hosting block (static-only) and `.firebaserc` - deploy target stays as Firebase Hosting.
- `.github/workflows/firebase-deploy.yml` - kept; simplified (drop functions install + functions build steps; keep `FirebaseExtended/action-hosting-deploy` step using the existing `FIREBASE_SERVICE_ACCOUNT` secret).
- TypeScript at the root, but downgraded to a minimal config (no JSX, no Solid).

## What gets removed

### Source

- `src/` (all of it: `components/`, `domains/`, `core/`, `hooks/`, `config/`, `types/`, `styles/`, `index.tsx`, `global.d.ts`).
- `public/firebase-messaging-sw.js`.

### Config / tooling

- `functions/` directory and the `pnpm-workspace.yaml` (workspace exists only for functions).
- `firestore.rules`, `firestore.indexes.json`.
- Firebase emulators block from `firebase.json` (keep just `hosting`).
- `postcss.config.js` (Tailwind only).

### Dependencies (`package.json`)

Remove:
- `@ark-ui/solid`, `solid-js`, `solid-toast`, `vite-plugin-solid`
- `firebase`, `typesaurus`
- `d3`, `@types/d3`, `lune`, `date-fns`, `clsx`
- `tailwindcss`, `@tailwindcss/postcss`, `prettier-plugin-tailwindcss`, `cssnano`, `postcss`

Keep:
- `vite`, `vite-plugin-pwa`, `vite-plugin-minify`
- `workbox-core`, `workbox-precaching`, `workbox-window` (used by `vite-plugin-pwa` runtime registration)
- `typescript`, `prettier`

### Scripts (`package.json`)

Remove `emulators`, `functions:build`, `functions:build:watch`, `typecheck` chain to functions. Keep `dev`, `build`, `preview`, `format`, `deploy`. `dev` drops the `VITE_EMULATE=true` flag, keeps `PWA_DISABLE=true` so the SW does not interfere with local dev.

## What gets added / changed

### 1. `index.html` (root)

Replace the current `index.html` with the MoonTab markup, adapted:

- Reuse the inline CSS from `newtab.html` verbatim (already small + scoped).
- Title: `%VITE_APP_NAME%` (env replacement, like today).
- Add the favicon/PWA `<link>` tags from the current `index.html` (touch icon, favicons, theme-color, og:* meta) so the PWA manifest and SEO/OG cards still work.
- Replace `<script src="newtab.js" type="module">` with `<script type="module" src="/src/main.ts">`.
- Drop the `#root` div, `header` shell, fonts preconnect, and the Tailwind class names.
- Update `og:image` to `%VITE_APP_URL%/img/screenshot-wide.png` (kept).

### 2. `src/main.ts`

The renderer from `newtab.js`, but TS and with PWA registration appended. Pseudocode:

```ts
import { currentPhase, nextEvents, moonPath, MOON_RING } from './moon'
import { registerSW } from 'virtual:pwa-register'

// ... moonSvg(), dateFmt, relative(), render() - unchanged from newtab.js
render()

// autoUpdate: existing PWA users on old SW get the new SW installed and activated
// silently; on next reload the page is served from the new precache. No UI prompt
// needed for a 1-page static site - reload happens naturally on the next new tab /
// page revisit.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true) // auto-apply
  },
})
```

### 3. `src/moon.ts`

Port `moon.js` to TypeScript - just add types to the exports (`julianDay(date: Date): number`, etc.). Keep all comments. No logic changes.

### 4. `vite.config.ts`

- Drop `solid()` plugin.
- In `pwaOptions`:
  - `registerType: 'autoUpdate'`.
  - Keep `selfDestroying: false`.
  - Keep manifest (id/start_url/name/short_name/description/colors/icons/screenshots).
  - Set `background_color` and `theme_color` to `#0f1118` to match the new dark UI. Users' OSs re-pull the manifest on update.
- Drop `devOptions.enabled` toggling - the `PWA_DISABLE=true` env in `dev` still bypasses it.

### 5. `tsconfig.json`

- Remove `"jsx": "preserve"` and `"jsxImportSource": "solid-js"`.
- Keep `strict`, drop `noUnusedLocals`/`noUnusedParameters`/etc. if they get noisy with the tiny code surface (optional).
- `include`: `["src"]` stays.

### 6. `vite-env.d.ts`

- Remove `vite-plugin-pwa/solid` triple-slash reference.
- Keep `vite/client`, `vite-plugin-pwa/info`, `webworker` lib reference.
- Drop the `declare module 'lune'`.

### 7. `firebase.json`

- Strip `functions`, `firestore`, `emulators` blocks.
- Keep `hosting` block as-is (predeploy `pnpm run build`, public `dist`, SPA rewrite).
- The SPA rewrite still works - everything routes to `/index.html`, which is the only page.

### 8. `.github/workflows/firebase-deploy.yml`

- Remove the "Install functions dependencies" step.
- Remove the "Build functions" step.
- Otherwise unchanged.

### 9. `README.md`

Refresh: short description of the static page, mention "no network, no location, computed locally", credit moon math source (Meeus ch. 49).

## PWA update path for existing users (critical)

Existing installed users have a service worker registered by `vite-plugin-pwa` against the current Solid build. We need their browsers to pick up the new SW and replace the precache.

- We keep the **same `manifest.id` and `start_url`** (`/?utm_source=pwa`) so the install identity is preserved.
- We keep `vite-plugin-pwa` so the new build emits a `sw.js` at the same URL, with a new precache manifest.
- We set `registerType: 'autoUpdate'`. The Workbox runtime will detect the new SW, install it, and skip-waiting/clients-claim on the next page load.
- We do **not** set `selfDestroying: true` - that would unregister the SW entirely.
- First post-deploy load on an existing client: old SW serves cached page → new SW installs in background → on the next navigation the new SW takes over and serves the MoonTab page.

Verification before merging:

1. Build, serve `dist/` locally, install as PWA.
2. Rebuild with a visible change, redeploy locally, hard-reload the installed app twice - first reload should activate the new SW, second should show the new content.
3. Confirm `dist/sw.js` and `dist/manifest.webmanifest` exist and the manifest icons resolve.

## Step-by-step execution

1. **Branch + safety net**: create `migration/moontab` branch from `main`.
2. **Add new code** alongside the old (keeps `pnpm dev` working until the swap):
   - Add `src/moon.ts`, `src/main.ts`.
3. **Swap entry**: replace `index.html` (root) and update its `<script>` to `/src/main.ts`.
4. **Delete old source**: `src/components/`, `src/domains/`, `src/core/`, `src/hooks/`, `src/config/`, `src/styles/`, `src/types/`, `src/index.tsx`, `src/global.d.ts`. Delete `public/firebase-messaging-sw.js`.
5. **Trim configs**: `vite.config.ts`, `tsconfig.json`, `vite-env.d.ts`, `firebase.json`, GitHub workflow, `postcss.config.js` (delete).
6. **Prune deps**: rewrite `package.json` deps/devDeps + scripts. Delete `pnpm-workspace.yaml` and `functions/`.
7. **Reinstall**: `pnpm install` to refresh the lockfile.
8. **Local check**:
   - `pnpm dev` - page renders, moon SVG visible, "Next event" populated.
   - `pnpm build` - dist contains `index.html`, `sw.js`, `manifest.webmanifest`, hashed JS/CSS, `img/*` assets.
   - `pnpm preview` - load, open DevTools → Application → Service Workers, confirm new SW registers, manifest icons resolve.
9. **PWA upgrade smoke test** (see verification above).
10. **Open PR** with screenshots before/after and SW activation notes.

## Open questions

- Drop `vite-plugin-minify` since HTML is already small? Recommendation: keep, it costs ~nothing.

Resolved:
- Hosting: **stays on Firebase Hosting via the existing GitHub Actions workflow.** `firebase.json` keeps only the `hosting` block, `.firebaserc` keeps `default: ashtangamoon`, and the workflow keeps the `FIREBASE_SERVICE_ACCOUNT` secret + `channelId: live` deploy step.
- PWA manifest colors: **switch `background_color` and `theme_color` to `#0f1118`** (matches new dark UI). Also update `<meta name="theme-color">` and `<meta name="msapplication-TileColor">` in `index.html` to `#0f1118`.
