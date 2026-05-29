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
    <q-dialog v-model="dialog" persistent>
      <q-card class="form-card">
        <q-card-section class="dialog-header">
          <div class="dialog-title">
            {{ editando ? 'Editar cliente' : 'Novo cliente' }}
          </div>
        </q-card-section>

        <q-card-section class="q-px-lg q-pb-md">
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

            <div class="row items-center justify-between q-mt-xs">
              <div>
                <div class="text-body2 text-grey-8">Cliente ativo</div>
                <div class="text-caption text-grey-5">Desative para não gerar cobrança</div>
              </div>
              <q-toggle v-model="form.ativo" color="primary" keep-color />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-lg q-pb-lg">
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
    <q-dialog v-model="dialogExclusao">
      <q-card class="form-card">
        <q-card-section class="dialog-header">
          <div class="dialog-title">Excluir cliente</div>
        </q-card-section>
        <q-card-section class="q-px-lg">
          Tem certeza que deseja excluir <strong>{{ clienteSelecionado?.nome }}</strong
          >?
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
});
const erros = ref({ nome: '' });

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
  };
  erros.value = { nome: '' };
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
  };
  erros.value = { nome: '' };
  dialog.value = true;
}

async function salvar() {
  if (!form.value.nome.trim()) {
    erros.value.nome = 'Nome é obrigatório';
    return;
  }
  salvando.value = true;
  try {
    const payload = { ...form.value, ativo: form.value.ativo ? 1 : 0 };

    if (editando.value && clienteSelecionado.value?.id) {
      await store.atualizar(clienteSelecionado.value.id, payload);
    } else {
      await store.adicionar(payload);
    }
    dialog.value = false;
  } catch (error) {
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

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 13px;
  color: #888;
  margin-top: 1px;
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
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
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
