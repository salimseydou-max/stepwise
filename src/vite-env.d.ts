/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_BASE_URL?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_APP_NAME?: string
  readonly VITE_OPENROUTER_APP_URL?: string
  readonly VITE_OPENAI_BASE_URL?: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_OPENAI_MODEL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
