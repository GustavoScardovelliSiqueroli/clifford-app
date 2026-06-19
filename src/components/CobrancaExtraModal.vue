<template>
  <QDialog
    :model-value="props.modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <QCard style="min-width: 90vw; max-width: 500px">
      <!-- Header -->
      <QCardSection class="row items-center justify-between q-pb-none">
        <div>
          <div class="text-h6">{{ clienteNome }}</div>
          <div class="text-caption text-grey-6">Competência: {{ competenciaFormatada }}</div>
        </div>
        <QBtn flat round icon="close" @click="fechar" aria-label="Fechar" />
      </QCardSection>

      <QSeparator />

      <!-- Lista de extras existentes -->
      <QCardSection class="q-pt-none">
        <div v-if="extras.length === 0" class="text-center q-py-md text-grey-6">
          Nenhum extra cadastrado
        </div>
        <QList dense separator v-else>
          <QItem v-for="extra in extras" :key="extra.id as number">
            <QItemSection>
              <div class="text-body1">{{ extra.motivo }}</div>
              <div class="text-caption text-grey-6">
                {{ extra.created_at ? formatDate(extra.created_at) : 'Data não disponível' }}
              </div>
            </QItemSection>
            <QItemSection side top>
              <div class="text-h6 text-primary">{{ formatCurrency(extra.valor) }}</div>
            </QItemSection>
          </QItem>
        </QList>
      </QCardSection>

      <!-- Total extras -->
      <QCardSection class="row justify-end q-gutter-sm bg-grey-1">
        <div class="text-subtitle1">Total extras:</div>
        <div class="text-h6 text-primary">{{ formatCurrency(totalExtras) }}</div>
      </QCardSection>

      <QSeparator />

      <!-- Formulário novo extra -->
      <QCardSection>
        <QForm @submit.prevent="salvarExtra">
          <QInput
            v-model="novoExtra.motivo"
            label="Motivo"
            placeholder="Ex: Tela nova, Tintas extras, Material complementar"
            :rules="[val => !!val || 'Motivo é obrigatório']"
            dense
            @keydown.enter="salvarExtra"
          />
          <QInput
            v-model.number="novoExtra.valor"
            type="number"
            label="Valor (R$)"
            placeholder="0,00"
            :rules="[val => val && val > 0 || 'Valor deve ser maior que zero']"
            dense
            prefix="R$ "
            @keydown.enter="salvarExtra"
          />
          <div class="row justify-end q-mt-md">
            <QBtn label="Cancelar" flat @click="fechar" />
            <QBtn label="Adicionar" color="primary" type="submit" :loading="salvando" />
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </QDialog>
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

const extras = ref<CobrancaExtra[]>([]);
const salvando = ref(false);
const novoExtra = ref({ motivo: '', valor: 0 });

const totalExtras = computed(() =>
  extras.value.reduce((sum, e) => sum + e.valor, 0),
);

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
};

const carregar = async () => {
  extras.value = await store.carregarExtras(props.cobrancaId);
};

const salvarExtra = async () => {
  if (!novoExtra.value.motivo.trim() || novoExtra.value.valor <= 0) {
    return;
  }
  salvando.value = true;
  try {
    await store.adicionarExtra(props.cobrancaId, novoExtra.value.motivo.trim(), novoExtra.value.valor);
    resetForm();
    await carregar();
    emit('saved');
  } catch (e) {
    console.error('Erro ao adicionar extra:', e);
    // O erro será tratado pelo store (loading)
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