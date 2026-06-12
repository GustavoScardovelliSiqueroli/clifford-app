<template>
  <q-page class="config-page">
    <!-- Header -->
    <div class="page-header q-px-lg q-pt-lg q-pb-md bg-primary">
      <div class="row items-center">
        <div>
          <div class="page-title">Configurações</div>
          <div class="page-subtitle text-grey-8">Ajuste os parâmetros do sistema</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Settings List -->
    <div v-else class="q-mx-md q-mt-md q-mb-md">
      <q-card class="no-border-radius" style="border-radius: 20px; overflow: hidden">
        <q-list no-border-link padding>
          <!-- Mensalidade -->
          <q-item class="q-pt-md q-pb-md">
            <q-item-section avatar>
              <q-icon name="attach_money" size="24px" color="primary" />
            </q-item-section>
            <q-item-section>
              <div class="text-subtitle2">Valor da Mensalidade</div>
              <div class="text-caption text-grey-6">Define o valor cobrado por cliente</div>
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="form.valor_mensalidade"
                type="number"
                step="0.01"
                min="0"
                dense
                debounce="300"
                hide-bottom
                input-class="max-w-xs"
                :error="!!erros.valor_mensalidade"
                :error-message="erros.valor_mensalidade"
                @update:model-value="erros.valor_mensalidade = ''"
                style="width: 100px"
              >
                <template #append>
                  <q-icon name="currency_real" size="16px" color="grey-5" />
                </template>
              </q-input>
            </q-item-section>
          </q-item>

          <q-separator inset />

          <!-- Dia de Vencimento -->
          <q-item class="q-pt-md q-pb-md">
            <q-item-section avatar>
              <q-icon name="calendar_today" size="24px" color="primary" />
            </q-item-section>
            <q-item-section>
              <div class="text-subtitle2">Dia de Vencimento</div>
              <div class="text-caption text-grey-6">Dia do mês em que as mensalidades vencem</div>
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="form.dia_vencimento"
                step="1"
                type="number"
                min="1"
                max="31"
                dense
                debounce="300"
                hide-bottom
                input-class="max-w-xs"
                :error="!!erros.dia_vencimento"
                :error-message="erros.dia_vencimento"
                @update:model-value="erros.dia_vencimento = ''"
                :rules="[
                  (val) => Number.isInteger(Number(val)) || 'Informe um dia inteiro',
                  (val) => (val >= 1 && val <= 31) || 'Dia deve estar entre 1 e 31',
                ]"
                style="width: 80px"
              >
                <template #append>
                  <q-icon name="event" size="16px" color="grey-5" />
                </template>
              </q-input>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <!-- Save Button -->
    <div class="q-px-md q-pb-md">
      <q-btn
        unelevated
        label="Salvar Configurações"
        color="primary"
        style="width: 100%"
        :loading="saving"
        @click="salvar"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useConfigStore } from 'src/stores/config-store';

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

async function salvar() {
  // Validate
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

// Load the settings when the page is mounted
onMounted(async () => {
  await store.carregar();
});

// Update form when store's ajuste changes
watch(
  () => store.ajuste,
  (ajuste) => {
    if (ajuste) {
      form.value.valor_mensalidade = ajuste.valor_mensalidade;
      form.value.dia_vencimento = ajuste.dia_vencimento;
    }
  },
);
</script>

<style scoped lang="scss">
.config-page {
  background: #f5f5f7;
  min-height: 100vh;
}

/* Remove default card border radius and apply our own */
.no-border-radius {
  border-radius: 0 !important;
  overflow: visible;
}

/* Inputs - matching the dialog inputs */
.q-field--outlined {
  :deep(.q-field__control) {
    border-radius: 12px;
    border-color: #e8e8e8;
  }
}

/* Save button - matching the dialog save button */
.save-button {
  background: #1a1a1a !important;
  color: #fff !important;
  border-radius: 14px !important;
  font-weight: 600;
  text-transform: none;
  height: 44px;
  min-width: 120px;
}
</style>
