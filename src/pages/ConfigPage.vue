<template>
  <q-page class="page">
    <ClPageHeader
      title="Configurações"
      subtitle="Ajuste os parâmetros do sistema"
    />

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
                <ClFormField
                  v-model="form.valor_mensalidade"
                  type="number"
                  step="0.01"
                  min="0"
                  prepend="R$ "
                  :error="erros.valor_mensalidade"
                  @update:model-value="erros.valor_mensalidade = ''"
                  class="config-input"
                >
                  <template #append>
                    <q-icon name="currency_real" size="16px" color="grey-5" />
                  </template>
                </ClFormField>
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
                <p class="config-item__description">Dia do mês em que as mensalidades vencem</p>
              </div>
              
              <div class="config-item__control">
                <ClFormField
                  v-model="form.dia_vencimento"
                  type="number"
                  step="1"
                  min="1"
                  max="31"
                  :error="erros.dia_vencimento"
                  @update:model-value="erros.dia_vencimento = ''"
                  class="config-input"
                >
                  <template #append>
                    <q-icon name="event" size="16px" color="grey-5" />
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
          />
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
                size="sm"
                label="RESETAR BANCO DE DADOS"
                @click="confirmarReset"
              />
            </div>
          </ClPageCard>
        </div>

        <!-- Confirm Reset Dialog -->
        <ClDialog
          v-model="dialogReset"
          title="Confirmar Reset"
        >
          <p class="dialog-message">
            <strong>ATENÇÃO:</strong> Esta ação apagará <strong>TODOS</strong> os dados (clientes, cobranças, configurações) e não poderá ser desfeita.
          </p>
          <p class="dialog-message">Tem certeza que deseja continuar?</p>
          
          <template #footer>
            <div class="dialog-footer">
              <ClButton variant="ghost" @click="dialogReset = false">Cancelar</ClButton>
              <ClButton variant="destructive" label="RESETAR AGORA" :loading="resetando" @click="resetDb" />
            </div>
          </template>
        </ClDialog>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useConfigStore } from 'src/stores/config-store';
import { getDB, saveDB } from 'src/database/connection';
import { runMigrations } from 'src/database/migrations';
import {
  ClPageHeader,
  ClPageCard,
  ClButton,
  ClDialog,
  ClLoadingState,
  ClFormField,
} from 'src/components/ui';

const store = useConfigStore();

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
  } catch (error) {
    console.error(error);
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
  
  // Recarregar a página para refletir as mudanças
  window.location.reload();
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
  min-width: 120px;
  
  @media (max-width: 599px) {
    width: 100%;
    min-width: 0;
  }
}

.config-input {
  width: 120px;
  
  @media (max-width: 599px) {
    width: 100%;
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