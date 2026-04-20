<!-- APP-STACK-START -->
## App Standard Stack (mandatory for web + mobile apps)

> This block is maintained by app-stack-template.
> Updated via `init-app-stack.sh` without touching content outside markers.
> Source: https://github.com/oscarsovino/app-stack-template

This project uses the **App Stack** — L1+ shared-logic pattern for web + mobile apps with a shared Supabase backend.

### Monorepo

- **Package manager:** pnpm 9 (workspaces)
- **Build orchestration:** Turborepo 2
- **TypeScript:** strict mode everywhere

### Web (`apps/web`)

Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui pattern · TanStack Query v5 · Zustand v5 · React Hook Form · Zod · Supabase SSR · Vitest · Playwright · Lucide · date-fns

### Mobile (`apps/mobile`)

Expo SDK 54 · React Native 0.81 · Ignite (Infinite Red) · React Navigation v7 · TanStack Query v5 · **Zustand v5** (NOT MST) · React Hook Form · Zod · @supabase/supabase-js (+ MMKV session adapter) · Jest · jest-expo · Maestro · Sentry · Reactotron

### Shared (`packages/*`)

- `@app-stack/shared-types` — Supabase-generated types
- `@app-stack/shared-schemas` — Zod schemas + `z.infer` types
- `@app-stack/shared-constants` — enums, regex, limits
- `@app-stack/shared-i18n` — i18next translation strings + `TxKeyPath`
- `@app-stack/shared-tokens` — design token values + CSS var generator
- `@app-stack/shared-supabase` — platform-agnostic client factory + services
- `@app-stack/shared-config` — tsconfig bases, eslint presets

### Rules for AI Agents

1. **No UI components in `packages/*`.** shadcn lives in web, Ignite components live in mobile, both aligned to `shared-tokens`.
2. **Zod schemas live in `shared-schemas`.** Never duplicate validation between apps.
3. **Supabase services are platform-agnostic** in `shared-supabase`. Client is injected by each app. Importing `next` or `react-native` in `shared-supabase` is a bug.
4. **Zustand for client state in both worlds.** Do NOT reintroduce MST. No Redux, Jotai, Recoil.
5. **Every mutation:** auth + ownership check. RLS alone is not sufficient.
6. **List queries MUST have `.limit()`** (default 200).
7. **TypeScript strict:** no `@ts-ignore`, no `any`.
8. **Design tokens:** values in `shared-tokens`. Web exports CSS vars via `toCssVariables()`; mobile imports JS objects.
9. **Before adding a dep to `packages/*`**, confirm it is platform-agnostic (no `next`, no `react-native`).
10. **Before adding the same logic to both apps**, extract it to a shared package.
11. **Supabase types are regenerated** via `pnpm gen:types`. Never hand-edited.
12. **i18n placeholders use `{{var}}`** (i18next native). No ICU, no next-intl.
13. **Service pattern:** `(client: AppSupabaseClient, args) => Promise<Result>`. No classes, no ORM.
14. **No FK JOINs to `auth.users`.** Use `public.users` or `profiles`.

### Do NOT introduce

- MobX-State-Tree (MST) in new projects
- Tamagui, Solito, Expo Router universal (L3 patterns) without explicit architectural discussion
- Alternative state managers (Redux, Jotai, Recoil, Valtio)
- next-intl (we use i18next cross-platform)
- UI components in `packages/shared-*`
- Supabase type hand-edits
- Server actions or mutations that skip auth/ownership checks
<!-- APP-STACK-END -->
