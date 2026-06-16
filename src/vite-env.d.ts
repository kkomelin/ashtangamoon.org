/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference lib="webworker" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_SLOGAN: string
  readonly VITE_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
