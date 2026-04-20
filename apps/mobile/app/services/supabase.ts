import { MMKV } from "react-native-mmkv"
import { createClient } from "@app-stack/shared-supabase"
import { env } from "../config/env"

const sessionStore = new MMKV({ id: "supabase-session" })

const storage = {
  getItem: (key: string) => sessionStore.getString(key) ?? null,
  setItem: (key: string, value: string) => sessionStore.set(key, value),
  removeItem: (key: string) => sessionStore.delete(key),
}

export const supabase = createClient({
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  storage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
})
