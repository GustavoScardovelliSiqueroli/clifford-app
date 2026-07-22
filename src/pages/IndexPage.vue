<template>
  <q-page class="page">
    <ClPageHeader title="Início" logo="/assets/logo.png" />

    <div class="page-content">
      <ClLoadingState v-if="loading" label="Carregando..." size="lg" />

      <template v-else>
        <ClButton
          variant="primary"
          size="xl"
          icon="send"
          full-width
          :disabled="pendentesCount === 0"
          :label="`Enviar Pendentes (${pendentesCount}) via WhatsApp`"
          @click="enviarPendentes"
        />

        <ClPageCard variant="elevated" class="dashboard-card">
          <div class="dashboard-card__header">
            <h2 class="dashboard-card__month">{{ mesFormatado }}</h2>
          </div>
          <div class="dashboard-card__body">
            <div class="dashboard-stat">
              <span class="dashboard-stat__icon dashboard-stat__icon--students">
                <q-icon name="group" size="18px" />
              </span>
              <div class="dashboard-stat__content">
                <span class="dashboard-stat__value">{{ alunosAtivosCount }}</span>
                <span class="dashboard-stat__label">alunos ativos</span>
              </div>
            </div>
            <div class="dashboard-stat">
              <span class="dashboard-stat__icon dashboard-stat__icon--pending">
                <q-icon name="pending_actions" size="18px" />
              </span>
              <div class="dashboard-stat__content">
                <span class="dashboard-stat__value">{{ pendentesCount }}</span>
                <span class="dashboard-stat__label">pendentes</span>
                <span class="dashboard-stat__amount">{{ formatCurrency(pendentesTotal) }}</span>
              </div>
            </div>
            <div class="dashboard-stat">
              <span class="dashboard-stat__icon dashboard-stat__icon--paid">
                <q-icon name="check_circle" size="18px" />
              </span>
              <div class="dashboard-stat__content">
                <span class="dashboard-stat__value">{{ pagosCount }}</span>
                <span class="dashboard-stat__label">pagos</span>
                <span class="dashboard-stat__amount">{{ formatCurrency(pagosTotal) }}</span>
              </div>
            </div>
          </div>
          <div class="dashboard-card__footer">
            <div class="dashboard-total">
              <span class="dashboard-total__label">Total do mês</span>
              <span class="dashboard-total__value">{{ formatCurrency(totalMes) }}</span>
            </div>
            <div v-if="totalMes > 0" class="dashboard-bar">
              <div class="dashboard-bar__track">
                <div class="dashboard-bar__fill" :style="{ width: percentualPago + '%' }"></div>
              </div>
              <span class="dashboard-bar__label">{{ percentualPago }}% recebido</span>
            </div>
          </div>
        </ClPageCard>

        <section class="pending-section">
          <h2 class="pending-section__title">Pendentes</h2>

          <ClEmptyState
            v-if="pendentesComNome.length === 0"
            icon="check_circle"
            title="Todas pagas!"
            description="Todas as cobranças deste mês foram pagas."
          />

          <div v-else class="charge-list">
            <div v-for="item in pendentesComNome" :key="item.id" class="charge-item">
              <ClAvatar :name="item.nome" size="md" shape="circle" />
              <div class="charge-item__info">
                <h3 class="charge-item__name">{{ item.nome }}</h3>
                <span class="charge-item__value">{{
                  formatCurrency(item.valor_mensalidade + (item.total_extras ?? 0))
                }}</span>
              </div>
              <div class="charge-item__meta">
                <ClBadge variant="warning" size="sm">Pendente</ClBadge>
                <span class="charge-item__due">Venc {{ formatDate(item.vencimento) }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useClientesStore } from 'src/stores/cliente-store';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import type { Cliente } from 'src/database/repositories/cliente-repository';
import type { CobrancaComExtras } from 'src/database/repositories/cobranca-repository';
import {
  ClPageHeader,
  ClPageCard,
  ClButton,
  ClAvatar,
  ClBadge,
  ClLoadingState,
  ClEmptyState,
} from 'src/components/ui';

const $q = useQuasar();
const clienteStore = useClientesStore();
const cobrancaStore = useCobrancaStore();

const competenciaAtual = ref('');

const loading = computed(() => cobrancaStore.loading || clienteStore.loading);

const mesFormatado = computed(() => {
  if (!competenciaAtual.value) return '';
  const [ano, mes] = competenciaAtual.value.split('-');
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${meses[parseInt(mes ?? '1', 10) - 1] ?? ''} de ${ano}`;
});

const alunosAtivosCount = computed(
  () => clienteStore.clientes.filter((c: Cliente) => c.ativo === 1).length,
);

interface CobrancaComNome extends CobrancaComExtras {
  nome: string;
}

const pendentesComNome = computed<CobrancaComNome[]>(() => {
  const clientes = clienteStore.clientes;
  return cobrancaStore.cobrancasMensais
    .filter((c) => !c.data_pagamento)
    .map((c) => {
      const cli = clientes.find((cl: Cliente) => cl.id === c.cliente_id);
      return { ...c, nome: cli?.nome ?? 'Desconhecido' };
    });
});

const pendentesCount = computed(() => pendentesComNome.value.length);

const pendentesTotal = computed(() =>
  cobrancaStore.cobrancasMensais
    .filter((c) => !c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);

const pagosCount = computed(
  () => cobrancaStore.cobrancasMensais.filter((c) => c.data_pagamento).length,
);

const pagosTotal = computed(() =>
  cobrancaStore.cobrancasMensais
    .filter((c) => c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade + (c.total_extras ?? 0), 0),
);

const totalMes = computed(() => pendentesTotal.value + pagosTotal.value);

const percentualPago = computed(() => {
  if (totalMes.value === 0) return 0;
  return Math.round((pagosTotal.value / totalMes.value) * 100);
});

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
}

function enviarPendentes() {
  if (pendentesCount.value === 0) return;
  $q.notify({
    type: 'info',
    message: 'Envio em breve',
    icon: 'construction',
    progress: true,
  });
}

onMounted(async () => {
  await clienteStore.carregar();
  await cobrancaStore.verificarEGerarCobrancasDoMes();
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  competenciaAtual.value = `${ano}-${mes}`;
  await cobrancaStore.carregarCobrancas(competenciaAtual.value);
});
</script>

<style scoped lang="scss">
.page {
  background: var(--color-bg-primary);
  min-height: 100vh;
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom));
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-6);
  padding-bottom: calc(var(--spacing-4) + var(--tab-bar-height) + env(safe-area-inset-bottom));

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-6) var(--spacing-8);
    padding-bottom: calc(var(--spacing-6) + var(--tab-bar-height));
  }
}

.dashboard-card {
  overflow: hidden;
}

.dashboard-card__header {
  padding: var(--spacing-4) var(--spacing-4) 0;

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-6) var(--spacing-6) 0;
  }
}

.dashboard-card__month {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);

  @media (min-width: #{$breakpoint-md}) {
    font-size: var(--font-size-h6);
  }
}

.dashboard-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: 0 var(--spacing-4) var(--spacing-3);

  @media (min-width: #{$breakpoint-md}) {
    flex-direction: row;
    gap: var(--spacing-4);
    padding: 0 var(--spacing-6) var(--spacing-4);
  }
}

.dashboard-stat {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-tertiary);

  @media (min-width: #{$breakpoint-md}) {
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
}

.dashboard-stat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-lg);
  flex-shrink: 0;

  &--students {
    background: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary);
  }

  &--pending {
    background: rgba(var(--color-warning-rgb), 0.15);
    color: #a07000;
  }

  &--paid {
    background: rgba(var(--color-positive-rgb), 0.15);
    color: var(--color-positive);
  }
}

.dashboard-stat__content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-1) var(--spacing-2);
  flex: 1;
  min-width: 0;
}

.dashboard-stat__value {
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);

  @media (min-width: #{$breakpoint-md}) {
    font-size: var(--font-size-h5);
  }
}

.dashboard-stat__label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.dashboard-stat__amount {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  width: 100%;

  @media (min-width: #{$breakpoint-md}) {
    width: auto;
  }
}

.dashboard-card__footer {
  border-top: 1px solid var(--color-border-light);
  padding: var(--spacing-3) var(--spacing-4);

  @media (min-width: #{$breakpoint-md}) {
    padding: var(--spacing-4) var(--spacing-6);
  }
}

.dashboard-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.dashboard-total__label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.dashboard-total__value {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.dashboard-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.dashboard-bar__track {
  flex: 1;
  height: 8px;
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.dashboard-bar__fill {
  height: 100%;
  border-radius: var(--border-radius-full);
  background: var(--color-positive);
  transition: width var(--transition-slow);
}

.dashboard-bar__label {
  font-size: var(--font-size-caption-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.pending-section__title {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.charge-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.charge-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-surface-primary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--border-radius-card);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-card);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: var(--shadow-md);
    }
  }
}

.charge-item__info {
  flex: 1;
  min-width: 0;
}

.charge-item__name {
  margin: 0 0 var(--spacing-1);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.charge-item__value {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.charge-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.charge-item__due {
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
</style>
