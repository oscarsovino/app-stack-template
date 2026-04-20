function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

export const env = {
  get SUPABASE_URL() {
    return required("NEXT_PUBLIC_SUPABASE_URL")
  },
  get SUPABASE_ANON_KEY() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  },
}
