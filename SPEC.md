# App Stack — Technical Specification

> Version: 0.1.0
> Date: 2026-04-19
> Pattern: L1+ shared logic, separate UI
> Validated against: Industry patterns 2026 (pnpm + Turborepo + Next + Expo monorepos)

## 1. Objective

Define a standardized, reproducible stack for web and mobile applications that share a Supabase backend. Every technology choice is documented with its rationale and alternatives considered.

This template follows the **L1+ shared-logic pattern**: share non-UI concerns, let each platform use its idiomatic UI stack.

## 2. Stack

### 2.1 Monorepo

- **Package manager:** pnpm 9 (workspaces)
- **Build orchestration:** Turborepo 2
- **TypeScript:** 5.x strict across all packages/apps
- **Node:** 20.x LTS
- **Install strategy:** root `.npmrc` sets `node-linker=hoisted`. React Native requires this: Metro cannot resolve transitive deps of `expo`, `react-native-gesture-handler`, etc. under pnpm's isolated layout without it. Symptom when missing: `Unable to resolve module X` during `expo start` / `expo export` mid-bundle.

### 2.2 Web (`apps/web`)

- Next.js 16 + React 19
- TypeScript strict
- Tailwind CSS v4 + shadcn/ui pattern (`cva` + `cn()` + `tailwind-merge`)
- TanStack Query v5 · Zustand v5
- React Hook Form v7 + Zod v4
- Supabase SSR (`@supabase/ssr`)
- Vitest + Playwright + Testing Library
- Lucide React · date-fns v4

### 2.3 Mobile (`apps/mobile`)

- Expo SDK 54 + React Native 0.81
- Ignite by Infinite Red (folder conventions: `app/{components,config,hooks,i18n,models,navigators,screens,services,theme,utils}`)
- **React Navigation v7** (native-stack + bottom-tabs) — **NOT expo-router**. See §11 for rationale and migration guidance.
- TanStack Query v5
- **Zustand v5** — NO MST in new projects
- React Hook Form v7 + Zod v4
- `@supabase/supabase-js` + MMKV session adapter
- Jest (jest-expo) + Maestro E2E
- react-native-mmkv v3 · Sentry · Reactotron

### 2.4 Shared (`packages/*`)

| Package | Content | Platform-aware? |
|---|---|---|
| `shared-config` | tsconfig bases, eslint presets | No |
| `shared-types` | Supabase-generated types | No |
| `shared-schemas` | Zod schemas + `z.infer` types | No |
| `shared-constants` | Enums, regex, limits | No |
| `shared-i18n` | Translation strings + `TxKeyPath` | No |
| `shared-tokens` | Design token values + CSS var generator | No |
| `shared-supabase` | Client factory + pure services | Peer: `@supabase/supabase-js` |

**Package rules:**
- Source-only TS. `main` and `types` point to `./src/index.ts`. No build.
- `sideEffects: false`.
- No framework deps (no `next`, no `react-native`, no `react-dom`).
- Peer deps only when strictly necessary.

## 3. Why L1+, not L3 (universal UI)

L3 (Tamagui + Solito + Expo Router universal) was evaluated. Rejected for these reasons:

1. **Expo Router web SSR is alpha** in SDK 55 (2026). Not ready for dynamic SEO.
2. **`create-universal-app` is deprecated** — flagship starter for the L3 stack. Signals maintenance burden.
3. No robust production case studies in 2026.
4. Pilot projects (BRN, miAcademia, alDia2.0) already have UI primitives and conventions that L3 would fully rewrite.
5. L3 would replace shadcn/Tailwind on web — contradicts the preset consumer web work.

**L1+ wins here because:**
- Share 30-40% of code (the high-friction parts: schemas, types, services, i18n, tokens).
- Next.js and Expo remain canonical — massive documentation surface = AI-agent friendly.
- Independent upgrade paths for web and mobile.
- Reversible: if L3 becomes necessary later, Tamagui can be added to a new `packages/shared-ui` without touching the rest.

### The "what you DON'T share" matters

Platforms have genuinely different idioms: tap targets, bottom sheets, haptics on mobile; hover states, keyboard navigation, responsive layouts on web. Forcing shared UI produces a product that feels slightly wrong on both. Shared tokens + platform-idiomatic primitives produce better UX.

## 4. What IS shared, concretely

### 4.1 Supabase schema

- One migration set in `supabase/migrations/`.
- `pnpm gen:types` regenerates `packages/shared-types/src/database.ts`.
- Both apps consume `Database` from `@app-stack/shared-types`.

### 4.2 Domain validation

- One Zod schema per domain concept in `@app-stack/shared-schemas`.
- Web uses it in Server Actions + RHF resolvers.
- Mobile uses it in mutations + RHF resolvers.
- `z.infer<typeof schema>` yields the TS type.

### 4.3 Data services

- `@app-stack/shared-supabase` exports `createClient(opts)` and pure service functions.
- Signature: `(client: AppSupabaseClient, args) => Promise<Result>`.
- Client injection per platform:
  - Web: `@supabase/ssr` createBrowserClient / createServerClient
  - Mobile: `@supabase/supabase-js` + MMKV storage adapter
- **Rule:** no React hooks inside `shared-supabase`. Hooks live in each app.

### 4.4 i18n strings

- `@app-stack/shared-i18n` exports `resources` consumed by each app's i18next init.
- Placeholders: `{{var}}` (i18next native).
- `TxKeyPath` type gives autocomplete for translation keys.

### 4.5 Design tokens

- Values as JS objects: `colors`, `colorsDark`, `spacing`, `fontSizes`, `fontWeights`, `lineHeights`.
- `toCssVariables(theme)` generates the CSS block for Tailwind v4 `@theme inline`.
- Mobile consumes the JS objects directly in `theme/` (Ignite convention).

### 4.6 Dev config

- `@app-stack/shared-config/tsconfig.base.json` extended by every tsconfig.
- `@app-stack/shared-config/eslint.base.mjs` extended by every flat config.
- Prettier config lives at root (Prettier doesn't support shared configs as cleanly).

## 5. What is NOT shared

| Concern | Web | Mobile |
|---|---|---|
| UI primitives | `apps/web/src/components/ui/` (shadcn+cva) | `apps/mobile/app/components/` (Ignite) |
| Screens / routes | `apps/web/src/app/` (App Router) | `apps/mobile/app/screens/` + React Navigation |
| Layout & responsive | Tailwind + media queries | StyleSheet + Dimensions / size-matters |
| Navigation | Next.js `<Link>` + `useRouter` | React Navigation `navigation.navigate` |
| Session storage | Cookies via `@supabase/ssr` | MMKV adapter |
| Middleware | `proxy.ts` | Client-side guards + RLS |

## 6. Rules for AI Agents

1. **No UI components in `packages/*`.** There is no `shared-ui` package. If one becomes necessary, raise it as an architecture decision (L2/L3 evaluation).
2. **Zod schemas live in `shared-schemas`.** Never duplicate validation between apps.
3. **Supabase services are platform-agnostic.** Importing `next`, `next/server`, or `react-native` inside `shared-supabase` is a bug.
4. **Zustand for client state in both worlds.** Do not reintroduce MST. Do not introduce Redux, Jotai, Recoil.
5. **Every mutation has auth + ownership check.** RLS is necessary but not sufficient. Service functions validate ownership explicitly.
6. **List queries MUST have `.limit()`.** Default 200. Pagination required for unbounded sources.
7. **TypeScript strict.** No `@ts-ignore`, no `any`. `@ts-expect-error` only with justification.
8. **Design tokens are values, not components.** CSS vars generated for web; mobile consumes JS objects directly.
9. **Before adding a dep to `packages/*`**, confirm it does not assume a platform. Before adding a dep to both `apps/`, consider moving the logic to a package.
10. **Supabase types are regenerated**, never hand-edited.
11. **i18n placeholders use `{{var}}`** (i18next native). No ICU.
12. **No FK JOINs to `auth.users`.** Use separate queries to `public.users` or `profiles`.
13. **Mobile navigation is React Navigation v7.** Do not introduce or preserve `expo-router` in `apps/mobile`. When importing a project that uses expo-router, rewrite during migration (see §11.2).
14. **Do not enable `reactCompiler` experiment** in `app.config.ts` / `app.json` without first adding `react-compiler-runtime` as a direct dep. Expo SDK 54 does not bundle the runtime, so bundling fails otherwise.

## 7. Testing

- Packages: Vitest for pure TS. Runs under Turbo.
- Web: Vitest + Testing Library + Playwright E2E.
- Mobile: jest-expo + Maestro E2E.
- CI runs `turbo run typecheck lint test`.

## 8. Deploy

- Web: Vercel (connect `apps/web` workspace; Turbo remote cache optional).
- Mobile: EAS Build (`apps/mobile` has its own `eas.json`).
- Supabase: single project for both apps. Migrations under `supabase/`.

## 9. Repository layout

```
app-stack-template/
  package.json              (workspaces root)
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  packages/
    shared-config/
    shared-types/
    shared-schemas/
    shared-constants/
    shared-i18n/
    shared-tokens/
    shared-supabase/
  apps/
    web/                    (Next.js 16 + shadcn + Tailwind v4)
    mobile/                 (Expo 54 + Ignite conventions + Zustand)
  supabase/                 (shared migrations — populated per project)
```

## 10. Versioning

- Template SemVer: breaking = Major, additive = Minor, fixes = Patch.
- `app-stack-claude.md` block is updated via `init-app-stack.sh` in merge mode (marker-driven). Content outside markers is never touched.

## 11. Known constraints and migration notes

Surfaced during the Phase 3 pilot (PollyFlip → monorepo). Recording here so future migrations skip the landmines.

### 11.1 Mobile navigation: React Navigation, not expo-router

Section 3 rules out **universal** expo-router (L3, web+mobile). This template additionally rules out **mobile-only** expo-router in favor of React Navigation v7. Rationale:

- Typed route params via `RootStackParamList` + `NativeStackScreenProps<...>` is strictly checked at compile time. expo-router's `typedRoutes` experiment is opt-in, requires an extra build step, and only validates href literals.
- Ignite conventions (`app/screens/*.tsx` + `app/navigators/*.tsx`) compose naturally with React Navigation. expo-router's file-based routing fights the Ignite structure.
- Every mobile app in this org starts mobile-only. Expo Router's value proposition is SSR + web + deep-link symmetry — none of which we need in `apps/mobile` (web lives in `apps/web` with Next.js).
- One mental model across the stack: `navigation.navigate(...)` + `route.params` resembles Next.js's `router.push(...)` + `useSearchParams()` enough that devs crossing between apps ramp up fast.

### 11.2 Migration guide: expo-router → React Navigation v7

When migrating an app that uses expo-router (file-based routing):

1. **Delete `app/_layout.tsx`, `app/index.tsx`, dynamic route dirs** (`app/[id].tsx`, `app/foo/[id].tsx`, etc.).
2. **Move screens** to `app/screens/<Name>Screen.tsx`. Rename default exports (`HomeScreen`, `DeckScreen`, …).
3. **Create `app/navigators/RootNavigator.tsx`** with `createNativeStackNavigator<RootStackParamList>()` where `RootStackParamList` declares every screen's params (`{ id: string }`, etc.). Export both the component and the ParamList type.
4. **Declare the ParamList globally** so every `useNavigation()` call gets typed:
   ```ts
   declare global {
     namespace ReactNavigation {
       interface RootParamList extends RootStackParamList {}
     }
   }
   ```
5. **Entrypoint:** `apps/mobile/index.tsx` calls `registerRootComponent(App)` where `App` wraps `RootNavigator` in `NavigationContainer` + any providers (gesture handler, safe area, fonts).
6. **Rewrite call sites:**
   - `router.push('/home')` → `navigation.navigate('Home')`
   - `router.replace('/deck/42')` → `navigation.replace('Deck', { id: '42' })`
   - `router.back()` → `navigation.goBack()`
   - `useLocalSearchParams<{ id: string }>()` → component receives `route: RouteProp<RootStackParamList, 'Deck'>`, read via `route.params.id`.
7. **Remove from `package.json`:** `expo-router`. **Change:** `"main"` from `"expo-router/entry"` to `"index.tsx"`.
8. **Remove from `app.json`/`app.config.ts`:** the `"expo-router"` plugin entry; the `experiments.typedRoutes` flag (expo-router-specific).

### 11.3 `reactCompiler` experiment is off by default

Enabling `experiments.reactCompiler = true` in Expo SDK 54 requires `react-compiler-runtime` as a direct dep. The SDK does not bundle it. Bundling without the runtime fails with `Unable to resolve module react-compiler-runtime`. Leave the experiment off unless the runtime is explicitly added.

### 11.4 `babel-preset-expo` version tracks SDK version

For Expo SDK 54, `babel-preset-expo` must be `~54.x`, not `^13.x`. The major versions look unrelated (SDK 49 used babel-preset-expo v10, SDK 50+ realigned to match). Expo CLI prints a warning on mismatch; bundling may still work but is unsupported.
