<template>
  <q-page class="clients-page">
    <!-- Header -->
    <div class="page-header q-px-lg q-pt-lg q-pb-md bg-primary">
      <div class="row items-center justify-between">
        <div>
          <div class="page-title">Clientes</div>
          <div class="page-subtitle text-grey-8">{{ store.clientes.length }} cadastrados</div>
        </div>
        <q-btn round unelevated icon="add" class="btn-add" @click="abrirDialogNovo" />
      </div>

      <!-- Search -->
      <q-input
        v-model="busca"
        placeholder="Buscar cliente..."
        outlined
        dense
        class="search-input q-mt-md"
        bg-color="white"
      >
        <template #prepend>
          <q-icon name="search" color="grey-5" size="18px" />
        </template>
        <template #append>
          <q-icon
            v-if="busca"
            name="close"
            color="grey-5"
            size="16px"
            class="cursor-pointer"
            @click="busca = ''"
          />
        </template>
      </q-input>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="clientesFiltrados.length === 0" class="empty-state q-pa-xl">
      <q-icon name="people_outline" size="56px" color="grey-4" />
      <div class="empty-title">
        {{ busca ? 'Nenhum resultado' : 'Nenhum cliente ainda' }}
      </div>
      <div class="empty-sub">
        {{ busca ? 'Tente outro termo' : 'Toque em + para adicionar' }}
      </div>
    </div>

    <!-- List -->
    <q-list v-else class="clients-list q-px-md">
      <transition-group name="list">
        <div v-for="cliente in clientesFiltrados" :key="cliente.id" class="client-card q-mb-sm">
          <div class="row items-center no-wrap q-pa-md">
            <!-- Avatar -->
            <div class="avatar-circle">
              {{ iniciais(cliente.nome) }}
            </div>

            <!-- Info -->
            <div class="col q-ml-md">
              <div class="client-name row items-center q-gutter-xs">
                {{ cliente.nome }}
                <q-badge
                  v-if="!cliente.ativo"
                  color="grey-4"
                  text-color="grey-7"
                  label="Inativo"
                  class="text-caption"
                />
              </div>
              <div class="client-phone">
                <q-icon name="phone" size="12px" class="q-mr-xs" />
                {{ cliente.telefone || 'Sem telefone' }}
              </div>
            </div>

            <!-- Actions -->
            <div class="row items-center gap-xs">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="grey-6"
                size="sm"
                @click="abrirDialogEditar(cliente)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                color="negative"
                size="sm"
                @click="confirmarExclusao(cliente)"
              />
            </div>
          </div>
        </div>
      </transition-group>
    </q-list>

    <!-- Dialog novo/editar -->
    <q-dialog v-model="dialog" persistent class="dialog-no-overflow">
      <q-card class="form-card column full-width-mobile">
        <q-card-section class="q-px-md q-px-lg@sm dialog-header">
          <div class="dialog-title">
            {{ editando ? 'Editar cliente' : 'Novo cliente' }}
          </div>
        </q-card-section>

        <q-card-section class="q-px-md q-px-lg@sm q-pb-md dialog-content">
          <div class="column q-gutter-md">
            <q-input
              v-model="form.nome"
              label="Nome *"
              outlined
              dense
              hide-bottom-space
              :error="!!erros.nome"
              :error-message="erros.nome"
              @update:model-value="erros.nome = ''"
            />

            <q-input
              v-model="form.telefone"
              label="Telefone"
              outlined
              dense
              mask="(##) #####-####"
              unmasked-value
              hide-bottom-space
            />

            <q-input
              v-model="dataNascimentoFormatada"
              label="Data de nascimento"
              outlined
              dense
              readonly
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>

              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="form.birth_date" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>

            <q-input
              v-model="dataRegistroFormatada"
              label="Data de registro"
              outlined
              dense
              readonly
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="event" />
              </template>

              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="form.created_at" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>

            <q-input
              v-model="form.obs"
              label="Observações"
              outlined
              type="textarea"
              autogrow
              hide-bottom-space
              input-style="min-height: 80px"
            />

            <!-- Mensalidade Config -->
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 text-grey-8 q-mb-sm">Configuração de Mensalidade (opcional)</div>
            <div class="text-caption text-grey-6 q-mb-md">Deixe em branco para usar os valores globais</div>

            <q-input
              v-model="form.mensalidade_valor"
              label="Valor da mensalidade (R$)"
              placeholder="Ex: 150.00"
              outlined
              dense
              hide-bottom-space
              prefix="R$ "
              type="text"
              @update:model-value="erros.mensalidade_valor = ''"
              :error="!!erros.mensalidade_valor"
              :error-message="erros.mensalidade_valor"
              :rules="[
                (val) => val == null || val === '' || (Number(val) > 0) || 'Valor deve ser maior que zero',
              ]"
            >
              <template #append>
                <q-icon name="currency_real" size="16px" color="grey-5" />
              </template>
            </q-input>

            <q-input
              v-model="form.mensalidade_dia_vencimento"
              label="Dia de vencimento"
              placeholder="Ex: 5"
              outlined
              dense
              hide-bottom-space
              type="text"
              @update:model-value="erros.mensalidade_dia_vencimento = ''"
              :error="!!erros.mensalidade_dia_vencimento"
              :error-message="erros.mensalidade_dia_vencimento"
              :rules="[
                (val) => val == null || val === '' || Number.isInteger(Number(val)) || 'Informe um dia inteiro',
                (val) => val == null || val === '' || (Number(val) >= 1 && Number(val) <= 31) || 'Dia deve estar entre 1 e 31',
              ]"
            >
              <template #append>
                <q-icon name="event" size="16px" color="grey-5" />
              </template>
            </q-input>

            <div class="row items-center justify-between q-mt-xs">
              <div>
                <div class="text-body2 text-grey-8">Cliente ativo</div>
                <div class="text-caption text-grey-5">Desative para não gerar cobrança</div>
              </div>
              <q-toggle v-model="form.ativo" color="primary" keep-color />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-px-lg@sm q-pb-lg dialog-actions">
          <q-btn flat label="Cancelar" color="grey-6" v-close-popup />
          <q-btn
            unelevated
            :label="editando ? 'Salvar' : 'Adicionar'"
            color="primary"
            :loading="salvando"
            @click="salvar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog confirmar exclusão -->
    <q-dialog v-model="dialogExclusao" persistent>
      <q-card class="delete-confirm-card">
        <q-card-section class="q-px-lg q-pt-lg q-pb-md">
          <div class="text-h6 q-mb-md">Excluir cliente</div>
          <div class="text-body1">
            Tem certeza que deseja excluir <strong>{{ clienteSelecionado?.nome }}</strong>?
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-px-lg q-pb-lg">
          <q-btn flat label="Cancelar" color="grey-6" v-close-popup />
          <q-btn
            unelevated
            label="Excluir"
            color="negative"
            :loading="excluindo"
            @click="excluir"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClientesStore } from 'src/stores/cliente-store';
import type { Cliente } from 'src/database/repositories/cliente-repository';
import { date } from 'quasar';

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
  mensalidade_valor: '',
  mensalidade_dia_vencimento: '',
});
const erros = ref({ nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' });

const dataRegistroFormatada = computed(() => {
  return formatCustomDate(form.value.created_at);
});
const dataNascimentoFormatada = computed(() => {
  return formatCustomDate(form.value.birth_date);
});

function formatCustomDate(dateStr: string | null | undefined) {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-');

  return `${day}/${month}/${year}`;
}

function abrirDialogNovo() {
  editando.value = false;
  form.value = {
    nome: '',
    telefone: '',
    birth_date: '',
    created_at: date.formatDate(new Date(), 'YYYY-MM-DD'),
    obs: '',
    ativo: true,
    mensalidade_valor: '',
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
    mensalidade_valor: cliente.mensalidade_config?.valor != null ? String(cliente.mensalidade_config.valor) : '',
    mensalidade_dia_vencimento: cliente.mensalidade_config?.dia_vencimento != null ? String(cliente.mensalidade_config.dia_vencimento) : '',
  };
  erros.value = { nome: '', mensalidade_valor: '', mensalidade_dia_vencimento: '' };
  dialog.value = true;
}

async function salvar() {
  if (!form.value.nome.trim()) {
    erros.value.nome = 'Nome é obrigatório';
    return;
  }

  // Validate mensalidade config
  if (form.value.mensalidade_valor !== '') {
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

    // Add mensalidade_config if any value provided
    if (form.value.mensalidade_valor !== '' || form.value.mensalidade_dia_vencimento !== '') {
      payload.mensalidade_config = {
        cliente_id: 0, // Will be set by repository
        valor: form.value.mensalidade_valor !== '' ? Number(form.value.mensalidade_valor) : undefined,
        dia_vencimento: form.value.mensalidade_dia_vencimento !== '' ? Number(form.value.mensalidade_dia_vencimento) : undefined,
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

// Utils
function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

onMounted(() => void store.carregar());
</script>

<style scoped lang="scss">
.clients-page {
  background: #f5f5f7;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid #ebebeb;
}

.btn-add {
  background: #1a1a1a !important;
  color: #fff !important;
  width: 44px;
  height: 44px;
}

.search-input {
  :deep(.q-field__control) {
    border-radius: 12px;
    border-color: #e8e8e8;
  }
}

.clients-list {
  padding-top: 12px;
  padding-bottom: 80px;
}

.client-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ebebeb;
  overflow: hidden;
  transition: box-shadow 0.15s ease;

  &:active {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.client-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.client-phone {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  display: flex;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 80px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.empty-sub {
  font-size: 13px;
  color: #aaa;
}

.form-card {
  width: 100%;
  max-width: 400px;
  border-radius: 20px !important;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.full-width-mobile {
  @media (max-width: 599px) {
    max-width: 100%;
    margin: 0;
    border-radius: 0 !important;
    height: 100%;
    max-height: 100%;
  }
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 8px;
  overflow-x: hidden;
  max-width: 100%;
}

.dialog-content :deep(.q-field) {
  max-width: 100%;
  box-sizing: border-box;
}

.dialog-content .column {
  max-width: 100%;
  overflow-x: hidden;
}

.dialog-actions {
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.delete-confirm-card {
  min-width: 280px;
  max-width: 90vw;
  border-radius: 16px !important;
}

:deep(.dialog-no-overflow .q-dialog__inner) {
  overflow-x: hidden;
  max-width: 100vw;
  border-radius: 20px;
}

:deep(.delete-confirm-card + .q-dialog__inner) {
  border-radius: 16px;
}

:deep(.full-width-mobile .q-dialog__inner) {
  @media (max-width: 599px) {
    max-width: 100vw;
    margin: 0;
    padding: 0;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
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