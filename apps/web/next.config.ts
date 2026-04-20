import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@app-stack/shared-constants",
    "@app-stack/shared-i18n",
    "@app-stack/shared-schemas",
    "@app-stack/shared-supabase",
    "@app-stack/shared-tokens",
    "@app-stack/shared-types",
  ],
}

export default nextConfig
