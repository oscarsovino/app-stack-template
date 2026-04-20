# app-stack-template

Unified web + mobile stack template. Validated against industry standards 2026.

Follows the **L1+ shared-logic pattern**: share domain logic, schemas, tokens, i18n, and Supabase services. Each platform (web / mobile) uses its idiomatic UI stack, aligned to common design tokens. See [SPEC.md](./SPEC.md) for rationale.

## Stack

### Shared (`packages/*`)

| Package | Purpose |
|---|---|
| `@app-stack/shared-types` | Supabase-generated types |
| `@app-stack/shared-schemas` | Zod validation schemas |
| `@app-stack/shared-constants` | Enums, regex, limits |
| `@app-stack/shared-i18n` | i18next translation strings |
| `@app-stack/shared-tokens` | Design tokens + CSS variable generator |
| `@app-stack/shared-supabase` | Platform-agnostic Supabase service layer |
| `@app-stack/shared-config` | tsconfig bases, eslint presets |

### Web (`apps/web`)

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn pattern · TanStack Query v5 · Zustand v5 · React Hook Form · Supabase SSR · Vitest · Playwright

### Mobile (`apps/mobile`)

Expo SDK 54 · React Native 0.81 · Ignite folder convention · React Navigation v7 · TanStack Query v5 · **Zustand v5** (no MST) · React Hook Form · @supabase/supabase-js + MMKV session adapter · Jest · Maestro

## Quick start

### Bootstrap a new monorepo

```bash
# Scaffold packages/ + apps/web + apps/mobile into the current directory
bash <(curl -s https://raw.githubusercontent.com/oscarsovino/app-stack-template/main/init-app-stack.sh) . --preset=both --install
```

### Into an existing directory

```bash
git clone https://github.com/oscarsovino/app-stack-template.git
cd my-project
bash ../app-stack-template/init-app-stack.sh . --preset=both
pnpm install
```

### Flags

- `--preset=web|mobile|both` — which apps to scaffold (default: `none`, only packages)
- `--install` — run `pnpm install` after copy
- `--force` — overwrite existing files
- `-h, --help` — help

## Status

**Phase 2 (current):** packages/shared-* + apps/web + apps/mobile + init script. Working monorepo skeleton.

**Phase 3 (next):** pilot on PollyFlip, then migrate BRN and miAcademia into monorepo.

## License

MIT
