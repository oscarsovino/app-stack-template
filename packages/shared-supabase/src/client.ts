import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@app-stack/shared-types"

export type AppSupabaseClient = SupabaseClient<Database>

export interface CreateClientOptions {
  url: string
  anonKey: string
  /**
   * Platform-specific storage adapter.
   * - Web SSR: cookie-backed storage from @supabase/ssr
   * - Mobile: MMKV or SecureStore wrapped to match the AsyncStorage-like interface
   */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>
    setItem: (key: string, value: string) => void | Promise<void>
    removeItem: (key: string) => void | Promise<void>
  }
  autoRefreshToken?: boolean
  persistSession?: boolean
  detectSessionInUrl?: boolean
}

export function createClient(opts: CreateClientOptions): AppSupabaseClient {
  return createSupabase<Database>(opts.url, opts.anonKey, {
    auth: {
      storage: opts.storage,
      autoRefreshToken: opts.autoRefreshToken ?? true,
      persistSession: opts.persistSession ?? true,
      detectSessionInUrl: opts.detectSessionInUrl ?? false,
    },
  })
}
