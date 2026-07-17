# Cobranças — Especificação e Plano de Implementação

> Documento de referência para negócio e desenvolvimento. Descreve as regras de negócio, estado atual, e o plano de implementação da tela de Cobranças (`/cobrancas`).

---

## 1. Regras de Negócio

### 1.1 Geração de Cobranças Mensais

- Acontece automaticamente na **primeira vez** que o usuário acessa o app no mês corrente.
- Verifica se já existem cobranças para a competência (`YYYY-MM`).
- Se não existirem, busca **candidatos**: clientes ativos (`ativo = 1`) que tenham `valor_mensalidade > 0` (via `mensalidade_config` ou `ajustes` globais).
- Para cada candidato, cria uma cobrança com:
  - `cliente_id`
  - `valor_mensalidade` (do config do cliente ou global)
  - `vencimento` = `dia_vencimento` do mês da competência (ajusta se o dia não existir no mês, ex: 31 em fevereiro)
  - `competencia` = mês atual
  - `data_pagamento` = `null` (pendente)

### 1.2 Prioridade de Configuração

1. `mensalidade_config` do cliente (valor e/ou dia_vencimento) → **tem prioridade**
2. `ajustes` globais (único registro) → fallback
3. Default: valor = 0 (não gera cobrança), dia_vencimento = 5

### 1.3 Cobranças Extras

- Associadas a uma cobrança principal (`cobrancas_extras.id_cobranca`).
- Podem ser adicionadas a qualquer momento (cobrança pendente ou paga).
- Campos: `motivo` (texto), `valor` (número), `created_at` (auto).
- O **valor total** da cobrança = `valor_mensalidade` + soma dos extras.

### 1.4 Status de Pagamento

| Status       | Condição                    | Ações disponíveis                                                                     |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------- |
| **Pendente** | `data_pagamento IS NULL`    | Dar Baixa, Editar valor/vencimento, Adicionar extras                                  |
| **Pago**     | `data_pagamento` preenchida | Estornar (volta a pendente), Editar valor/vencimento/data_pagamento, Adicionar extras |

### 1.5 Edição de Cobranças

- **Valor mensalidade** e **vencimento**: editáveis sempre (pendente ou pago).
- **Data de pagamento**: editável apenas quando já está paga (permite corrigir a data em que o cliente pagou).
- Dois diálogos separados: (1) valor + vencimento, (2) data de pagamento.

### 1.6 Exclusão

- **Cobrança**: não implementar exclusão direta (histórico). Apenas estornar.
- **Extra**: pode ser removido individualmente.

---

## 2. Estado Atual (Antes da Implementação)

### 2.1 Páginas

| Página            | Rota         | Estado                                                    |
| ----------------- | ------------ | --------------------------------------------------------- |
| `IndexPage.vue`   | `/`          | **Contém a lista de cobranças** (deverá ser simplificada) |
| `ChargesPage.vue` | `/cobrancas` | **Vazio** (`<q-page></q-page>`) — será implementada       |

### 2.2 Stores

- `cobranca-store.ts`: carrega cobranças, gera automático, baixa, extras (cache), **faltam: estornar, atualizar cobrança, atualizar/remover extra**
- `config-store.ts`: ajustes globais (valor mensalidade, dia vencimento)
- `cliente-store.ts`: clientes

### 2.3 Repositories

- `cobranca-repository.ts`: candidatos, findByCompetencia, batch insert, atualizar status, adicionar extra, buscar extras
- **Faltam**: estornar, atualizar cobrança, atualizar extra, remover extra, query com soma de extras

### 2.4 Componentes

- `CobrancaExtraModal.vue`: modal para **adicionar** extras — **precisa ganhar editar/excluir**
- UI components: `ClButton`, `ClDialog`, `ClFormField`, `ClDateField`, `ClMoneyField`, `ClAvatar`, `ClBadge`, `ClPageCard`, `ClPageHeader`, `ClEmptyState`, `ClLoadingState`

---

## 3. Plano de Implementação

### 3.1 IndexPage.vue — Simplificar

**Remover:**

- Lista de cobranças (`cobrancasFiltradas`, `<div class="charges-list">`)
- Modal de extras (`CobrancaExtraModal`, `modalAberto`, `cobrancaSelecionada`)
- Função `baixarCobranca`
- Imports relacionados

**Manter:**

- Header com navegação de competência (`competenciaAnterior`/`Proxima`)
- Cards de resumo (Pendentes/Pagos — contagem e total)
- `verificarEGerarCobrancasDoMes()` no `onMounted` (gera cobranças do mês automaticamente)
- Texto indicativo: "Acesse a aba **Cobranças** para gerenciar"

### 3.2 ChargesPage.vue — Implementar Completa

#### Layout

```vue
<template>
  <q-page class="page">
    <ClPageHeader title="Cobranças">
      <template #actions>
        <ClFormField
          v-model="search"
          placeholder="Buscar aluno..."
          type="search"
          prependIcon="search"
          class="search-field"
        />
      </template>
    </ClPageHeader>

    <div class="page-content">
      <!-- Competência + Filtro Status -->
      <div class="charges-toolbar">
        <div class="competence-nav">...</div>
        <div class="status-filter">...</div>
      </div>

      <!-- Resumo -->
      <div class="charges-summary">...</div>

      <!-- Loading / Empty / Lista -->
      <ClLoadingState v-if="loading" />
      <ClEmptyState v-else-if="filtered.length === 0" ... />
      <div v-else class="charges-list" role="list">
        <transition-group name="list" tag="div" class="list">
          <ChargeCard
            v-for="c in filtered"
            :key="c.id"
            :cobranca="c"
            @baixa="onBaixa"
            @estornar="onEstornar"
            @editar="onEditar"
            @extras="onExtras"
          />
        </transition-group>
      </div>
    </div>

    <!-- Diálogos -->
    <EditarCobrancaDialog v-model="editDialog" :cobranca="editingCobranca" @save="salvarEdicao" />
    <EditarDataPagamentoDialog
      v-model="editDateDialog"
      :cobranca="editingCobranca"
      @save="salvarDataPagamento"
    />
    <ConfirmEstornarDialog
      v-model="estornarDialog"
      :cobranca="estornarCobranca"
      @confirm="confirmarEstornar"
    />
    <CobrancaExtraModal v-model="extraModal" :cobranca-id="extraCobrancaId" ... />
  </q-page>
</template>
```

#### Componentes Internos (ou inline)

- **ChargeCard**: card de uma cobrança (avatar, nome, telefone, mensalidade, extras, total, vencimento, badge status, ações)
- **EditarCobrancaDialog**: valor + vencimento
- **EditarDataPagamentoDialog**: data_pagamento (apenas para cobranças pagas)
- **ConfirmEstornarDialog**: confirmação antes de estornar

#### Estados da Página

| Estado                     | Componente                         |
| -------------------------- | ---------------------------------- |
| Carregando                 | `ClLoadingState`                   |
| Vazio (sem filtro)         | `ClEmptyState icon="receipt_long"` |
| Sem resultados (com busca) | `ClEmptyState icon="search_off"`   |
| Lista                      | `transition-group` + `ChargeCard`  |

#### Filtros (Computed)

- `competenciaAtual` (string `YYYY-MM`)
- `statusFilter`: `'todos' | 'pendentes' | 'pagos'`
- `search`: string
- `filtered`: cobranças da competência filtradas por status + busca por nome do cliente

#### Resumo (Computed)

- Contagem e total de pendentes/pagos **do filtro atual** (não do mês todo)

### 3.3 CobrancaExtraModal.vue — Aprimorar

**Funcionalidades atuais:** adicionar extra
**Adicionar:**

- Listar extras existentes com:
  - Motivo, valor, data
  - Botão **Editar** (abre pequeno form inline ou dialog) → `store.atualizarExtra(id, motivo, valor)`
  - Botão **Excluir** (confirma → `store.removerExtra(id)`)
- Manter formulário de adição

### 3.4 cobranca-store.ts — Novos Métodos

```typescript
// Estornar pagamento (volta a pendente)
async function estornarBaixa(id: number) { ... }

// Atualizar campos da cobrança (valor_mensalidade, vencimento, data_pagamento)
async function atualizarCobranca(id: number, dados: Partial<Pick<Cobranca, 'valor_mensalidade' | 'vencimento' | 'data_pagamento'>>) { ... }

// Atualizar extra
async function atualizarExtra(id: number, motivo: string, valor: number) { ... }

// Remover extra
async function removerExtra(id: number) { ... }

// Carregar com soma de extras (otimizado)
async function carregarCobrancasComExtras(competencia: string) { ... }
```

### 3.5 cobranca-repository.ts — Novos Métodos

```typescript
// Estornar
async estornarPagamento(id: number): Promise<void>

// Atualizar cobrança (campos dinâmicos)
async atualizar(id: number, campos: Partial<Cobranca>): Promise<void>

// Atualizar extra
async atualizarExtra(id: number, motivo: string, valor: number): Promise<void>

// Remover extra
async removerExtra(id: number): Promise<void>

// Query otimizada: cobranças + soma de extras
async findByCompetenciaComExtras(competencia: string): Promise<CobrancaComExtras[]>
```

#### SQL para `findByCompetenciaComExtras`

```sql
SELECT
  c.*,
  COALESCE(SUM(ce.valor), 0) AS total_extras
FROM cobrancas c
LEFT JOIN cobrancas_extras ce ON c.id = ce.id_cobranca
WHERE c.competencia = ?
GROUP BY c.id
ORDER BY c.vencimento
```

Retorna: `Cobranca & { total_extras: number }`

---

## 4. Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        IndexPage                             │
│  onMounted → verificarEGerarCobrancasDoMes()                │
│  → carrega summary cards (pendentes/pagos do mês)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       ChargesPage                            │
│  onMounted / filtro muda → carregarCobrancasComExtras()     │
│  → filtered = cobrancas filtradas por status + busca        │
│  → renderiza ChargeCard[]                                    │
│                                                              │
│  Ações (Baixa/Estornar/Editar/Extras)                       │
│    → store method                                            │
│    → repository (SQLite)                                     │
│    → store recarrega                                         │
│    → página re-renderiza                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes UI Necessários

Todos já existem em `src/components/ui/`:

- `ClPageHeader`, `ClFormField` (search), `ClButton`, `ClDialog`
- `ClDateField`, `ClMoneyField`, `ClFormTextarea`
- `ClAvatar`, `ClBadge`, `ClPageCard`, `ClEmptyState`, `ClLoadingState`

**Nenhum componente novo precisa ser criado** — apenas compor os existentes.

---

## 6. Checklist de Implementação

### Fase 1: Backend (Store + Repository)

- [ ] `cobranca-repository.ts`: `estornarPagamento`, `atualizar`, `atualizarExtra`, `removerExtra`, `findByCompetenciaComExtras`
- [ ] `cobranca-store.ts`: `estornarBaixa`, `atualizarCobranca`, `atualizarExtra`, `removerExtra`, `carregarCobrancasComExtras`

### Fase 2: Componentes de Apoio

- [ ] `CobrancaExtraModal.vue`: adicionar editar/excluir extras
- [ ] Criar `ChargeCard.vue` (ou manter inline no ChargesPage)
- [ ] Criar `EditarCobrancaDialog.vue`
- [ ] Criar `EditarDataPagamentoDialog.vue`
- [ ] Criar `ConfirmEstornarDialog.vue`

### Fase 3: Páginas

- [ ] `IndexPage.vue`: simplificar (remover lista, manter só summary)
- [ ] `ChargesPage.vue`: implementar completa

### Fase 4: Validação

- [ ] `npm run lint`
- [ ] `npm run format`
- [ ] `npx vue-tsc --noEmit`
- [ ] `npm run build`
- [ ] Testar fluxo manual no device/emulador

---

## 7. Decisões de Design (para referência do agente)

| Decisão                                  | Justificativa                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Dois diálogos para editar cobrança       | Separação de responsabilidades; data de pagamento só relevante se já paga |
| Query com soma de extras no repository   | Evita N+1 queries; performance no mobile                                  |
| Cache de extras no store (`extrasCache`) | Mantido; invalidado nas mutações de extras                                |
| Geração automática no IndexPage          | Garante que cobranças existam antes do usuário ir para Cobranças          |
| Sem exclusão de cobrança                 | Preserva histórico; estorno é a ação reversível                           |
| Filtro local (status + busca)            | Dataset pequeno (dezenas de cobranças/mês); performance OK                |

---

## 8. Referências de Código

| Arquivo                                            | Linhas-chave                                              |
| -------------------------------------------------- | --------------------------------------------------------- |
| `src/pages/IndexPage.vue`                          | 1-517 (atual — será simplificado)                         |
| `src/pages/ChargesPage.vue`                        | 1 (vazio — será implementado)                             |
| `src/stores/cobranca-store.ts`                     | 1-130                                                     |
| `src/database/repositories/cobranca-repository.ts` | 1-110                                                     |
| `src/components/CobrancaExtraModal.vue`            | 1-322                                                     |
| `src/router/routes.ts`                             | 14-18 (rota `/cobrancas`)                                 |
| `docs/database.md`                                 | Schema completo (tabelas `cobrancas`, `cobrancas_extras`) |

---

## 9. Próximos Passos (Pós-Implementação)

- [ ] Geração de PDF/imagem da cobrança (compartilhamento WhatsApp) — _aguardando definição com cliente_
- [ ] Relatório financeiro mensal/anual
- [ ] Backup/restore do banco
- [ ] Reajuste anual automático de mensalidades

---

> **Nota para agente:** Siga os padrões de `ClientsPage.vue` e `AGENTS.md` para estrutura de página, store, repository e componentes. Use apenas CSS Variables (design tokens) e importe UI components do barrel `src/components/ui`.
