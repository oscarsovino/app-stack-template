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

### Web (`apps/web`) — Phase 2

Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn pattern · TanStack Query v5 · Zustand v5 · React Hook Form · Supabase SSR · Vitest · Playwright

### Mobile (`apps/mobile`) — Phase 2

Expo SDK 54 · React Native 0.81 · Ignite · React Navigation v7 · TanStack Query v5 · **Zustand v5** (no MST) · React Hook Form · @supabase/supabase-js · Jest · Maestro

## Quick start

### In a new monorepo

```bash
bash <(curl -s https://raw.githubusercontent.com/oscarsovino/app-stack-template/main/init-app-stack.sh)
```

### From local clone

```bash
git clone https://github.com/oscarsovino/app-stack-template.git
cd my-project
bash ../app-stack-template/init-app-stack.sh
```

## Status

**Phase 1 (current):** monorepo scaffolding + `packages/shared-*` skeletons + SPEC + init script (CLAUDE.md block injection only).

**Phase 2 (next):** `apps/web` scaffold (Next.js 16 + shadcn preset) and `apps/mobile` scaffold (Expo 54 + Ignite), plus full init script that seeds both.

**Phase 3:** pilot on PollyFlip, then migrate BRN and miAcademia into monorepo.

## License

MIT
