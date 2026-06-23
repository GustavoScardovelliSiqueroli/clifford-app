<template>
  <q-dialog v-model="dialog" persistent>
    <q-card class="form-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center justify-between">
          <div>
            <div class="dialog-title">{{ clienteNome }}</div>
            <div class="text-caption text-grey-6">Competência: {{ competenciaFormatada }}</div>
          </div>
          <q-btn flat round dense icon="close" @click="fechar" aria-label="Fechar" />
        </div>
      </q-card-section>

      <!-- Lista de extras existentes -->
      <q-card-section class="q-px-lg q-pb-md">
        <div v-if="extras.length === 0" class="text-center q-py-md text-grey-6">
          Nenhum extra cadastrado
        </div>
        <q-list dense separator v-else>
          <q-item v-for="extra in extras" :key="extra.id as number" class="q-py-xs">
            <q-item-section>
              <div class="text-body1">{{ extra.motivo }}</div>
              <div class="text-caption text-grey-6">
                {{ extra.created_at ? formatDate(extra.created_at) : 'Data não disponível' }}
              </div>
            </q-item-section>
            <q-item-section side top>
              <div class="text-h6 text-primary">{{ formatCurrency(extra.valor) }}</div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Total extras -->
        <div class="row justify-end q-gutter-sm q-mt-md bg-grey-1 q-pa-sm rounded-borders">
          <div class="text-subtitle1">Total extras:</div>
          <div class="text-h6 text-primary">{{ formatCurrency(totalExtras) }}</div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Formulário novo extra -->
      <q-card-section class="q-px-lg q-pb-md">
        <q-form @submit.prevent="salvarExtra">
          <div class="column q-gutter-md">
            <q-input
              v-model="novoExtra.motivo"
              label="Motivo"
              placeholder="Ex: Tela nova, Tintas extras, Material complementar"
              :rules="[(val) => !!val?.trim() || 'Motivo é obrigatório']"
              outlined
              dense
              hide-bottom-space
              @update:model-value="erros.motivo = ''"
            />

            <q-input
              v-model="novoExtra.valor"
              label="Valor (R$)"
              placeholder="0,00"
              :rules="[(val) => (val !== null && val !== '' && Number(val) > 0) || 'Valor deve ser maior que zero']"
              outlined
              dense
              hide-bottom-space
              prefix="R$ "
              type="number"
              @update:model-value="erros.valor = ''"
            />
          </div>

          <div class="row justify-end q-mt-md">
            <q-btn flat label="Cancelar" color="grey-6" v-close-popup />
            <q-btn
              unelevated
              label="Adicionar"
              color="primary"
              type="submit"
              :loading="salvando"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import type { CobrancaExtra } from 'src/database/repositories/cobranca-repository';

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
.form-card {
  width: 100%;
  max-width: 500px;
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
</style>