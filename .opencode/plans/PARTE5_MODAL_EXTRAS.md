# Plano de Execução: Parte 5 - Modal de Cobranças Extras e Detalhes

## Contexto Atual
- **Banco**: Tabelas `cobrancas`, `cobrancas_extras`, `clientes` criadas e funcionando
- **Repositório**: `cobranca-repository.ts` com `adicionarCobrancaExtra()` implementado
- **Store**: `cobranca-store.ts` com `adicionarExtra()` implementado
- **UI**: `IndexPage.vue` lista cobranças com cards por aluno (clicáveis)

---

## Objetivo
Implementar modal que abre ao clicar no card do aluno, permitindo:
1. Ver histórico de extras da cobrança
2. Adicionar novo extra (motivo + valor)
3. Atualização reativa da tela principal

---

## Passos de Implementação

### 5.1 - Extender Repositório (`cobranca-repository.ts`)
**Arquivo**: `src/database/repositories/cobranca-repository.ts`

**Novo método**:
```typescript
async findExtrasByCobranca(idCobranca: number): Promise<CobrancaExtra[]>
```
- Query: `SELECT * FROM cobrancas_extras WHERE id_cobranca = ? ORDER BY id DESC`
- Retornar array de `CobrancaExtra`

---

### 5.2 - Extender Store (`cobranca-store.ts`)
**Arquivo**: `src/stores/cobranca-store.ts`

**Novos elementos**:
```typescript
// Estado
const extrasCache = ref<Record<number, CobrancaExtra[]>>({})

// Actions
async carregarExtras(idCobranca: number): Promise<CobrancaExtra[]>
async adicionarExtra(idCobranca: number, motivo: string, valor: number): Promise<void>
  // Já existe, mas deve invalidar/atualizar cache de extras
```

**Comportamento**:
- `carregarExtras`: busca no repo, armazena em `extrasCache[idCobranca]`, retorna
- `adicionarExtra`: chama repo, limpa cache do id, recarrega lista principal (`carregarCobrancas`)

---

### 5.3 - Componente Modal (`CobrancaExtraModal.vue`)
**Arquivo**: `src/components/CobrancaExtraModal.vue`

**Props**:
```typescript
interface Props {
  modelValue: boolean      // v-model para abrir/fechar
  cobrancaId: number       // ID da cobrança atual
  clienteNome: string      // Para título
  competencia: string      // Para contexto
}
```

**Emits**:
- `update:modelValue` (boolean)
- `saved` (opcional, para notificar parent)

**Estrutura do Template**:
```html
<QDialog v-model="modelValue" persistent @update:modelValue="$emit('update:modelValue', $event)">
  <QCard style="min-width: 90vw; max-width: 500px">
    <!-- Header -->
    <QCardSection class="row items-center justify-between">
      <div>
        <div class="text-h6">{{ clienteNome }}</div>
        <div class="text-caption text-grey-6">Competência: {{ competenciaFormatada }}</div>
      </div>
      <QBtn flat round icon="close" @click="fechar" />
    </QCardSection>

    <QSeparator />

    <!-- Lista de extras existentes -->
    <QCardSection class="q-pt-none">
      <div v-if="extras.length === 0" class="text-center q-py-md text-grey-6">
        Nenhum extra cadastrado
      </div>
      <QList dense separator v-else>
        <QItem v-for="extra in extras" :key="extra.id">
          <QItemSection>
            <div class="text-body1">{{ extra.motivo }}</div>
            <div class="text-caption text-grey-6">Adicionado em {{ extra.created_at }}</div>
          </QItemSection>
          <QItemSection side top>
            <div class="text-h6 text-primary">{{ extra.valor | moeda }}</div>
          </QItemSection>
        </QItem>
      </QList>
    </QCardSection>

    <!-- Total extras -->
    <QCardSection class="row justify-end q-gutter-sm bg-grey-1">
      <div class="text-subtitle1">Total extras:</div>
      <div class="text-h6 text-primary">{{ totalExtras | moeda }}</div>
    </QCardSection>

    <QSeparator />

    <!-- Formulário novo extra -->
    <QCardSection>
      <QForm @submit="salvarExtra">
        <QInput
          v-model="novoExtra.motivo"
          label="Motivo"
          placeholder="Ex: Tela nova, Tintas extras, Material complementar"
          :rules="[val => !!val || 'Motivo é obrigatório']"
          dense
        />
        <QInput
          v-model="novoExtra.valor"
          type="number"
          label="Valor (R$)"
          placeholder="0,00"
          :rules="[val => val && val > 0 || 'Valor deve ser maior que zero']"
          dense
          prefix="R$ "
        />
        <div class="row justify-end q-mt-md">
          <QBtn label="Cancelar" flat @click="fechar" />
          <QBtn label="Adicionar" color="primary" type="submit" :loading="salvando" />
        </div>
      </QForm>
    </QCardSection>
  </QCard>
</QDialog>
```

**Script (setup)**:
```typescript
const props = defineProps({...})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useCobrancaStore()
const extras = ref<CobrancaExtra[]>([])
const salvando = ref(false)

const novoExtra = ref({ motivo: '', valor: 0 })

const totalExtras = computed(() => 
  extras.value.reduce((sum, e) => sum + e.valor, 0)
)

const competenciaFormatada = computed(() => 
  props.competencia ? props.competencia.split('-').reverse().join('/') : ''
)

const fechar = () => {
  resetForm()
  emit('update:modelValue', false)
}

const resetForm = () => {
  novoExtra.value = { motivo: '', valor: 0 }
}

const carregar = async () => {
  extras.value = await store.carregarExtras(props.cobrancaId)
}

const salvarExtra = async () => {
  salvando.value = true
  try {
    await store.adicionarExtra(props.cobrancaId, novoExtra.value.motivo, novoExtra.value.valor)
    resetForm()
    await carregar()
    emit('saved') // opcional
  } catch (e) {
    // Toast error
  } finally {
    salvando.value = false
  }
}

// Carregar ao abrir
watch(() => props.modelValue, (open) => {
  if (open) carregar()
})
```

---

### 5.4 - Integrar na IndexPage (`IndexPage.vue`)
**Arquivo**: `src/pages/IndexPage.vue`

**Mudanças**:
1. Importar `CobrancaExtraModal`
2. Estado local: `modalAberto`, `cobrancaSelecionada`
3. No template do card (`q-item`), adicionar `@click="abrirModal(cobranca)"`
4. Adicionar modal no final do template

**Código**:
```typescript
// Estado
const modalAberto = ref(false)
const cobrancaSelecionada = ref<typeof cobrancasFiltradas.value[0] | null>(null)

const abrirModal = (cobranca: any) => {
  cobrancaSelecionada.value = cobranca
  modalAberto.value = true
}
```

**Template**:
```html
<!-- No q-item existente -->
<q-item 
  v-for="cobranca in cobrancasFiltradas" 
  :key="cobranca.id as number" 
  class="q-py-sm"
  @click="abrirModal(cobranca)"
  style="cursor: pointer"
>
  <!-- ... conteúdo existente ... -->
</q-item>

<!-- Modal no final -->
<CobrancaExtraModal
  v-model="modalAberto"
  :cobranca-id="cobrancaSelecionada?.id"
  :cliente-nome="cobrancaSelecionada?.nome ?? ''"
  :competencia="competenciaAtual"
  @saved="carregarCobrancas"
/>
```

---

### 5.5 - Ajustes de Tipos e Validações

**Interface CobrancaExtra** (já existe no repo):
```typescript
export interface CobrancaExtra {
  id?: number
  id_cobranca: number
  motivo: string
  valor: number
  created_at?: string  // Adicionar se não existir
}
```

**Nota**: A tabela `cobrancas_extras` não tem `created_at`. 
- **Opção A**: Adicionar coluna via migration (recomendado para auditoria)
- **Opção B**: Usar `id` como proxy de ordem (já é AUTOINCREMENT)

**Recomendo Opção A** - adicionar `created_at TEXT DEFAULT CURRENT_TIMESTAMP` na migration.

---

## Ordem de Execução

| Ordem | Tarefa | Arquivo |
|-------|--------|---------|
| 1 | Adicionar `created_at` em `cobrancas_extras` | `migrations.ts` |
| 2 | Adicionar `findExtrasByCobranca` | `cobranca-repository.ts` |
| 3 | Estender store com cache e `carregarExtras` | `cobranca-store.ts` |
| 4 | Criar componente `CobrancaExtraModal.vue` | `src/components/` |
| 5 | Integrar modal na `IndexPage.vue` | `IndexPage.vue` |
| 6 | Testar fluxo completo | - |

---

## Validações e UX

| Regra | Implementação |
|-------|---------------|
| Motivo obrigatório | `required` + rule no QInput |
| Valor > 0 | `type="number"` + rule customizada |
| Feedback visual | QDialog persistent, loading no botão |
| Fechar modal | Click fora (persistent=false) ou botão X |
| Atualização reativa | `emit('saved')` → `carregarCobrancas()` no parent |

---

## Considerações Técnicas

1. **Performance**: Cache de extras por `cobrancaId` evita queries repetidas
2. **Reatividade**: Store centraliza estado; componentes só consomem
3. **Separação**: Modal é componente reutilizável, não acoplado à página
4. **Tipagem**: TypeScript estrito em todos os novos métodos

---

## Próximos Passos Após Parte 5

- Testes manuais no dispositivo/emulador
- Ajustes de UX baseados em feedback
- Parte 6+: Relatórios, backup, configurações (conforme roadmap)