import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@app-stack/shared-types"
import { env } from "@/lib/env"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from Server Component — cookies cannot be set here.
        }
      },
    },
  })
}
