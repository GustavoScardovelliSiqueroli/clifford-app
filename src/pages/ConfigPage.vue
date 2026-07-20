<template>
  <q-page class="page">
    <ClPageHeader title="Configurações" subtitle="Ajuste os parâmetros do sistema" />

    <div class="page-content">
      <ClLoadingState v-if="store.loading" label="Carregando configurações..." />

      <template v-else>
        <ClPageCard variant="elevated" class="config-card">
          <div class="config-list">
            <!-- Mensalidade -->
            <div class="config-item">
              <div class="config-item__icon">
                <q-icon name="attach_money" size="24px" color="primary" />
              </div>

              <div class="config-item__info">
                <h3 class="config-item__title">Valor da Mensalidade</h3>
                <p class="config-item__description">Define o valor cobrado por cliente</p>
              </div>

              <div class="config-item__control">
                <ClMoneyField
                  v-model="form.valor_mensalidade"
                  label="Valor da mensalidade"
                  placeholder="0,00"
                  :min="0"
                  :max="999999.99"
                  :step="0.01"
                  :error="erros.valor_mensalidade"
                  @update:model-value="erros.valor_mensalidade = ''"
                />
              </div>
            </div>

            <div class="divider" />

            <!-- Dia de Vencimento -->
            <div class="config-item">
              <div class="config-item__icon">
                <q-icon name="calendar_today" size="24px" color="primary" />
              </div>

              <div class="config-item__info">
                <h3 class="config-item__title">Dia de Vencimento</h3>
                <p class="config-item__description">
                  Dia útil do mês em que as mensalidades vencem
                </p>
              </div>

              <div class="config-item__control">
                <ClFormField
                  v-model="form.dia_vencimento"
                  label="Dia útil de vencimento"
                  placeholder="Ex: 5"
                  type="number"
                  :min="1"
                  :max="31"
                  :step="1"
                  :error="erros.dia_vencimento"
                  @update:model-value="erros.dia_vencimento = ''"
                  inputmode="numeric"
                >
                  <template #prepend>
                    <q-icon name="calendar_today" size="18px" color="grey-5" />
                  </template>
                </ClFormField>
              </div>
            </div>
          </div>
        </ClPageCard>

        <div class="actions-section">
          <ClButton
            variant="primary"
            label="Salvar Configurações"
            class="btn-save"
            :loading="saving"
            @click="salvar"
            size="lg"
          />
        </div>

        <div class="backup-section">
          <ClPageCard variant="elevated" class="backup-card">
            <div class="backup-card__header">
              <q-icon name="folder" size="24px" color="primary" />
              <div>
                <h3 class="backup-card__title">Backup e Restauração</h3>
                <p class="backup-card__description">
                  Exporte uma cópia do banco de dados ou restaure a partir de um backup
                </p>
              </div>
            </div>

            <div class="backup-card__actions">
              <ClButton
                variant="primary"
                icon="file_upload"
                label="Exportar Backup"
                :loading="exportando"
                @click="exportarBackup"
                size="lg"
                full-width
              />
              <ClButton
                variant="outline"
                icon="file_download"
                label="Restaurar Backup"
                :loading="importando"
                @click="selecionarArquivo"
                size="lg"
                full-width
              />
            </div>
          </ClPageCard>
        </div>

        <div class="danger-zone">
          <ClPageCard variant="borderless" class="danger-card" :padded="false">
            <div class="danger-card__content">
              <div class="danger-card__info">
                <q-icon name="warning" size="28px" color="negative" class="danger-card__icon" />
                <div>
                  <h4 class="danger-card__title">Zona de Perigo</h4>
                  <p class="danger-card__description">Esta ação apaga todos os dados do sistema</p>
                </div>
              </div>
              <ClButton
                variant="destructive"
                size="md"
                label="RESETAR BANCO DE DADOS"
                @click="confirmarReset"
              />
            </div>
          </ClPageCard>
        </div>

        <!-- Confirm Reset Dialog -->
        <ClDialog v-model="dialogReset" title="Confirmar Reset" show-footer="auto">
          <p class="dialog-message">
            <strong>ATENÇÃO:</strong> Esta ação apagará <strong>TODOS</strong> os dados (clientes,
            cobranças, configurações) e não poderá ser desfeita.
          </p>
          <p class="dialog-message">Tem certeza que deseja continuar?</p>

          <template #footer>
            <div class="dialog-footer">
              <ClButton variant="ghost" @click="dialogReset = false" label="Cancelar"></ClButton>
              <ClButton
                variant="destructive"
                label="RESETAR AGORA"
                :loading="resetando"
                @click="resetDb"
              />
            </div>
          </template>
        </ClDialog>

        <!-- Confirm Restore Dialog -->
        <ClDialog v-model="dialogImport" title="Restaurar Backup" show-footer="auto">
          <p class="dialog-message">
            <strong>ATENÇÃO:</strong> Todos os dados atuais serão substituídos pelos dados do
            backup. Esta ação <strong>não pode ser desfeita</strong>.
          </p>
          <p class="dialog-message">Deseja continuar?</p>

          <template #footer>
            <div class="dialog-footer">
              <ClButton variant="ghost" @click="dialogImport = false" label="Cancelar"></ClButton>
              <ClButton
                variant="destructive"
                label="Restaurar"
                :loading="importando"
                @click="onImportarBackup"
              />
            </div>
          </template>
        </ClDialog>
      </template>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="onArquivoSelecionado"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useConfigStore } from 'src/stores/config-store';
import { useBackup } from 'src/composables/useBackup';
import { getDB, saveDB } from 'src/database/connection';
import { runMigrations } from 'src/database/migrations';
import {
  ClPageHeader,
  ClPageCard,
  ClButton,
  ClDialog,
  ClLoadingState,
  ClFormField,
  ClMoneyField,
} from 'src/components/ui';

const $q = useQuasar();
const store = useConfigStore();
const { exportarBackup, importarBackup, exportando, importando } = useBackup();

const form = ref({
  valor_mensalidade: 0,
  dia_vencimento: 1,
});

const erros = ref({
  valor_mensalidade: '',
  dia_vencimento: '',
});

const saving = ref(false);
const dialogReset = ref(false);
const resetando = ref(false);
const dialogImport = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
let arquivoConteudo = '';

async function salvar() {
  let valid = true;
  if (!form.value.valor_mensalidade || form.value.valor_mensalidade <= 0) {
    erros.value.valor_mensalidade = 'Valor inválido';
    valid = false;
  }
  if (
    !form.value.dia_vencimento ||
    form.value.dia_vencimento < 1 ||
    form.value.dia_vencimento > 31
  ) {
    erros.value.dia_vencimento = 'Dia inválido';
    valid = false;
  }
  if (!valid) return;

  saving.value = true;
  try {
    await store.salvar(form.value);
    $q.notify({
      type: 'positive',
      message: 'Configurações salvas com sucesso!',
      icon: 'check_circle',
      progress: true,
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Erro ao salvar configurações. Tente novamente.',
      icon: 'error',
      progress: true,
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await store.carregar();
});

watch(
  () => store.ajuste,
  (ajuste) => {
    if (ajuste) {
      form.value.valor_mensalidade = ajuste.valor_mensalidade;
      form.value.dia_vencimento = ajuste.dia_vencimento;
    }
  },
);

function confirmarReset() {
  dialogReset.value = true;
}

async function resetDb() {
  const db = await getDB();

  await db.execute('PRAGMA foreign_keys = OFF');

  await db.execute('DROP TABLE IF EXISTS cobrancas_extras');
  await db.execute('DROP TABLE IF EXISTS cobrancas');
  await db.execute('DROP TABLE IF EXISTS mensalidade_config');
  await db.execute('DROP TABLE IF EXISTS ajustes');
  await db.execute('DROP TABLE IF EXISTS clientes');

  await db.execute('PRAGMA foreign_keys = ON');

  await saveDB();
  await runMigrations();
  await saveDB();

  dialogReset.value = false;
  resetando.value = false;

  window.location.reload();
}

function selecionarArquivo() {
  fileInputRef.value?.click();
}

function onArquivoSelecionado(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    arquivoConteudo = (e.target?.result as string) || '';
    dialogImport.value = true;
  };
  reader.onerror = () => {
    console.error('Erro ao ler arquivo');
  };
  reader.readAsText(file);

  // Reset input so same file can be selected again
  input.value = '';
}

async function onImportarBackup() {
  if (!arquivoConteudo) return;
  try {
    await importarBackup(arquivoConteudo);
    dialogImport.value = false;
  } catch (error) {
    console.error('Erro na importação:', error);
  }
}
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

.config-card {
  margin-bottom: var(--spacing-6);
}

.config-list {
  display: flex;
  flex-direction: column;
}

.config-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) 0;

  @media (max-width: 599px) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-3);
  }
}

.config-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  flex-shrink: 0;
}

.config-item__info {
  flex: 1;
  min-width: 0;
}

.config-item__title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.config-item__description {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

.config-item__control {
  flex-shrink: 0;
  min-width: 160px;

  @media (max-width: 599px) {
    width: 100%;
    min-width: 0;
  }
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 0;
}

// Actions
.actions-section {
  margin: var(--spacing-6) 0;
}

.btn-save {
  width: 100%;
  @media (min-width: #{$breakpoint-md}) {
    width: auto;
    min-width: 280px;
  }
}

// Backup Section
.backup-section {
  margin: var(--spacing-6) 0;
}

.backup-card {
  padding: var(--spacing-6);
}

.backup-card__header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
}

.backup-card__title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.backup-card__description {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

.backup-card__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);

  @media (min-width: 600px) {
    flex-direction: row;
  }
}

// Danger Zone
.danger-zone {
  margin-top: var(--spacing-8);
}

.danger-card {
  border: 1px solid rgba(var(--color-negative-rgb), 0.2);
  background: rgba(var(--color-negative-rgb), 0.04);
}

.danger-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  gap: var(--spacing-4);

  @media (max-width: 599px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.danger-card__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.danger-card__icon {
  flex-shrink: 0;
}

.danger-card__title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.danger-card__description {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
}

// Dialog
.dialog-message {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);

  &:last-child {
    margin-bottom: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  width: 100%;
}
</style>
