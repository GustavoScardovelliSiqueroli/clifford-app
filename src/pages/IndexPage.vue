<template>
  <q-page class="page">
    <ClPageHeader title="Início" subtitle="Visão geral das cobranças" class="page-header-compact">
      <template #actions>
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
      </template>
    </ClPageHeader>

    <div class="page-content">
      <ClLoadingState v-if="loading" label="Carregando..." size="lg" />

      <template v-else>
        <div class="summary-grid" role="region" aria-label="Resumo das cobranças">
          <ClPageCard variant="elevated" class="summary-card summary-card--pending">
            <div class="summary-card__icon" aria-hidden="true">
              <q-icon name="pending_actions" size="24px" color="warning" />
            </div>
            <div class="summary-card__content">
              <p class="summary-card__label">Pendentes</p>
              <p class="summary-card__count">{{ pendentesCount }}</p>
              <p class="summary-card__value">{{ formatCurrency(pendentesTotal) }}</p>
            </div>
          </ClPageCard>

          <ClPageCard variant="elevated" class="summary-card summary-card--paid">
            <div class="summary-card__icon" aria-hidden="true">
              <q-icon name="check_circle" size="24px" color="positive" />
            </div>
            <div class="summary-card__content">
              <p class="summary-card__label">Pagos</p>
              <p class="summary-card__count">{{ pagosCount }}</p>
              <p class="summary-card__value">{{ formatCurrency(pagosTotal) }}</p>
            </div>
          </ClPageCard>
        </div>

        <div class="hint">
          <q-icon name="receipt_long" size="20px" color="tertiary" />
          <span>Acesse a aba <strong>Cobranças</strong> para gerenciar</span>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import { ClPageHeader, ClPageCard, ClButton, ClLoadingState } from 'src/components/ui';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const cobrancaStore = useCobrancaStore();

const loading = ref(false);
const competenciaAtual = ref<string>('');

const competenciaFormatada = computed(() => {
  if (!competenciaAtual.value) return '';
  const [ano, mes] = competenciaAtual.value.split('-');
  return `${mes}/${ano}`;
});

watch(
  () => cobrancaStore.loading,
  (val) => {
    loading.value = val;
  },
);

watch(
  () => competenciaAtual.value,
  async (novaCompetencia) => {
    if (novaCompetencia) {
      await cobrancaStore.carregarCobrancas(novaCompetencia);
    }
  },
);

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

const cobrancasMensais = computed(() => cobrancaStore.cobrancasMensais);

const pendentesCount = computed(
  () => cobrancasMensais.value.filter((c) => !c.data_pagamento).length,
);
const pagosCount = computed(() => cobrancasMensais.value.filter((c) => c.data_pagamento).length);
const pendentesTotal = computed(() =>
  cobrancasMensais.value
    .filter((c) => !c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);
const pagosTotal = computed(() =>
  cobrancasMensais.value
    .filter((c) => c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);

const init = async () => {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  competenciaAtual.value = `${ano}-${mes}`;

  await cobrancaStore.verificarEGerarCobrancasDoMes();
  await cobrancaStore.carregarCobrancas(competenciaAtual.value);
};

onMounted(async () => {
  await init();
});
</script>

<style scoped lang="scss">
.page {
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom));
}

.page-header-compact {
  padding: var(--spacing-4) var(--spacing-6);
  margin: 0;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 100;
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

.page-content {
  padding: var(--spacing-4) var(--spacing-6);
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-6) var(--spacing-8);
    padding-bottom: calc(var(--spacing-6) + var(--tab-bar-height));
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);

  @media (min-width: #{$breakpoint-md}) {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  transition:
    transform var(--transition-card),
    box-shadow var(--transition-card);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: scale(0.99);
    }
  }
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.summary-card__content {
  flex: 1;
  min-width: 0;
}

.summary-card__label {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-caption-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.summary-card__count {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.summary-card__value {
  margin: 0;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
}

.summary-card--pending .summary-card__icon {
  background: rgba(var(--color-warning-rgb), 0.15);
}

.summary-card--paid .summary-card__icon {
  background: rgba(var(--color-positive-rgb), 0.15);
}

.hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-8) var(--spacing-4);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body);
}
</style>
