<template>
  <q-page class="page">
    <ClPageHeader title="Clientes" :subtitle="`${store.clientes.length} cadastrados`">
      <template #actions>
        <ClButton variant="primary" size="md" icon="add" label="Novo" @click="abrirDialogNovo" />
      </template>
    </ClPageHeader>

    <div class="page-content">
      <div class="search-wrapper">
        <ClFormField
          v-model="busca"
          placeholder="Buscar cliente..."
          type="search"
          prependIcon="search"
          :appendIcon="busca ? 'close' : undefined"
          @append:click="busca = ''"
          class="search-field"
        />
      </div>

      <ClLoadingState v-if="store.loading" label="Carregando clientes..." />

      <template v-else>
        <ClEmptyState
          v-if="clientesFiltrados.length === 0"
          :icon="busca ? 'search_off' : 'people_outline'"
          :title="busca ? 'Nenhum resultado' : 'Nenhum cliente ainda'"
          :description="busca ? 'Tente outro termo' : 'Toque em Novo para adicionar'"
        />

        <div v-else role="list" aria-label="Lista de clientes">
          <transition-group name="list" tag="div" class="clients-list">
            <div
              v-for="cliente in clientesFiltrados"
              :key="cliente.id"
              class="client-card"
              role="listitem"
            >
              <div class="client-card__main">
                <ClAvatar :name="cliente.nome" size="md" shape="circle" />

                <div class="client-card__info">
                  <div class="client-card__name-row">
                    <h3 class="client-card__name">{{ cliente.nome }}</h3>
                    <ClBadge v-if="!cliente.ativo" variant="secondary" size="sm"> Inativo </ClBadge>
                  </div>

                  <p class="client-card__phone">
                    <q-icon name="phone" size="12px" class="q-mr-xs" />
                    {{ cliente.telefone || 'Sem telefone' }}
                  </p>
                </div>
              </div>

              <div class="client-card__actions">
                <ClButton
                  variant="ghost"
                  size="md"
                  icon="edit"
                  @click="abrirDialogEditar(cliente)"
                  aria-label="Editar cliente"
                />
                <ClButton
                  variant="ghost"
                  size="md"
                  icon="delete_outline"
                  class="btn-delete"
                  @click="confirmarExclusao(cliente)"
                  aria-label="Excluir cliente"
                />
              </div>
            </div>
          </transition-group>
        </div>
      </template>
    </div>

    <!-- Dialog novo/editar -->
    <ClDialog
      v-model="dialog"
      :title="editando ? 'Editar cliente' : 'Novo cliente'"
      :full-mobile="true"
      show-footer="auto"
    >
      <form @submit.prevent="salvar" class="client-form" id="client-form">
        <div class="form-section">
          <ClFormField
            v-model="form.nome"
            label="Nome"
            placeholder="Nome do cliente"
            :error="erros.nome"
            :required="true"
            autofocus
          />

          <ClFormField
            v-model="form.telefone"
            label="Telefone"
            placeholder="(00) 00000-0000"
            type="tel"
            prependIcon="phone"
          />

          <ClDateField
            v-model="form.birth_date"
            label="Data de nascimento"
            placeholder="DD/MM/AAAA"
            :max="hojeISO"
          />

          <ClDateField
            v-model="form.created_at"
            label="Data de registro"
            placeholder="DD/MM/AAAA"
            :max="hojeISO"
          />

          <ClFormTextarea
            v-model="form.obs"
            label="Observações"
            placeholder="Observações opcionais"
            :rows="3"
          />
        </div>

        <div class="mensalidade-config__header">
          <h4 class="mensalidade-config__title">Configuração de Mensalidade</h4>
          <p class="mensalidade-config__subtitle">Deixe em branco para usar os valores globais</p>
        </div>

        <ClMoneyField
          v-model="form.mensalidade_valor"
          label="Valor da mensalidade"
          placeholder="0,00"
          :min="0"
          :max="999999.99"
          :step="0.01"
          :error="erros.mensalidade_valor"
          @update:model-value="erros.mensalidade_valor = ''"
        />

        <ClFormField
          v-model="form.mensalidade_dia_vencimento"
          label="Dia de vencimento"
          placeholder="Ex: 5"
          type="number"
          :min="1"
          :max="31"
          :error="erros.mensalidade_dia_vencimento"
          @update:model-value="erros.mensalidade_dia_vencimento = ''"
          inputmode="numeric"
        >
          <template #prepend>
            <q-icon name="calendar_today" size="18px" color="grey-5" />
          </template>
        </ClFormField>

        <div class="mensalidade-config__toggle">
          <div>
            <p class="mensalidade-config__toggle-label">Cliente ativo</p>
            <p class="mensalidade-config__toggle-hint">Desative para não gerar cobrança</p>
          </div>
          <q-toggle v-model="form.ativo" color="primary" keep-color />
        </div>
      </form>

      <template #footer>
        <div class="dialog-footer">
          <ClButton variant="ghost" @click="dialog = false" label="Cancelar"></ClButton>
          <ClButton
            variant="primary"
            :label="editando ? 'Salvar' : 'Adicionar'"
            type="submit"
            form="client-form"
            :loading="salvando"
            size="lg"
          />
        </div>
      </template>
    </ClDialog>

    <!-- Dialog confirmar exclusão -->
    <ClDialog v-model="dialogExclusao" title="Excluir cliente" show-footer="auto">
      <p class="dialog-message">
        Tem certeza que deseja excluir <strong>{{ clienteSelecionado?.nome }}</strong
        >?
      </p>

      <template #footer>
        <div class="dialog-footer">
          <ClButton variant="ghost" @click="dialogExclusao = false" label="Cancelar"></ClButton>
          <ClButton variant="destructive" label="Excluir" :loading="excluindo" @click="excluir" />
        </div>
      </template>
    </ClDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClientesStore } from 'src/stores/cliente-store';
import type { Cliente } from 'src/database/repositories/cliente-repository';
import { date } from 'quasar';
import {
  ClPageHeader,
  ClButton,
  ClDialog,
  ClEmptyState,
  ClLoadingState,
  ClAvatar,
  ClBadge,
  ClFormField,
  ClFormTextarea,
  ClDateField,
  ClMoneyField,
} from 'src/components/ui';

const store = useClientesStore();

// Search
const busca = ref('');
const clientesFiltrados = computed(() => {
  if (!busca.value.trim()) return store.clientes;
  const termo = busca.value.toLowerCase();
  return store.clientes.filter(
    (c) => c.nome.toLowerCase().includes(termo) || c.telefone?.toLowerCase().includes(termo),
  );
});

// Form dialog
const dialog = ref(false);
const editando = ref(false);
const salvando = ref(false);
const clienteSelecionado = ref<Cliente | null>(null);
const form = ref({
  nome: '',
  telefone: '',
  birth_date: '',
  created_at: date.formatDate(new Date(), 'YYYY-MM-DD'),
  obs: '',
  ativo: true,
  mensalidade_valor: 0,
  mensalidade_dia_vencimento: '',
});
const erros = ref({ nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' });

const hojeISO = date.formatDate(new Date(), 'YYYY-MM-DD');

function abrirDialogNovo() {
  editando.value = false;
  form.value = {
    nome: '',
    telefone: '',
    birth_date: '',
    created_at: date.formatDate(new Date(), 'YYYY-MM-DD'),
    obs: '',
    ativo: true,
    mensalidade_valor: 0,
    mensalidade_dia_vencimento: '',
  };
  erros.value = { nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' };
  dialog.value = true;
}

function abrirDialogEditar(cliente: Cliente) {
  editando.value = true;
  clienteSelecionado.value = cliente;
  form.value = {
    nome: cliente.nome,
    telefone: cliente.telefone ?? '',
    birth_date: cliente.birth_date ?? '',
    created_at: cliente.created_at ?? '',
    obs: cliente.obs ?? '',
    ativo: cliente.ativo === 1,
    mensalidade_valor:
      cliente.mensalidade_config?.valor != null ? Number(cliente.mensalidade_config.valor) : 0,
    mensalidade_dia_vencimento:
      cliente.mensalidade_config?.dia_vencimento != null
        ? String(cliente.mensalidade_config.dia_vencimento)
        : '',
  };
  erros.value = { nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' };
  dialog.value = true;
}

async function salvar() {
  if (!form.value.nome.trim()) {
    erros.value.nome = 'Nome é obrigatório';
    return;
  }

  if (form.value.mensalidade_valor !== 0 && form.value.mensalidade_valor !== null) {
    const valor = Number(form.value.mensalidade_valor);
    if (isNaN(valor) || valor <= 0) {
      erros.value.mensalidade_valor = 'Valor inválido';
      return;
    }
  }
  if (form.value.mensalidade_dia_vencimento !== '') {
    const dia = Number(form.value.mensalidade_dia_vencimento);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      erros.value.mensalidade_dia_vencimento = 'Dia deve estar entre 1 e 31';
      return;
    }
  }

  salvando.value = true;
  try {
    const payload: Omit<Cliente, 'id'> = {
      nome: form.value.nome.trim(),
      telefone: form.value.telefone || '',
      birth_date: form.value.birth_date || '',
      obs: form.value.obs || '',
      ativo: form.value.ativo ? 1 : 0,
      created_at: form.value.created_at || '',
    };

    if (form.value.mensalidade_valor !== 0 || form.value.mensalidade_dia_vencimento !== '') {
      payload.mensalidade_config = {
        cliente_id: 0,
        valor:
          form.value.mensalidade_valor !== 0 ? Number(form.value.mensalidade_valor) : undefined,
        dia_vencimento:
          form.value.mensalidade_dia_vencimento !== ''
            ? Number(form.value.mensalidade_dia_vencimento)
            : undefined,
      };
    }

    if (editando.value && clienteSelecionado.value?.id) {
      await store.atualizar(clienteSelecionado.value.id, payload);
    } else {
      await store.adicionar(payload);
    }
    dialog.value = false;
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    if (error instanceof Error) {
      if (
        error?.message?.includes('UNIQUE constraint failed') ||
        error?.message?.includes('unique')
      ) {
        erros.value.nome = 'Já existe um cliente com esse nome';
        return;
      }
    }
    erros.value.nome = 'Erro ao salvar cliente';
  } finally {
    salvando.value = false;
  }
}

// Delete dialog
const dialogExclusao = ref(false);
const excluindo = ref(false);

function confirmarExclusao(cliente: Cliente) {
  clienteSelecionado.value = cliente;
  dialogExclusao.value = true;
}

async function excluir() {
  if (!clienteSelecionado.value?.id) return;
  excluindo.value = true;
  try {
    await store.remover(clienteSelecionado.value.id);
    dialogExclusao.value = false;
  } finally {
    excluindo.value = false;
  }
}

onMounted(() => void store.carregar());
</script>

<style scoped lang="scss">
.page {
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom));
}

.page-content {
  padding: var(--spacing-4) var(--spacing-6);
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-6) var(--spacing-8);
    padding-bottom: calc(var(--spacing-6) + var(--tab-bar-height));
  }
}

.search-wrapper {
  margin-bottom: var(--spacing-6);
}

.search-field {
  max-width: 400px;
}

.clients-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

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

.client-card__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
}

.client-card__info {
  flex: 1;
  min-width: 0;
}

.client-card__name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.client-card__name {
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-card__phone {
  margin: var(--spacing-1) 0 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  line-height: var(--line-height-normal);
}

.client-card__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.btn-delete {
  color: var(--color-negative);

  &:hover {
    background: rgba(var(--color-negative-rgb), 0.08);
  }
}

// Form
.client-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-section :deep(.form-field) {
  max-width: 100%;
  box-sizing: border-box;
}

// Mensalidade config
.mensalidade-config {
  padding: 0;
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
}

.mensalidade-config__header {
  margin: 0 0 var(--spacing-4);
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.mensalidade-config__title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.mensalidade-config__subtitle {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
}

.mensalidade-config__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border-light);
  margin-top: var(--spacing-2);
}

.mensalidade-config__toggle-label {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.mensalidade-config__toggle-hint {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
}

// Dialog
#client-form {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  width: 100%;
}

.dialog-message {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

// List transition
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
