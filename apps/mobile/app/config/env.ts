function required(key: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

export const env = {
  get SUPABASE_URL() {
    return required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL)
  },
  get SUPABASE_ANON_KEY() {
    return required("EXPO_PUBLIC_SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  },
}
