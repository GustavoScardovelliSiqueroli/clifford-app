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
      <!-- Toolbar -->
      <div class="charges-toolbar">
        <div class="competence-nav">
          <ClButton
            variant="ghost"
            size="md"
            icon="keyboard_arrow_left"
            @click="competenciaAnterior"
            aria-label="Competência anterior"
          />
          <span class="competence-nav__label">{{ competenciaFormatada }}</span>
          <ClButton
            variant="ghost"
            size="md"
            icon="keyboard_arrow_right"
            @click="competenciaProxima"
            aria-label="Próxima competência"
          />
        </div>

        <div class="status-filter" role="tablist" aria-label="Filtrar por status">
          <ClButton
            v-for="tab in statusTabs"
            :key="tab.value"
            :variant="statusFilter === tab.value ? 'primary' : 'outline'"
            size="sm"
            :label="tab.label"
            @click="statusFilter = tab.value"
            role="tab"
            :aria-selected="statusFilter === tab.value"
          />
        </div>
        <ClButton variant="primary" size="sm" icon="add" label="Nova" @click="abrirNovaCobranca" />
      </div>

      <!-- Summary -->
      <div class="charges-summary" v-if="!cobrancaStore.loading">
        <span class="charges-summary__text">
          <strong>{{ pendentesCount }}</strong> pendente{{ pendentesCount !== 1 ? 's' : '' }} ({{
            formatCurrency(pendentesTotal)
          }}) &middot; <strong>{{ pagosCount }}</strong> pago{{ pagosCount !== 1 ? 's' : '' }} ({{
            formatCurrency(pagosTotal)
          }})
        </span>
      </div>

      <ClLoadingState v-if="cobrancaStore.loading" label="Carregando cobranças..." size="lg" />

      <template v-else>
        <ClEmptyState
          v-if="filtered.length === 0 && !search.trim()"
          icon="receipt_long"
          title="Nenhuma cobrança"
          description="Não há cobranças para esta competência."
        />
        <ClEmptyState
          v-else-if="filtered.length === 0"
          icon="search_off"
          title="Nenhum resultado"
          description="Nenhuma cobrança encontrada para esta busca."
        />

        <div v-else class="charges-list" role="list" aria-label="Lista de cobranças">
          <transition-group name="list" tag="div" class="list">
            <div
              v-for="cobranca in filtered"
              :key="cobranca.id as number"
              class="charge-card"
              role="listitem"
            >
              <!-- Main info -->
              <div class="charge-card__main">
                <ClAvatar
                  :name="cobranca.nome"
                  size="md"
                  shape="circle"
                  :color="cobranca.data_pagamento ? 'positive' : 'warning'"
                />
                <div class="charge-card__info">
                  <h3 class="charge-card__name">{{ cobranca.nome }}</h3>
                  <p class="charge-card__phone">{{ cobranca.telefone }}</p>
                </div>
              </div>

              <!-- Values -->
              <div class="charge-card__values">
                <div class="charge-card__row">
                  <span class="charge-card__label">Mensalidade</span>
                  <span class="charge-card__value">{{
                    formatCurrency(cobranca.valor_mensalidade)
                  }}</span>
                </div>
                <div v-if="(cobranca.total_extras ?? 0) > 0" class="charge-card__row">
                  <span class="charge-card__label">Extras</span>
                  <span class="charge-card__value charge-card__value--extra"
                    >+{{ formatCurrency(cobranca.total_extras ?? 0) }}</span
                  >
                </div>
                <div class="charge-card__row charge-card__row--total">
                  <span class="charge-card__label">Total</span>
                  <span class="charge-card__value charge-card__value--total">{{
                    formatCurrency(cobranca.valor_mensalidade + (cobranca.total_extras ?? 0))
                  }}</span>
                </div>
              </div>

              <!-- Due + Status -->
              <div class="charge-card__meta">
                <span class="charge-card__due"
                  >Venc {{ formatDate(cobranca.vencimento) }} (dia útil)</span
                >
                <ClBadge v-if="!cobranca.data_pagamento" variant="warning" size="sm"
                  >Pendente</ClBadge
                >
                <ClBadge v-else variant="success" size="sm"
                  >Pago {{ formatDate(cobranca.data_pagamento) }}</ClBadge
                >
              </div>

              <!-- Actions -->
              <div class="charge-card__actions">
                <ClButton
                  v-if="!cobranca.data_pagamento"
                  variant="success"
                  size="sm"
                  label="Baixa"
                  @click="baixarCobranca(cobranca.id as number)"
                />
                <ClButton
                  v-else
                  variant="ghost"
                  size="sm"
                  icon="undo"
                  label="Estornar"
                  @click="abrirEstornar(cobranca)"
                />
                <ClButton
                  variant="ghost"
                  size="sm"
                  icon="add_circle_outline"
                  label="Extras"
                  @click="abrirExtras(cobranca)"
                />
                <ClButton
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  aria-label="Editar cobrança"
                  @click="abrirEditar(cobranca)"
                />
                <ClButton
                  variant="ghost"
                  size="sm"
                  icon="share"
                  label="Compartilhar"
                  :loading="gerando"
                  @click="handleCompartilhar(cobranca)"
                />
                <ClButton
                  v-if="!cobranca.data_pagamento"
                  variant="ghost"
                  size="sm"
                  icon="delete_outline"
                  class="btn-delete"
                  aria-label="Excluir cobrança"
                  @click="abrirExcluirCobranca(cobranca)"
                />
              </div>
            </div>
          </transition-group>
        </div>
      </template>
    </div>

    <!-- Dialog: Nova Cobrança -->
    <ClDialog v-model="novaDialog" title="Nova cobrança" show-footer="auto">
      <form id="nova-form" @submit.prevent="criarNovaCobranca" class="edit-form">
        <label class="select-label">Cliente</label>
        <select v-model="novaForm.cliente_id" class="cl-select" required>
          <option value="" disabled selected>Selecione um cliente</option>
          <option v-for="c in clientesOrdenados" :key="c.id" :value="c.id">
            {{ c.nome }}{{ !c.ativo ? ' (Inativo)' : '' }}
          </option>
        </select>
        <ClMoneyField
          v-model="novaForm.valor_mensalidade"
          label="Valor"
          :min="0"
          :step="0.01"
          required
        />
        <ClDateField v-model="novaForm.vencimento" label="Vencimento" required />
      </form>
      <template #footer>
        <ClButton variant="ghost" @click="novaDialog = false" label="Cancelar"></ClButton>
        <ClButton
          variant="primary"
          type="submit"
          form="nova-form"
          :loading="criando"
          label="Criar"
          size="lg"
        />
      </template>
    </ClDialog>

    <!-- Dialog: Editar valor + vencimento -->
    <ClDialog v-model="editDialog" title="Editar cobrança" show-footer="auto">
      <form id="edit-form" @submit.prevent="salvarEdicao" class="edit-form">
        <ClMoneyField
          v-model="editForm.valor_mensalidade"
          label="Valor da mensalidade"
          :min="0"
          :step="0.01"
          required
        />
        <ClDateField v-model="editForm.vencimento" label="Vencimento (dia útil)" required />
        <p v-if="vencimentoNaoUtil" class="warning-text">
          Esta data não é um dia útil. O vencimento será ajustado para o próximo dia útil na geração
          automática.
        </p>
      </form>
      <template #footer>
        <ClButton variant="ghost" @click="editDialog = false" label="Cancelar"></ClButton>
        <ClButton
          variant="primary"
          type="submit"
          form="edit-form"
          :loading="salvando"
          label="Salvar"
          size="lg"
        />
      </template>
    </ClDialog>

    <!-- Dialog: Editar data de pagamento -->
    <ClDialog v-model="editDateDialog" title="Editar data de pagamento" show-footer="auto">
      <form id="edit-date-form" @submit.prevent="salvarDataPagamento" class="edit-form">
        <ClDateField v-model="editDateForm.data_pagamento" label="Data de pagamento" required />
      </form>
      <template #footer>
        <ClButton variant="ghost" @click="editDateDialog = false" label="Cancelar"></ClButton>
        <ClButton
          variant="primary"
          type="submit"
          form="edit-date-form"
          :loading="salvandoData"
          label="Salvar"
          size="lg"
        />
      </template>
    </ClDialog>

    <!-- Dialog: Confirmar estorno -->
    <ClDialog v-model="estornarDialog" title="Estornar pagamento" show-footer="auto">
      <p>
        Tem certeza que deseja estornar o pagamento de <strong>{{ estornarCobranca?.nome }}</strong
        >?
      </p>
      <p class="text-tertiary">A cobrança voltará ao status <strong>Pendente</strong>.</p>
      <template #footer>
        <ClButton variant="ghost" @click="estornarDialog = false" label="Cancelar"></ClButton>
        <ClButton
          variant="destructive"
          :loading="estornando"
          @click="confirmarEstornar"
          label="Estornar"
        ></ClButton>
      </template>
    </ClDialog>

    <!-- Dialog: Cobranças Extras -->
    <CobrancaExtraModal
      v-model="extraModal"
      :cobranca-id="extraCobrancaId"
      :cliente-nome="extraClienteNome"
      :competencia="competenciaAtual"
      @saved="recarregar"
    />

    <!-- Dialog: Confirmar exclusão -->
    <ClDialog v-model="excluirDialog" title="Excluir cobrança" show-footer="auto">
      <p>
        Tem certeza que deseja excluir a cobrança de <strong>{{ excluirCobranca?.nome }}</strong
        >?
      </p>
      <p class="text-tertiary">Esta ação não pode ser desfeita.</p>
      <template #footer>
        <ClButton variant="ghost" @click="excluirDialog = false" label="Cancelar"></ClButton>
        <ClButton
          variant="destructive"
          :loading="excluindo"
          @click="confirmarExcluirCobranca"
          label="Excluir"
        ></ClButton>
      </template>
    </ClDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import { useClientesStore } from 'src/stores/cliente-store';
import type { CobrancaComExtras } from 'src/database/repositories/cobranca-repository';
import {
  ClPageHeader,
  ClButton,
  ClDialog,
  ClFormField,
  ClDateField,
  ClMoneyField,
  ClAvatar,
  ClBadge,
  ClEmptyState,
  ClLoadingState,
} from 'src/components/ui';
import CobrancaExtraModal from 'src/components/CobrancaExtraModal.vue';
import { useCompartilharCobranca } from 'src/composables/useCompartilharCobranca';
import { isDiaUtil } from 'src/utils/business-days';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
};

const $q = useQuasar();
const cobrancaStore = useCobrancaStore();
const clienteStore = useClientesStore();

const { compartilhar, gerando } = useCompartilharCobranca();

// Competência
const competenciaAtual = ref<string>('');

const competenciaFormatada = computed(() => {
  if (!competenciaAtual.value) return '';
  const [ano, mes] = competenciaAtual.value.split('-');
  return `${mes}/${ano}`;
});

const competenciaAnterior = () => {
  if (!competenciaAtual.value) return;
  const parts = competenciaAtual.value.split('-').map(Number);
  const ano = parts[0] ?? 0;
  const mes = parts[1] ?? 1;
  let novaMes = mes - 1;
  let novoAno = ano;
  if (novaMes < 1) {
    novaMes = 12;
    novoAno--;
  }
  competenciaAtual.value = `${novoAno}-${novaMes.toString().padStart(2, '0')}`;
};

const competenciaProxima = () => {
  if (!competenciaAtual.value) return;
  const parts = competenciaAtual.value.split('-').map(Number);
  const ano = parts[0] ?? 0;
  const mes = parts[1] ?? 1;
  let novaMes = mes + 1;
  let novoAno = ano;
  if (novaMes > 12) {
    novaMes = 1;
    novoAno++;
  }
  competenciaAtual.value = `${novoAno}-${novaMes.toString().padStart(2, '0')}`;
};

watch(competenciaAtual, async (nova) => {
  if (nova) {
    await cobrancaStore.carregarCobrancas(nova);
  }
});

// Filtros
const search = ref('');
const statusFilter = ref<'todos' | 'pendentes' | 'pagos'>('todos');

const statusTabs = [
  { label: 'Todos', value: 'todos' as const },
  { label: 'Pendentes', value: 'pendentes' as const },
  { label: 'Pagos', value: 'pagos' as const },
];

type CobrancaComCliente = CobrancaComExtras & {
  nome: string;
  telefone: string;
};

const filtered = computed<CobrancaComCliente[]>(() => {
  let lista = cobrancaStore.cobrancasMensais;

  if (statusFilter.value === 'pendentes') {
    lista = lista.filter((c) => !c.data_pagamento);
  } else if (statusFilter.value === 'pagos') {
    lista = lista.filter((c) => c.data_pagamento);
  }

  const termo = search.value.toLowerCase().trim();
  if (termo) {
    const clientes = clienteStore.clientes;
    return lista
      .map((c) => {
        const cli = clientes.find((cl) => cl.id === c.cliente_id);
        return { ...c, nome: cli?.nome ?? 'Desconhecido', telefone: cli?.telefone ?? '' };
      })
      .filter((c) => c.nome.toLowerCase().includes(termo));
  }

  return lista.map((c) => {
    const cli = clienteStore.clientes.find((cl) => cl.id === c.cliente_id);
    return { ...c, nome: cli?.nome ?? 'Desconhecido', telefone: cli?.telefone ?? '' };
  });
});

// Summary
const pendentesCount = computed(() => filtered.value.filter((c) => !c.data_pagamento).length);
const pagosCount = computed(() => filtered.value.filter((c) => c.data_pagamento).length);
const pendentesTotal = computed(() =>
  filtered.value
    .filter((c) => !c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);
const pagosTotal = computed(() =>
  filtered.value
    .filter((c) => c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);

// Ações
async function baixarCobranca(id: number) {
  try {
    await cobrancaStore.baixarCobranca(id, competenciaAtual.value);
    $q.notify({
      type: 'positive',
      message: 'Cobrança baixada com sucesso!',
      icon: 'check_circle',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao baixar cobrança.',
      icon: 'error',
      progress: true,
    });
  }
}

// Estornar
const estornarDialog = ref(false);
const estornando = ref(false);
const estornarCobranca = ref<CobrancaComCliente | null>(null);

function abrirEstornar(c: CobrancaComCliente) {
  estornarCobranca.value = c;
  estornarDialog.value = true;
}

async function confirmarEstornar() {
  if (!estornarCobranca.value?.id) return;
  estornando.value = true;
  try {
    await cobrancaStore.estornarBaixa(estornarCobranca.value.id, competenciaAtual.value);
    estornarDialog.value = false;
    estornarCobranca.value = null;
    $q.notify({
      type: 'positive',
      message: 'Pagamento estornado com sucesso!',
      icon: 'undo',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao estornar pagamento.',
      icon: 'error',
      progress: true,
    });
  } finally {
    estornando.value = false;
  }
}

// Excluir cobrança
const excluirDialog = ref(false);
const excluindo = ref(false);
const excluirCobranca = ref<CobrancaComCliente | null>(null);

function abrirExcluirCobranca(c: CobrancaComCliente) {
  excluirCobranca.value = c;
  excluirDialog.value = true;
}

async function confirmarExcluirCobranca() {
  if (!excluirCobranca.value?.id) return;
  excluindo.value = true;
  try {
    await cobrancaStore.removerCobranca(excluirCobranca.value.id, competenciaAtual.value);
    excluirDialog.value = false;
    excluirCobranca.value = null;
    $q.notify({
      type: 'positive',
      message: 'Cobrança excluída.',
      icon: 'check_circle',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao excluir cobrança.',
      icon: 'error',
      progress: true,
    });
  } finally {
    excluindo.value = false;
  }
}

// Editar valor + vencimento
const editDialog = ref(false);
const salvando = ref(false);
const editForm = ref({ valor_mensalidade: 0, vencimento: '' });
const editCobrancaId = ref<number | null>(null);

function abrirEditar(c: CobrancaComCliente) {
  if (c.data_pagamento) {
    abrirEditarPago(c);
    return;
  }
  editCobrancaId.value = c.id as number;
  editForm.value = {
    valor_mensalidade: c.valor_mensalidade,
    vencimento: c.vencimento,
  };
  editDialog.value = true;
}

async function salvarEdicao() {
  if (editCobrancaId.value == null) return;
  salvando.value = true;
  try {
    await cobrancaStore.atualizarCobranca(
      editCobrancaId.value,
      {
        valor_mensalidade: Number(editForm.value.valor_mensalidade),
        vencimento: editForm.value.vencimento,
      },
      competenciaAtual.value,
    );
    editDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Cobrança atualizada com sucesso!',
      icon: 'check_circle',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao atualizar cobrança.',
      icon: 'error',
      progress: true,
    });
  } finally {
    salvando.value = false;
  }
}

const vencimentoNaoUtil = computed(() => {
  if (!editForm.value.vencimento) return false;
  const d = new Date(editForm.value.vencimento + 'T12:00:00');
  return !isNaN(d.getTime()) && !isDiaUtil(d);
});

// Editar data de pagamento (para cobranças pagas)
const editDateDialog = ref(false);
const salvandoData = ref(false);
const editDateForm = ref({ data_pagamento: '' });
const editDateCobrancaId = ref<number | null>(null);

function abrirEditarPago(c: CobrancaComCliente) {
  editDateCobrancaId.value = c.id as number;
  editForm.value = {
    valor_mensalidade: c.valor_mensalidade,
    vencimento: c.vencimento,
  };
  editDateForm.value = {
    data_pagamento: c.data_pagamento ?? '',
  };
  editDateDialog.value = true;
}

async function salvarDataPagamento() {
  if (editDateCobrancaId.value == null) return;
  salvandoData.value = true;
  try {
    await cobrancaStore.atualizarCobranca(
      editDateCobrancaId.value,
      {
        data_pagamento: editDateForm.value.data_pagamento || null,
      },
      competenciaAtual.value,
    );
    editDateDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Data de pagamento atualizada!',
      icon: 'check_circle',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao atualizar data de pagamento.',
      icon: 'error',
      progress: true,
    });
  } finally {
    salvandoData.value = false;
  }
}

// Nova cobrança manual
const novaDialog = ref(false);
const criando = ref(false);
const novaForm = ref({ cliente_id: 0, valor_mensalidade: 0, vencimento: '' });

const clientesOrdenados = computed(() =>
  [...clienteStore.clientes].sort((a, b) => a.nome.localeCompare(b.nome)),
);

function abrirNovaCobranca() {
  novaForm.value = { cliente_id: 0, valor_mensalidade: 0, vencimento: '' };
  novaDialog.value = true;
}

async function criarNovaCobranca() {
  if (!novaForm.value.cliente_id || !novaForm.value.vencimento) return;
  criando.value = true;
  try {
    const competencia = novaForm.value.vencimento.slice(0, 7);
    await cobrancaStore.criarCobrancaManual({
      cliente_id: novaForm.value.cliente_id,
      valor_mensalidade: Number(novaForm.value.valor_mensalidade),
      vencimento: novaForm.value.vencimento,
      competencia,
    });
    novaDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Cobrança criada!',
      icon: 'check_circle',
      progress: true,
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao criar cobrança.',
      icon: 'error',
      progress: true,
    });
  } finally {
    criando.value = false;
  }
}

// Extras
const extraModal = ref(false);
const extraCobrancaId = ref(0);
const extraClienteNome = ref('');

function abrirExtras(c: CobrancaComCliente) {
  extraCobrancaId.value = c.id as number;
  extraClienteNome.value = c.nome;
  extraModal.value = true;
}

const recarregar = async () => {
  if (competenciaAtual.value) {
    await cobrancaStore.carregarCobrancas(competenciaAtual.value);
  }
};

async function handleCompartilhar(c: CobrancaComCliente) {
  const extras =
    (c.total_extras ?? 0) > 0 ? await cobrancaStore.carregarExtras(c.id as number) : [];
  try {
    await compartilhar({
      id: c.id as number,
      nome: c.nome,
      telefone: c.telefone,
      valor_mensalidade: c.valor_mensalidade,
      total_extras: c.total_extras ?? 0,
      vencimento: c.vencimento,
      data_pagamento: c.data_pagamento ?? null,
      competencia: c.competencia,
      extras: extras.map((e) => ({ motivo: e.motivo, valor: e.valor })),
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao compartilhar cobrança.',
      icon: 'error',
      progress: true,
    });
  }
}

// Init
onMounted(async () => {
  await clienteStore.carregar();
  await cobrancaStore.verificarEGerarCobrancasDoMes();
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  competenciaAtual.value = cobrancaStore.competenciaAtual || `${ano}-${mes}`;
  await cobrancaStore.carregarCobrancas(competenciaAtual.value);
});
</script>

<style scoped lang="scss">
.page {
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom));
}

.search-field {
  width: 100%;
  max-width: 320px;
}

.page-content {
  padding: var(--spacing-4) var(--spacing-6);
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-6) var(--spacing-8);
    padding-bottom: calc(var(--spacing-6) + var(--tab-bar-height));
  }
}

.charges-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);

  @media (min-width: 600px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.competence-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.competence-nav__label {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  min-width: 80px;
  text-align: center;
}

.status-filter {
  display: flex;
  gap: var(--spacing-2);
}

.charges-summary {
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
}

.charges-summary__text {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.charges-list .list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.charge-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
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
      box-shadow: var(--shadow-xs);
      transform: scale(0.99);
    }
  }
}

.charge-card__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.charge-card__info {
  flex: 1;
  min-width: 0;
}

.charge-card__name {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.charge-card__phone {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

.charge-card__values {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2) 0;
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
}

.charge-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.charge-card__row--total {
  margin-top: var(--spacing-1);
  padding-top: var(--spacing-1);
  border-top: 1px dashed var(--color-border-medium);
}

.charge-card__label {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.charge-card__value {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.charge-card__value--extra {
  color: var(--color-primary);
}

.charge-card__value--total {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.charge-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.charge-card__due {
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
}

.charge-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.charge-card__actions .btn-delete {
  color: var(--color-negative);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.select-label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: calc(-1 * var(--spacing-3));
}

.cl-select {
  width: 100%;
  height: var(--input-height-md);
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-body);
  font-family: var(--font-family-base);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-input);
  outline: none;
  appearance: auto;

  &:focus {
    border-color: var(--color-border-focus);
  }

  &:invalid {
    color: var(--color-text-tertiary);
  }
}

.text-tertiary {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-sm);
}

.warning-text {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-primary);
  line-height: var(--line-height-normal);
}

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
</style>
