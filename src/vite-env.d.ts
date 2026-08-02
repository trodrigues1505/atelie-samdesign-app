/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_MELHOR_ENVIO_CLIENT_ID?: string;
  readonly VITE_MELHOR_ENVIO_REDIRECT_URI?: string;
  readonly VITE_MELHOR_ENVIO_SANDBOX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
