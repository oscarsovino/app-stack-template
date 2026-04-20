# Roadmap — app-stack-template

> Última actualización: 2026-04-20 · Commit: 93e2a14 (PR #1 mergeado) · CI: green

Fuente de verdad del estado del template. Se actualiza al cierre de cada sesión.

## Estado por fase

### Fase 1 — Scaffold + shared packages ✅
Commit: `94fc9ae`

- pnpm workspaces + Turborepo + TypeScript strict
- 7 `packages/shared-*` skeletons: config, types, schemas, constants, i18n, tokens, supabase
- `SPEC.md`, `README.md`, `app-stack-claude.md`
- `init-app-stack.sh` con inyección idempotente de bloque CLAUDE.md
- CI workflow (`.github/workflows/ci.yml`)

### Fase 2 — apps/web + apps/mobile ✅
Commits: `65ecbf0` → `3e54021`

- `apps/web`: Next.js 16 + shadcn minimal (Button, Card) + Supabase SSR + `proxy.ts` + TanStack Query / i18n providers
- `apps/mobile`: Expo 54 + Ignite conventions + **Zustand** (no MST) + MMKV + React Navigation v7
- `init-app-stack.sh` con flags `--preset=web|mobile|both|none`, `--install`, `--force`
- Validación en sandbox: `pnpm install` (45s, 1306 pkgs) + `turbo run typecheck` 8/8 verde
- Fixes post-sandbox: tokens `as const` widening, supabase cookie types, `@types/react` peer

### Fase 2.5 — CI reproducible ✅
Commits: `e6bc863` → `b1d6f63` → `db7d97d` → `f00ee35`

- pnpm/action-setup version mismatch resuelto (leer `packageManager` de root)
- `pnpm-lock.yaml` committeado para cache en CI (no se copia a targets por init script)
- `next lint` removido en Next 16 → `eslint .` directo (pero desactivado en CI, ver TODO)
- `vitest run --passWithNoTests` + `jest --passWithNoTests` para tolerar ausencia de tests

### Fase 3 — Piloto en PollyFlip ✅
Commit: `31dcf0e` · PR: https://github.com/oscarsovino/pollyflip/pull/1

- Worktree `feat/app-stack-migration` en PollyFlip + `origin` configurado (GitHub `oscarsovino/pollyflip`, privado)
- Código de PollyFlip reubicado bajo `apps/mobile/app/{components,constants,screens,navigators}`
- **expo-router → React Navigation v7** (native-stack) — el template prescribe RN Nav. `RootStackParamList` tipado; todos los `router.*` reescritos a `navigation.*` + `route.params`
- Nuevo entrypoint `apps/mobile/index.tsx` + `app/app.tsx` (`registerRootComponent`)
- `main: "index.tsx"`, sin `expo-router`, con `@react-navigation/native-stack` añadido
- Strictness del monorepo respetada (`noUncheckedIndexedAccess: true`): helper `firstDeck()` con tuple no-vacía en lugar de fallbacks inseguros
- `turbo run typecheck`: **8/8 verde** sin overrides locales
- Smoke test: iOS + Android bundles generados (3.6 MB hbc)

### Fase 4 — Migraciones adicionales (pendiente)
- **BRN** → monorepo (conservar deps específicas: `@maplibre/maplibre-react-native`, offline queue, expo-audio)
- **miAcademia** → monorepo (MST queda como excepción hasta migración natural; no forzar ahora)
- **alDia2.0** → consolidar con el template (ya es monorepo, alinear nomenclatura `@aldia/*` → `@app-stack/*`)

## TODOs técnicos

### Alta prioridad
- [x] ~~`.npmrc` con `node-linker=hoisted`~~ (aplicado; `init-app-stack.sh` ahora lo copia a targets)
- [x] ~~`hoist-non-react-statics` como dep directa en `apps/mobile`~~
- [x] ~~Decidir nav library por defecto + guía migración~~ → SPEC.md §11.1–11.2; reglas 13 y 15 en SPEC/bloque CLAUDE
- [x] ~~`reactCompiler` guard~~ → SPEC.md §11.3; regla 14/16 en SPEC/bloque CLAUDE
- [x] ~~`babel-preset-expo` version mismatch~~ (`~13.0.0` → `~54.0.10`, alineado con SDK 54; SPEC §11.4)
- [ ] **ESLint config** para ambos apps. `apps/web`: flat config Next 16 + `@eslint/eslintrc`. `apps/mobile`: `.eslintrc.js` extendiendo `eslint-config-expo`. Luego reintegrar `lint` al CI: `turbo run typecheck lint test`.
- [ ] **Script `gen-css-vars`** en `apps/web` que use `toCssVariables()` de `@app-stack/shared-tokens` para generar el bloque de `globals.css` (hoy están duplicados a mano).
- [ ] **Script `pnpm gen:types`** en root: corre `supabase gen typescript` contra el proyecto y escribe `packages/shared-types/src/database.ts`.

### Media prioridad
- [ ] Tests reales (Vitest en `apps/web`, jest-expo en `apps/mobile`). Hoy pasan con `--passWithNoTests`.
- [ ] Playwright scaffold (`apps/web/tests/e2e`) + Maestro scaffold (`apps/mobile/.maestro/flows`).
- [ ] Documentar convención para añadir un nuevo `shared-*` package (contenido mínimo, qué NO incluir, criterio para crear vs extender).

### Baja / future-proofing
- [ ] GitHub Actions: migrar a Node 24. `actions/checkout@v4` + `setup-node@v4` + `pnpm/action-setup@v4` corren en Node 20, deprecated antes de septiembre 2026.
- [ ] Preset `monorepo-consumer` si aparecen 3+ apps tourist-style con mismas convenciones (bottom nav, theming, PWA).
- [ ] Evaluar `@app-stack/shared-services` (hooks reusables como `useProfile`, `useAuth`) tras 2-3 migraciones. Solo si el patrón emerge orgánicamente.

## Playbook próxima sesión — iniciar Fase 4

Template estable con fixes Fase 3 aplicados. Siguiente migración:

```bash
cd /home/pc/projects/app-stack-template
git pull --ff-only

# 1. Elegir primer proyecto de Fase 4 (propuesta: BRN por peso; o alDia2.0 por ser ya monorepo)
# 2. Crear worktree feat/app-stack-migration en el proyecto elegido
# 3. bash init-app-stack.sh <worktree> --preset=both  (rehecha: .npmrc + deps ya correctas)
# 4. Migrar código; si viene de expo-router, seguir SPEC.md §11.2
# 5. pnpm turbo run typecheck → verde con strictness completa
# 6. PR + smoke test (iOS + Android bundles)
```

## Dónde vive el estado

| Artefacto | Ubicación | Rol |
|---|---|---|
| Roadmap (este archivo) | `/home/pc/projects/app-stack-template/ROADMAP.md` | Estado por fase + TODOs + playbook. Fuente de verdad. |
| Decisiones arquitecturales | `SPEC.md` | Qué comparte, qué no, reglas para agentes |
| Bloque CLAUDE.md target | `app-stack-claude.md` | Se copia a proyectos target vía `init-app-stack.sh` |
| Memoria Claude cross-sesión | `/home/pc/.claude/projects/-home-pc-projects/memory/` | `feedback_validate_recommendations.md`, `project_app_stack_template.md` |
| Historia autoritativa | `git log` | Qué se hizo, cuándo, por qué (mensajes de commit) |
| CI status | GitHub Actions | Verde/rojo por commit |

## Convención de actualización

Al cerrar cada sesión que toque el template:

1. Mover fases completadas a estado ✅ con su commit hash.
2. Añadir nueva fase en progreso con ⏳.
3. Agregar TODOs nuevos detectados; marcar los resueltos.
4. Actualizar el "Playbook próxima sesión" con los comandos concretos.
5. Commit + push: `docs(roadmap): update state after session YYYY-MM-DD`.
