<template>
  <ClDialog
    v-model="dialog"
    title="Cobranças Extras"
    :full-mobile="true"
  >
    <div class="dialog-content">
      <!-- Header com nome do cliente e competência -->
      <div class="dialog-header">
        <div>
          <h3 class="dialog-title">{{ clienteNome }}</h3>
          <p class="dialog-subtitle">Competência: {{ competenciaFormatada }}</p>
        </div>
      </div>

      <!-- Lista de extras existentes -->
      <div class="extras-list" v-if="extras.length > 0">
        <div
          v-for="extra in extras"
          :key="extra.id as number"
          class="extra-item"
        >
          <div class="extra-item__info">
            <p class="extra-item__motivo">{{ extra.motivo }}</p>
            <p class="extra-item__date">
              {{ extra.created_at ? formatDate(extra.created_at) : 'Data não disponível' }}
            </p>
          </div>
          <div class="extra-item__value">
            {{ formatCurrency(extra.valor) }}
          </div>
        </div>

        <!-- Total extras -->
        <div class="extras-total">
          <span class="extras-total__label">Total extras:</span>
          <span class="extras-total__value">{{ formatCurrency(totalExtras) }}</span>
        </div>
      </div>

      <div v-else class="extras-empty">
        Nenhum extra cadastrado
      </div>

      <div class="divider" />

      <!-- Formulário novo extra -->
      <form @submit.prevent="salvarExtra" class="extra-form">
        <ClFormField
          v-model="novoExtra.motivo"
          label="Motivo"
          placeholder="Ex: Tela nova, Tintas extras, Material complementar"
          :error="erros.motivo"
          @update:model-value="erros.motivo = ''"
          required
        />

        <ClMoneyField
          v-model="novoExtra.valor"
          label="Valor"
          placeholder="0,00"
          :min="0.01"
          :max="999999.99"
          :step="0.01"
          :error="erros.valor"
          @update:model-value="erros.valor = ''"
          required
        />

        <div class="form-actions">
          <ClButton variant="ghost" @click="fechar" label="Cancelar" />
          <ClButton
            variant="primary"
            label="Adicionar"
            type="submit"
            :loading="salvando"
            size="lg"
          />
        </div>
      </form>
    </div>
  </ClDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import type { CobrancaExtra } from 'src/database/repositories/cobranca-repository';
import {
  ClDialog,
  ClFormField,
  ClMoneyField,
  ClButton,
} from 'src/components/ui';

interface Props {
  modelValue: boolean;
  cobrancaId: number;
  clienteNome: string;
  competencia: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const store = useCobrancaStore();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const extras = ref<CobrancaExtra[]>([]);
const salvando = ref(false);
const novoExtra = ref({ motivo: '', valor: 0 });
const erros = ref({ motivo: '', valor: '' });

const totalExtras = computed(() => extras.value.reduce((sum, e) => sum + e.valor, 0));

const competenciaFormatada = computed(() => {
  if (!props.competencia) return '';
  const [ano, mes] = props.competencia.split('-');
  return `${mes}/${ano}`;
});

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fechar = () => {
  resetForm();
  emit('update:modelValue', false);
};

const resetForm = () => {
  novoExtra.value = { motivo: '', valor: 0 };
  erros.value = { motivo: '', valor: '' };
};

const carregar = async () => {
  extras.value = await store.carregarExtras(props.cobrancaId);
};

const salvarExtra = async () => {
  if (!novoExtra.value.motivo?.trim() || !novoExtra.value.valor || Number(novoExtra.value.valor) <= 0) {
    if (!novoExtra.value.motivo?.trim()) erros.value.motivo = 'Motivo é obrigatório';
    if (!novoExtra.value.valor || Number(novoExtra.value.valor) <= 0) erros.value.valor = 'Valor deve ser maior que zero';
    return;
  }
  salvando.value = true;
  try {
    await store.adicionarExtra(
      props.cobrancaId,
      novoExtra.value.motivo.trim(),
      Number(novoExtra.value.valor),
    );
    resetForm();
    await carregar();
    emit('saved');
  } catch (e) {
    console.error('Erro ao adicionar extra:', e);
  } finally {
    salvando.value = false;
  }
};

// Carregar ao abrir
watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await carregar();
    } else {
      resetForm();
      extras.value = [];
    }
  },
);
</script>

<style scoped lang="scss">
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-header {
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border-light);
}

.dialog-title {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.dialog-subtitle {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
}

.extras-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.extra-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.extra-item__info {
  flex: 1;
  min-width: 0;
}

.extra-item__motivo {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.extra-item__date {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

.extra-item__value {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  white-space: nowrap;
  margin-left: var(--spacing-3);
}

.extras-total {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-2);
}

.extras-total__label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.extras-total__value {
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.extras-empty {
  text-align: center;
  padding: var(--spacing-6);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-sm);
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: var(--spacing-2) 0;
}

.extra-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
}
</style>