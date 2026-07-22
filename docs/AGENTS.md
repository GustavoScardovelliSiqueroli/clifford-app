# clifford-app

**Stack:** Quasar v2 (Vue 3 + TS) + Pinia + Capacitor 8 + `@capacitor-community/sqlite` (SQLite, not Dexie/IndexedDB)  
**Target:** Android (also runs in browser for dev). No backend, no auth, single user.

## Commands

| `npm run dev` | Vite dev server, opens `http://localhost:9000` |
| `npm run lint` | ESLint (flat config via `eslint.config.js`) |
| `npm run format` | Prettier (`--write`, single quotes, printWidth 100) |
| `npm run build` | Quasar production build → `dist/` |
| `npx vue-tsc --noEmit` | Type check (not in `npm test`) |
| `npm test` | No-op (`echo "No test specified" && exit 0`) |
| `npm run postinstall` | Runs `quasar prepare` |

Run after changes: `npm run format` → `npm run lint` → `npx vue-tsc --noEmit` → `npm run build`.

## Architecture

- **No `src/main.ts`** — Quasar generates entry point internally.
- **Router:** hash mode, 4 routes: `/` (Index), `/clientes`, `/cobrancas`, `/configuracoes`.
- **DB boot:** `src/boot/database.ts` — inits `jeep-sqlite` custom element on web, runs migrations.
- **DB connection:** `getDB()` (lazy singleton), `saveDB()` (web store sync after mutations), `closeConnection()`.
- **DB schema** (5 tables, auto-created in `src/database/migrations.ts`):
  - `clientes`, `ajustes`, `mensalidade_config`, `cobrancas`, `cobrancas_extras`
  - `PRAGMA foreign_keys = ON` on every connection.
- **Repositories:** object literals with static methods. Raw SQL via `db.query()` / `db.run()`. Always call `saveDB()` after writes.
- **Stores:** Pinia composition stores (import `defineStore` from `pinia`). Pattern: `carregar()` → refresh after every mutation.
- **UI components:** barrel-exported from `src/components/ui/index.ts` with `Cl` prefix. Import from `src/components/ui`, never from individual files.
- **Composables:** `useBackup` (export/import JSON), `useCompartilharCobranca` (generate PNG + share).

## CSS / Tokens

- **Source of truth:** SCSS variables in `src/css/design-tokens.scss`; also exported as CSS custom properties (`--color-*`, `--spacing-*`, etc.) in `src/css/app.scss` under `:root`.
- Use CSS variables in `.vue` files for runtime theming; use SCSS variables in `.scss` files (mixins, Quasar overrides).
- Quasar override vars in `src/css/quasar.variables.scss`.

## Database Layer

- Authored SQL only (no ORM). Repositories use `@capacitor-community/sqlite` API:
  - `db.query(sql, params?)` for SELECT → `.values` array
  - `db.run(sql, params)` for INSERT/UPDATE/DELETE
  - `db.executeSet([{ statement, values }])` for batch inserts
- After any write mutation: `await saveDB()` persists to web store on browser.
- 3 repositories: `cliente-repository.ts`, `cobranca-repository.ts`, `ajustes-repository.ts`.

## Dev Server Quirks

- Vite config adds COOP/COEP headers (`same-origin` / `require-corp`) — needed for `sql.js` SharedArrayBuffer.
- `sql.js` excluded from Vite `optimizeDeps`.
- `.wasm` files in `assetsInclude`.
- `vite-plugin-checker` runs vue-tsc + ESLint in background (`server: false`).

## Key Conventions

- **Language:** Portuguese in UI and function names (`carregar`, `adicionar`, `busca`, `salvar`).
- **Dates:** ISO strings `YYYY-MM-DD` in DB; `ClDateField` handles display format (DD/MM/YYYY).
- **Money:** stored as `number`, formatted via `ClMoneyField`.
- **Active flag:** `number` (1 or 0) in DB/SQL, converted to `boolean` in Vue templates.
- **Path aliases:** `src/` maps to `src/`.
- **Editorconfig:** 2-space indent for `.ts/.js/.vue`.
- **Mobile-first** responsive; breakpoint at 1024px.
- **Touch targets:** min 44px buttons, 48px inputs.
- **Bottom tab nav** in `MainLayout.vue` with 4 tabs; `safe-area-inset-bottom` padding.

## Useful Imports

```ts
import { date } from 'quasar';
import { useClienteStore } from 'src/stores/cliente-store';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import { useConfigStore } from 'src/stores/config-store';
import type { Cliente } from 'src/database/repositories/cliente-repository';
import type { Cobranca, CobrancaExtra } from 'src/database/repositories/cobranca-repository';
import {
  ClButton,
  ClDialog,
  ClFormField,
  ClDateField,
  ClMoneyField /* ... */,
} from 'src/components/ui';
import { getDB, saveDB } from 'src/database/connection';
```

## Adding a New Page

1. Create page in `src/pages/` following `ClientsPage.vue` pattern
2. Create Pinia store in `src/stores/` following `cliente-store.ts`
3. Create repository in `src/database/repositories/`
4. Add route in `src/router/routes.ts`
