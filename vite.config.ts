import { defineConfig, loadEnv } from 'vite'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import type { VitePWAOptions } from 'vite-plugin-pwa'
import { VitePWA } from 'vite-plugin-pwa'

const isPwaDisabled = process.env?.PWA_DISABLE === 'true'

const pwaOptions = (
  appName: string,
  appDescription: string
): Partial<VitePWAOptions> => {
  return {
    disable: isPwaDisabled,
    // autoUpdate: existing installed users on the old SW get the new one installed
    // and applied silently on the next reload. selfDestroying stays off so the SW
    // keeps serving the precache between updates.
    registerType: 'autoUpdate',
    base: '/',
    includeAssets: [
      'img/apple-touch-icon.png',
      'img/favicon-16x16.png',
      'img/favicon-32x32.png',
      'img/favicon.ico',
    ],
    manifest: {
      id: '/?utm_source=pwa',
      start_url: '/?utm_source=pwa',
      name: appName,
      short_name: appName,
      description: appDescription,
      background_color: '#0f1118',
      theme_color: '#0f1118',
      icons: [
        {
          src: '/img/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/img/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      screenshots: [
        {
          src: 'img/screenshot-wide.png',
          sizes: '3200x1600',
          form_factor: 'wide',
        },
        {
          src: 'img/screenshot.png',
          sizes: '1200x1200',
        },
      ],
      // Companion Chrome extensions. `chrome_web_store` is a W3C-registered
      // platform; browsers expose this list via navigator.getInstalledRelatedApps().
      // prefer_related_applications stays false so the PWA itself remains installable.
      related_applications: [
        {
          platform: 'chrome_web_store',
          id: 'nggjihigdfdcdapndddbcokfcdcgdaok',
          url: 'https://chromewebstore.google.com/detail/moonbar-moon-phase-in-you/nggjihigdfdcdapndddbcokfcdcgdaok',
        },
        {
          platform: 'chrome_web_store',
          id: 'hhfkcegnckjfijmciglgpgmmnbmikkmd',
          url: 'https://chromewebstore.google.com/detail/moontab-moon-phase-on-eve/hhfkcegnckjfijmciglgpgmmnbmikkmd',
        },
      ],
      prefer_related_applications: false,
    },
    useCredentials: true,
    selfDestroying: false,
    devOptions: {
      enabled: !isPwaDisabled,
      type: 'module',
      navigateFallback: 'index.html',
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      VitePWA(pwaOptions(env.VITE_APP_NAME, env.VITE_APP_SLOGAN)),
      // Config details are here: https://www.npmjs.com/package/html-minifier-terser.
      ViteMinifyPlugin({}),
    ],
  }
})
