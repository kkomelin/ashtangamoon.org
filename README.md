# Ashtanga Moon

A tiny PWA that shows the current moon phase and the next new and full moon. New and full moon days are used in Ashtanga Vinyasa Yoga for taking rest and fasting.

The phase is the same everywhere on Earth at a given moment, so the app needs **no location and no internet** - everything is computed on your device. Phase times use the standard astronomical algorithm (Meeus, _Astronomical Algorithms_, ch. 49).

[Check it out](https://ashtangamoon.org)

Also available as Chrome extensions: [MoonBar](https://chromewebstore.google.com/detail/moonbar-moon-phase-in-you/nggjihigdfdcdapndddbcokfcdcgdaok) & [MoonTab](https://chromewebstore.google.com/detail/moontab-moon-phase-on-eve/hhfkcegnckjfijmciglgpgmmnbmikkmd).

_This project supersedes its previous [Solid.js + Firebase version](https://github.com/kkomelin/ashtangamoon-solid/tree/v2.2.0) and the original [vanilla JS version](https://github.com/kkomelin/ashtangamoon-vanilla)._

## Stack

- [Vite](https://vitejs.dev/) + TypeScript
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox (installable, offline, auto-updating service worker)
- Static hosting on Firebase Hosting, deployed from GitHub Actions

No frontend framework, no runtime dependencies in the bundle.

## Install

```bash
pnpm i
```

## Develop

```bash
pnpm dev
```

Service worker is disabled in dev (`PWA_DISABLE=true`) so it doesn't interfere with HMR.

## Build

```bash
pnpm build
```

Outputs to `dist/`: `index.html`, hashed `assets/*.js`, `sw.js`, `manifest.webmanifest`, and the icons under `img/`.

## Preview the production build

```bash
pnpm preview
```

Open the URL it prints, then DevTools -> Application -> Service Workers to confirm `sw.js` is registered.

## Deploy

Pushes to `main` deploy automatically to Firebase Hosting via `.github/workflows/firebase-deploy.yml` (requires the `FIREBASE_SERVICE_ACCOUNT` repo secret).

Manual deploy:

```bash
pnpm deploy
```
