# Plano de Melhorias no Design System - Clifford App

## Visão Geral
Melhorar a usabilidade e qualidade visual dos componentes para um usuário de ~60 anos com pouca familiaridade tecnológica. Foco: touch targets maiores, inputs visíveis, datas nativas, dinheiro formatado.

---

## Decisões Técnicas Validadas

| Item | Decisão |
|------|---------|
| Date input | `<input type="date">` nativo (mobile-first, teclado nativo Android) |
| Money mask | Biblioteca `vue-currency-mask` (mais robusta, ~3kb gz) |
| Touch target | 44px (Material Design padrão) para botões `sm` |
| Escopo | Implementação completa: tokens → componentes novos → migração páginas |

---

## 1. Atualizar Design Tokens

### Arquivos
- `src/css/design-tokens.scss`
- `src/css/quasar.variables.scss`

### Mudanças
```scss
// Contraste de borda inputs
$color-border-light: #d0d0d0;  // era #ebebeb
$color-border-medium: #bdbdbd; // era #e0e0e0

// Touch targets
$button-height-sm: 44px;       // era 32px
$button-height-md: 48px;       // era 40px
$button-height-lg: 52px;       // era 48px
$button-height-xl: 56px;       // era 56px

// Input heights
$input-height-sm: 40px;
$input-height-md: 48px;        // era 44px
$input-height-lg: 52px;

// Money input específico
$money-input-min-width: 140px;
$money-input-padding-inline: 16px;

// Sincronizar CSS custom properties em :root (app.scss)
```

---

## 2. Melhorar ClButton (`src/components/ui/ClButton.vue`)

### Mudanças
- [ ] Aumentar `height` de todos os tamanhos (sm=44px, md=48px, lg=52px, xl=56px)
- [ ] Corrigir `.btn--icon-only`: remover `padding: 0 !important`, usar `padding: 0 12px` (sm) / `0 16px` (md+)
- [ ] `width: auto` para icon-only (não quadrado forçado), `min-width: height`
- [ ] Melhorar estado `:active` no mobile para variant `ghost`: background visível
- [ ] Adicionar `aria-pressed` para toggle buttons se necessário

### Tokens CSS afetados
```scss
--button-height-sm: 44px;
--button-height-md: 48px;
--button-height-lg: 52px;
--button-height-xl: 56px;
--button-padding-sm: 0 12px;
--button-padding-md: 0 16px;
--button-padding-lg: 0 20px;
--button-padding-xl: 0 24px;
```

---

## 3. Melhorar ClFormField (`src/components/ui/ClFormField.vue`)

### Mudanças
- [ ] Borda padrão: `var(--color-border-medium)` (#d0d0d0)
- [ ] Focus ring: `0 0 0 4px rgba(var(--color-primary), 0.2)` (era 3px, 0.15)
- [ ] **Prepend/Append**: remover background cinza, usar background branco + apenas border-right/left separator
- [ ] Adicionar prop `inputmode` (text, decimal, numeric, tel, email, url)
- [ ] Adicionar prop `autocomplete` para passwords/emails
- [ ] Label flutuante opcional (mantém atual como default)
- [ ] Error state: shake animation sutil no input

### Tokens CSS
```scss
--input-height-md: 48px;
--input-padding: 0 16px;
--border-radius-input: 12px;
```

---

## 4. Criar ClMoneyField (`src/components/ui/ClMoneyField.vue`) - NOVO

### Props
```typescript
interface Props {
  modelValue: number;           // valor em centavos (integer) ou reais (number)
  label?: string;
  placeholder?: string;         // default: "0,00"
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  min?: number;                 // em reais
  max?: number;
  step?: number;                // default: 0.01
  currency?: string;            // default: 'BRL'
  locale?: string;              // default: 'pt-BR'
}
```

### Emits
```typescript
interface Emits {
  'update:modelValue': [value: number];  // sempre number (reais com 2 decimais)
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}
```

### Implementação
- [ ] Usar `vue-currency-mask` (instalar: `npm i vue-currency-mask@next`)
- [ ] Wrapper sobre `ClFormField` com `type="text"`, `inputmode="decimal"`
- [ ] Máscara: `R$ #.##0,00` (prefixo R$, separador milhar ., decimal ,)
- [ ] Parsing: remove máscara, converte para number (reais)
- [ ] Validação min/max/step no blur
- [ ] `autocomplete="off"` para evitar preenchimento automático
- [ ] Largura mínima responsiva: `min-width: var(--money-input-min-width)` + `width: 100%` max

### Exemplo de uso
```vue
<ClMoneyField
  v-model="form.valor_mensalidade"
  label="Valor da mensalidade"
  placeholder="0,00"
  :min="0"
  :max="10000"
  :step="0.01"
/>
```

---

## 5. Criar ClDateField (`src/components/ui/ClDateField.vue`) - NOVO

### Props
```typescript
interface Props {
  modelValue: string;           // formato YYYY-MM-DD (ISO)
  label?: string;
  placeholder?: string;         // default: "DD/MM/AAAA"
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  min?: string;                 // YYYY-MM-DD
  max?: string;                 // YYYY-MM-DD
  showWeekNumbers?: boolean;    // default: false
  firstDayOfWeek?: 0 | 1 | 6;   // default: 0 (domingo)
}
```

### Emits
```typescript
interface Emits {
  'update:modelValue': [value: string];  // YYYY-MM-DD
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}
```

### Implementação
- [ ] `<input type="date">` nativo (mobile: teclado nativo date picker)
- [ ] Desktop: manter `type="date"` (Chrome/Edge/Firefox têm picker nativo)
- [ ] Formatação exibição: `DD/MM/AAAA` via `toLocaleDateString('pt-BR')`
- [ ] Armazenamento: `YYYY-MM-DD` (ISO)
- [ ] Fallback Safari: detectar `!HTMLInputElement.prototype.showPicker` → usar `q-date` + popup
- [ ] Props `min`/`max` passadas direto pro input nativo
- [ ] `readonly`: usa `ClFormField` com `prependIcon="event"` + display formatado

### Exemplo de uso
```vue
<ClDateField
  v-model="form.birth_date"
  label="Data de nascimento"
  placeholder="DD/MM/AAAA"
  :max="hojeISO"
/>
```

---

## 6. Migrar Páginas Existentes

### ClientsPage.vue
- [ ] `dataNascimentoFormatada` + `q-popup-proxy` + `q-date` → `ClDateField`
- [ ] `dataRegistroFormatada` + `q-popup-proxy` + `q-date` → `ClDateField`
- [ ] `mensalidade_valor` (prepend R$ + append ícone) → `ClMoneyField`
- [ ] `mensalidade_dia_vencimento` → `ClFormField type="number" min="1" max="31"`
- [ ] Botões editar/excluir: `size="sm"` → `size="md"` (touch target 48px)

### ConfigPage.vue
- [ ] `valor_mensalidade` (type=number + prepend R$) → `ClMoneyField`
- [ ] `dia_vencimento` → `ClFormField type="number" min="1" max="31"`
- [ ] Botão "Salvar": `size="lg"` (mais destaque)

### CobrancaExtraModal.vue
- [ ] Substituir `q-input` motivo → `ClFormField`
- [ ] Substituir `q-input` valor (type=number + prefix R$) → `ClMoneyField`
- [ ] Botões: `q-btn flat/unelevated` → `ClButton variant="ghost/primary"`
- [ ] Remover dependência direta do Quasar no template

### IndexPage.vue
- [ ] Botões navegação competência (ghost sm icon-only) → `ClButton variant="ghost" size="md" icon="..."`
- [ ] Botão "Dar Baixa" (success sm) → `ClButton variant="success" size="md" label="Dar Baixa"`

---

## 7. Qualidade de Código

### Testes (Vitest)
- [ ] `ClMoneyField`: formatação, parsing, validação min/max/step, edge cases (paste, delete, arrow keys)
- [ ] `ClDateField`: parsing ISO ↔ display, min/max, Safari fallback
- [ ] `ClButton`: touch targets, variants, sizes, loading/disabled states
- [ ] `ClFormField`: focus/blur, error/hint, prepend/append, clearable

### TypeScript
- [ ] Strict mode: `modelValue` tipado (number no MoneyField, string ISO no DateField)
- [ ] JSDoc nas props/emits/slots dos 2 novos componentes
- [ ] Export types em `src/components/ui/index.ts`

### Acessibilidade
- [ ] `aria-label` nos botões icon-only
- [ ] `aria-describedby` linkando error/hint
- [ ] `role="alert"` no error message
- [ ] `autocomplete` apropriado (off para money, bday para date)
- [ ] Focus visible em todos os estados interativos

### Documentação
- [ ] README.md em `src/components/ui/` com exemplos de uso
- [ ] Storybook stories (opcional, se projeto tiver)

---

## 8. Ordem de Implementação

### Fase 1: Fundação (tokens + componentes base)
1. Atualizar `design-tokens.scss` + `quasar.variables.scss` + `app.scss` (CSS custom properties)
2. Melhorar `ClButton.vue`
3. Melhorar `ClFormField.vue`

### Fase 2: Novos componentes
4. Instalar `vue-currency-mask@next`
5. Criar `ClMoneyField.vue`
6. Criar `ClDateField.vue`
7. Exportar em `src/components/ui/index.ts`

### Fase 3: Migração páginas
8. `ClientsPage.vue`
9. `ConfigPage.vue`
10. `CobrancaExtraModal.vue`
11. `IndexPage.vue`

### Fase 4: Qualidade
12. Testes unitários
13. Verificar lint/typecheck
14. Testes manuais em device Android

---

## Estimativa de Esforço

| Fase | Arquivos | Complexidade |
|------|----------|--------------|
| 1 | 3 tokens + 2 componentes | Média |
| 2 | 1 dep + 2 novos + 1 index | Média-Alta |
| 3 | 4 páginas | Média |
| 4 | Testes + verificação | Baixa-Média |

**Total estimado**: ~16-20 arquivos modificados/criados

---

## Checklist de Validação Pós-Implementação

- [ ] Botões `sm` têm 44px altura (touch target Material)
- [ ] Inputs têm borda visível (#d0d0d0) em fundo branco
- [ ] Campos de data abrem teclado nativo date picker no Android
- [ ] Campos de dinheiro formatam R$ 1.234,56 ao digitar
- [ ] Largura dinheiro não é fixa 120px, é responsiva
- [ ] Focus ring 4px visível em todos inputs/botões
- [ ] Lint passa: `npm run lint`
- [ ] Typecheck passa: `npm run typecheck` (ou `vue-tsc`)
- [ ] Build funciona: `npm run build`
- [ ] Testes passam: `npm run test`