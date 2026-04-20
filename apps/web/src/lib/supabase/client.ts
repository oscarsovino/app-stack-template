import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@app-stack/shared-types"
import { env } from "@/lib/env"

export function createClient() {
  return createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}
