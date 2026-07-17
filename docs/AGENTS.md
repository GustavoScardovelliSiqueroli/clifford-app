# Clifford App - AI Agent Development Guide

## Project Overview

Clifford App is a **Quasar (Vue 3 + TypeScript)** application for client management with monthly billing. Uses **IndexedDB (Dexie.js)** for local persistence, **Pinia** for state management, and **CSS Variables** (Design Tokens) for theming.

---

## Project Structure

```
src/
├── components/ui/          # Reusable UI components (Cl* prefix)
│   ├── ClAvatar.vue
│   ├── ClBadge.vue
│   ├── ClButton.vue
│   ├── ClDateField.vue
│   ├── ClDialog.vue
│   ├── ClEmptyState.vue
│   ├── ClFormField.vue
│   ├── ClFormTextarea.vue
│   ├── ClLoadingState.vue
│   ├── ClMoneyField.vue
│   ├── ClPageCard.vue
│   └── ClPageHeader.vue
├── components/             # Business components
│   └── CobrancaExtraModal.vue
├── pages/                  # Pages (Quasar routes)
│   ├── ClientsPage.vue     # Main reference page
│   ├── ChargesPage.vue
│   ├── ConfigPage.vue
│   └── IndexPage.vue
├── stores/                 # Pinia stores
│   ├── cliente-store.ts
│   ├── cobranca-store.ts
│   ├── config-store.ts
│   └── index.ts
├── database/
│   ├── connection.ts       # Dexie DB connection
│   ├── migrations.ts       # DB migrations
│   └── repositories/
│       ├── cliente-repository.ts
│       ├── ajustes-repository.ts
│       └── cobranca-repository.ts
├── css/
│   ├── app.scss
│   ├── design-tokens.scss  # CSS Variables (Design Tokens)
│   └── quasar.variables.scss
├── router/
│   ├── index.ts
│   └── routes.ts
├── layouts/
│   └── MainLayout.vue
├── boot/
│   └── database.ts         # DB init boot
├── App.vue
└── main.ts
```

---

## Core Patterns (Reference: `src/pages/ClientsPage.vue`)

### 1. Page Structure

```vue
<template>
  <q-page class="page">
    <ClPageHeader title="Title" :subtitle="subtitle">
      <template #actions>
        <ClButton variant="primary" icon="add" label="Novo" @click="openDialog" />
      </template>
    </ClPageHeader>

    <div class="page-content">
      <!-- Search -->
      <div class="search-wrapper">
        <ClFormField v-model="search" placeholder="Buscar..." type="search" prependIcon="search" />
      </div>

      <!-- Loading -->
      <ClLoadingState v-if="store.loading" label="Carregando..." />

      <!-- Empty State -->
      <ClEmptyState
        v-else-if="filtered.length === 0"
        :icon="search ? 'search_off' : 'people'"
        ...
      />

      <!-- List -->
      <div v-else role="list">
        <transition-group name="list" tag="div" class="list">
          <div v-for="item in filtered" :key="item.id" class="card" role="listitem">
            <div class="card__main">
              <ClAvatar :name="item.name" size="md" shape="circle" />
              <div class="card__info">
                <h3>{{ item.name }}</h3>
                <ClBadge v-if="!item.active" variant="secondary" size="sm">Inativo</ClBadge>
              </div>
            </div>
            <div class="card__actions">
              <ClButton variant="ghost" icon="edit" @click="edit(item)" />
              <ClButton
                variant="ghost"
                icon="delete"
                class="btn-delete"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- Dialogs (Create/Edit & Delete Confirm) -->
    <ClDialog v-model="dialog" :title="editing ? 'Editar' : 'Novo'" show-footer="auto">
      <form @submit.prevent="save" id="form-id">
        <!-- Form fields using ClFormField, ClDateField, ClMoneyField, etc. -->
      </form>
      <template #footer>
        <ClButton variant="ghost" @click="dialog = false">Cancelar</ClButton>
        <ClButton
          variant="primary"
          type="submit"
          form="form-id"
          :loading="saving"
          :label="editing ? 'Salvar' : 'Adicionar'"
          size="lg"
        />
      </template>
    </ClDialog>

    <ClDialog v-model="deleteDialog" title="Excluir" show-footer="auto">
      <p>
        Tem certeza que deseja excluir <strong>{{ selected?.name }}</strong
        >?
      </p>
      <template #footer>
        <ClButton variant="ghost" @click="deleteDialog = false">Cancelar</ClButton>
        <ClButton variant="destructive" :loading="deleting" @click="delete">Excluir</ClButton>
      </template>
    </ClDialog>
  </q-page>
</template>
```

### 2. Script Setup Pattern

```ts
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClientesStore } from 'src/stores/cliente-store'
import type { Cliente } from 'src/database/repositories/cliente-repository'
import { date } from 'quasar'
import {
  ClPageHeader, ClButton, ClDialog, ClEmptyState, ClLoadingState,
  ClAvatar, ClBadge, ClFormField, ClFormTextarea, ClDateField, ClMoneyField
} from 'src/components/ui'

const store = useClientesStore()

// Search
const search = ref('')
const filtered = computed(() => {
  if (!search.value.trim()) return store.clientes
  const term = search.value.toLowerCase()
  return store.clientes.filter(c =>
    c.nome.toLowerCase().includes(term) || c.telefone?.toLowerCase().includes(term)
  )
})

// Form Dialog State
const dialog = ref(false)
const editing = ref(false)
const saving = ref(false)
const selected = ref<Cliente | null>(null)
const form = ref({ nome: '', telefone: '', birth_date: '', created_at: '', obs: '', ativo: true, mensalidade_valor: 0, mensalidade_dia_vencimento: '' })
const errors = ref({ nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' })

const todayISO = date.formatDate(new Date(), 'YYYY-MM-DD')

// Form Actions
function openNew() { ... }
function openEdit(client: Cliente) { ... }
async function save() { ... }
function confirmDelete(client: Cliente) { ... }
async function delete() { ... }

onMounted(() => void store.carregar())
</script>
```

### 3. Store Pattern (`src/stores/cliente-store.ts`)

```ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ClienteRepository, type Cliente } from 'src/database/repositories/cliente-repository';

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([]);
  const loading = ref(false);

  async function carregar() {
    loading.value = true;
    clientes.value = await ClienteRepository.findAll();
    loading.value = false;
  }

  async function adicionar(dados: Omit<Cliente, 'id' | 'created_at'>) {
    dados.nome = dados.nome.trim();
    await ClienteRepository.create(dados);
    await carregar();
  }

  async function atualizar(id: number, dados: Partial<Cliente>) {
    if (dados.nome) dados.nome = dados.nome.trim();
    await ClienteRepository.update(id, dados);
    await carregar();
  }

  async function remover(id: number) {
    await ClienteRepository.remove(id);
    await carregar();
  }

  return { clientes, loading, carregar, adicionar, atualizar, remover };
});
```

### 4. Repository Pattern (`src/database/repositories/cliente-repository.ts`)

```ts
import { getDB, saveDB } from '../connection'

export interface MensalidadeConfig { id?: number; cliente_id?: number; valor?: number; dia_vencimento?: number }
export interface Cliente {
  id?: number; nome: string; telefone?: string; birth_date?: string; obs: string; ativo: number; created_at?: string; mensalidade_config?: MensalidadeConfig
}

export const ClienteRepository = {
  async findAll(): Promise<Cliente[]> { ... },
  async findById(id: number): Promise<Cliente | null> { ... },
  async create(cliente: Omit<Cliente, 'id'>): Promise<void> { ... },
  async update(id: number, cliente: Partial<Cliente>): Promise<void> { ... },
  async remove(id: number): Promise<void> { ... }
}
```

---

## UI Components Library (`src/components/ui/`)

All components are exported from `src/components/ui/index.ts` and prefixed with `Cl`.

| Component          | Props                                                                                                                                                                                           | Events                                        | Usage                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **ClButton**       | `variant` (primary/secondary/outline/ghost/destructive/success), `size` (sm/md/lg/xl), `icon`, `label`, `loading`, `disabled`, `fullWidth`, `round`, `type`                                     | `click`                                       | `<ClButton variant="primary" icon="add" label="Novo" @click="..." />`                                                                   |
| **ClDialog**       | `modelValue`, `title`, `persistent`, `maximized`, `fullMobile`, `showHeader`, `showFooter` ('auto'/bool)                                                                                        | `update:modelValue`, `close`                  | `<ClDialog v-model="dialog" title="Título" show-footer="auto">...</ClDialog>`                                                           |
| **ClFormField**    | `modelValue`, `label`, `type`, `placeholder`, `disabled`, `readonly`, `required`, `error`, `hint`, `prepend`, `append`, `clearable`, `name`, `autocomplete`, `inputmode`                        | `update:modelValue`, `blur`, `focus`, `clear` | `<ClFormField v-model="form.nome" label="Nome" :error="errors.nome" required />`                                                        |
| **ClDateField**    | `modelValue` (ISO YYYY-MM-DD), `label`, `placeholder`, `disabled`, `readonly`, `required`, `error`, `hint`, `clearable`, `prepend`, `append`, `min`, `max`, `showWeekNumbers`, `firstDayOfWeek` | `update:modelValue`, `blur`, `focus`, `clear` | `<ClDateField v-model="form.birth_date" label="Nascimento" placeholder="DD/MM/AAAA" :max="todayISO" />`                                 |
| **ClMoneyField**   | `modelValue` (number), `label`, `placeholder`, `min`, `max`, `step`, `error`, `disabled`, `readonly`, `required`                                                                                | `update:modelValue`, `blur`, `focus`          | `<ClMoneyField v-model="form.valor" label="Mensalidade" :min="0" :step="0.01" />`                                                       |
| **ClFormTextarea** | `modelValue`, `label`, `placeholder`, `rows`, `disabled`, `readonly`, `required`, `error`, `hint`, `maxlength`                                                                                  | `update:modelValue`, `blur`, `focus`          | `<ClFormTextarea v-model="form.obs" label="Obs" :rows="3" />`                                                                           |
| **ClAvatar**       | `src`, `alt`, `name`, `size` (xs/sm/md/lg/xl), `fallbackIcon`, `shape` (circle/square/rounded)                                                                                                  | -                                             | `<ClAvatar :name="client.nome" size="md" shape="circle" />`                                                                             |
| **ClBadge**        | `variant` (primary/secondary/success/warning/error/outline), `size` (sm/md/lg), `dot`                                                                                                           | -                                             | `<ClBadge variant="secondary" size="sm">Inativo</ClBadge>`                                                                              |
| **ClEmptyState**   | `title`, `description`, `icon`, `iconColor`, `iconSize`, `image`, `actionLabel`, `actionVariant`, `actionSize`, `align`                                                                         | `action`                                      | `<ClEmptyState icon="people" title="Vazio" description="Adicione um" actionLabel="Novo" @action="..." />`                               |
| **ClLoadingState** | `label`, `size` (sm/md/lg), `color`, `align`                                                                                                                                                    | -                                             | `<ClLoadingState label="Carregando..." />`                                                                                              |
| **ClPageHeader**   | `title`, `subtitle`, `large`                                                                                                                                                                    | -                                             | `<ClPageHeader title="Clientes" :subtitle="\`\${store.clientes.length} cadastrados\`"><template #actions>...</template></ClPageHeader>` |

---

## Design Tokens (CSS Variables)

Defined in `src/css/design-tokens.scss`. Use **only CSS variables** in components/pages.

### Colors

```css
--color-primary: #fbac25;
--color-primary-hover: #e0971f;
--color-primary-contrast: #1a1a1a;
--color-negative: #c10015;
--color-positive: #21ba45;
--color-white: #ffffff;
--color-bg-primary: #f5f5f7;
--color-bg-secondary: #ffffff;
--color-bg-tertiary: #f0f0f0;
--color-surface-primary: #ffffff;
--color-surface-border: #ebebeb;
--color-text-primary: #1a1a1a;
--color-text-secondary: #616161;
--color-text-tertiary: #9e9e9e;
--color-border-light: #ebebeb;
--color-border-medium: #e0e0e0;
--color-border-focus: #fbac25;
```

### Spacing

```css
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-7: 28px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
```

### Typography

```css
--font-family-base: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-caption: 11px;
--font-size-caption-md: 12px;
--font-size-body-sm: 13px;
--font-size-body: 14px;
--font-size-body-lg: 15px;
--font-size-subtitle: 16px;
--font-size-title: 18px;
--font-size-title-lg: 20px;
--font-size-h6: 22px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Border Radius

```css
--border-radius-sm: 8px;
--border-radius-md: 12px;
--border-radius-lg: 16px;
--border-radius-xl: 20px;
--border-radius-2xl: 24px;
--border-radius-full: 9999px;
--border-radius-button: 12px;
--border-radius-input: 12px;
--border-radius-card: 20px;
```

### Shadows

```css
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03);
--shadow-dialog: 0 20px 25px rgba(0, 0, 0, 0.05), 0 8px 10px rgba(0, 0, 0, 0.03);
```

### Transitions

```css
--transition-fast: 120ms ease;
--transition-normal: 200ms ease;
--transition-button: 120ms ease;
--transition-card: 200ms ease;
--transition-input: 120ms ease;
```

### Component Dimensions

```css
--input-height-md: 48px;
--button-height-md: 44px;
--dialog-max-width: 400px;
--dialog-border-radius: 24px;
--dialog-padding: 24px;
--tab-bar-height: 56px;
```

---

## Styling Conventions

### Page Container (`.page`)

```scss
.page {
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));
}
```

### Page Content (`.page-content`)

```scss
.page-content {
  padding: var(--spacing-4) var(--spacing-6);
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));

  @media (min-width: 1024px) {
    padding: var(--spacing-6) var(--spacing-8);
    padding-bottom: calc(var(--spacing-6) + var(--tab-bar-height));
  }
}
```

### Card Pattern (`.client-card`)

```scss
.client-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-surface-primary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--border-radius-card);
  box-shadow: var(--shadow-card);
  transition:
    box-shadow var(--transition-card),
    transform var(--transition-card);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: var(--shadow-md);
    }
  }
  @media (hover: none) and (pointer: coarse) {
    &:active {
      box-shadow: var(--shadow-card-active);
      transform: scale(0.99);
    }
  }
}
```

### Form Layout (`.client-form`)

```scss
.client-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
```

### Transitions

```scss
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
```

---

## Key Development Rules

### 1. **Import UI Components Only from Barrel**

```ts
import { ClButton, ClDialog, ClFormField, ... } from 'src/components/ui'
// NOT from individual files
```

### 2. **Use Pinia Stores for Data**

- Never call repositories directly from pages
- Always use `useClientesStore()`, `useCobrancaStore()`, etc.
- Stores handle `carregar()` refresh after mutations

### 3. **Form Validation Pattern**

```ts
const errors = ref({ nome: '', campo: '' })

async function save() {
  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório'
    return
  }
  // Clear error on user input
  @update:model-value="errors.value.campo = ''"
}
```

### 4. **Date Handling**

- Store dates as **ISO string (YYYY-MM-DD)**
- `ClDateField` handles DD/MM/YYYY display automatically
- Use `date.formatDate(new Date(), 'YYYY-MM-DD')` from Quasar

### 5. **Money Handling**

- Store as **number** (not string)
- `ClMoneyField` handles formatting
- Validate: `valor > 0` when provided

### 6. **Accessibility**

- Use `aria-label` on icon-only buttons
- `role="list"` + `role="listitem"` on lists
- `aria-invalid`, `aria-describedby` on form fields (handled by ClFormField)

### 7. **Mobile-First Responsive**

- Base styles mobile-first
- Use `@media (min-width: 1024px)` for desktop
- Touch targets: min 44px (buttons), 48px (inputs)
- Safe area insets for bottom padding

### 8. **State Management**

```ts
// Loading states
const saving = ref(false);
const deleting = ref(false);

// In async functions
saving.value = true;
try {
  await store.adicionar(payload);
  dialog.value = false;
} catch (error) {
  // Handle unique constraint, etc.
} finally {
  saving.value = false;
}
```

---

## Development Scripts (Quality Gates)

Run these **after every change** to catch errors early:

### Lint (ESLint)

```bash
npm run lint
```

- Checks: TypeScript, Vue SFCs, unused vars, import order, etc.
- Config: `eslint.config.js` (flat config)
- Run **before committing** or when CI fails

### Format (Prettier)

```bash
npm run format
```

- Auto-formats: `.js`, `.ts`, `.vue`, `.css`, `.scss`, `.html`, `.md`, `.json`
- Ignores: `.gitignore` patterns
- Run **before committing** to avoid style conflicts

### Type Check (Vue TSC)

```bash
npx vue-tsc --noEmit
```

- Validates TypeScript types across Vue SFCs
- Catches prop types, emits, ref types, etc.
- Run **after major refactors** or before PR

### Build (Production)

```bash
npm run build
```

- Full Vite + Quasar production build
- Runs type check, minification, asset hashing
- Output: `dist/` (SPA) or `dist/` + `capacitor/` (mobile)
- **Must pass** before deploying

### Dev Server (Hot Reload)

```bash
npm run dev
```

- Starts Vite dev server with Quasar
- HMR for Vue SFCs, SCSS, TS
- Access at `http://localhost:9000` (or shown port)

---

### Recommended Workflow

```bash
# 1. Make changes
# 2. Format code
npm run format

# 3. Lint (fix auto-fixable)
npm run lint

# 4. Type check (if TS changes)
npx vue-tsc --noEmit

# 5. Build (final verification)
npm run build

```

---

## Adding New Pages

1. Create `src/pages/NewPage.vue` following `ClientsPage.vue` pattern
2. Create store in `src/stores/new-store.ts` following `cliente-store.ts`
3. Create repository in `src/database/repositories/new-repository.ts`
4. Add types to repository
5. Register route in `src/router/routes.ts`
6. Add store to `src/stores/index.ts` if needed

---

## Useful Imports

```ts
// Quasar utilities
import { date } from 'quasar'
import { QIcon, QSpinnerDots, QPopupProxy, QDate, QBtn } from 'quasar'

// Types
import type { Cliente } from 'src/database/repositories/cliente-repository'

// Stores
import { useClientesStore } from 'src/stores/cliente-store'
import { useCobrancaStore } from 'src/stores/cobranca-store'
import { useConfigStore } from 'src/stores/config-store'

// UI Components (always from barrel)
import { ClButton, ClDialog, ClFormField, ClDateField, ClMoneyField, ... } from 'src/components/ui'
```

---

## Database (Dexie.js)

- `src/database/connection.ts` - DB instance
- `src/database/migrations.ts` - Schema migrations
- `src/boot/database.ts` - App boot initialization
- Repositories use raw SQL via `db.query()` and `db.run()`
- Always call `await saveDB()` after mutations

---

## Testing & Linting

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npx vue-tsc --noEmit

# Build
npm run build

# Dev server
npm run dev
```

---

## Quick Reference: ClientsPage Patterns

| Pattern               | Implementation                                                     |
| --------------------- | ------------------------------------------------------------------ |
| Search filter         | `computed(() => store.items.filter(...))`                          |
| Loading state         | `<ClLoadingState v-if="store.loading" />`                          |
| Empty state           | `<ClEmptyState v-if="filtered.length === 0" />`                    |
| List with transitions | `<transition-group name="list" tag="div" class="list">`            |
| Card layout           | `.card { display: flex; justify-content: space-between }`          |
| Avatar + info         | `<ClAvatar :name="item.name" /> + .card__info`                     |
| Status badge          | `<ClBadge v-if="!item.ativo" variant="secondary" size="sm">`       |
| Action buttons        | `<ClButton variant="ghost" icon="edit/delete" />`                  |
| Form dialog           | `<ClDialog v-model="dialog" :title="editing ? 'Editar' : 'Novo'">` |
| Form submit           | `<form @submit.prevent="save">` + `type="submit" form="form-id"`   |
| Footer actions        | `<template #footer>` with Cancel + Primary buttons                 |
| Delete confirm        | Separate `<ClDialog>` with destructive button                      |
| Date fields           | `<ClDateField v-model="form.date" :max="todayISO" />`              |
| Money field           | `<ClMoneyField v-model="form.value" :min="0" :step="0.01" />`      |

---

_Use `ClientsPage.vue` as the canonical reference for implementing new pages._
