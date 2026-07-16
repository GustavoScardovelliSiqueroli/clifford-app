<template>
  <q-page class="page">
    <ClPageHeader
      title="Início"
      subtitle="Visão geral das cobranças"
      class="page-header-compact"
    >
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
      <!-- Summary Cards -->
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

      <ClLoadingState v-if="loading" label="Carregando cobranças..." size="lg" />

      <template v-else>
        <ClEmptyState
          v-if="cobrancasFiltradas.length === 0"
          icon="inbox"
          title="Nenhuma cobrança"
          description="Não há cobranças para esta competência."
        />

        <div v-else class="charges-list" role="list" aria-label="Lista de cobranças">
          <div
            v-for="cobranca in cobrancasFiltradas"
            :key="cobranca.id as number"
            class="charge-item"
            role="listitem"
          >
            <div class="charge-item__main" @click="abrirModal({ id: cobranca.id, nome: cobranca.nome })">
              <div class="charge-item__avatar">
                <ClAvatar
                  :name="cobranca.nome"
                  size="md"
                  shape="circle"
                  :color="cobranca.pendente ? 'warning' : 'positive'"
                />
              </div>
              
              <div class="charge-item__info">
                <h3 class="charge-item__name">{{ cobranca.nome }}</h3>
                <p class="charge-item__phone">{{ cobranca.telefone }}</p>
              </div>
              
              <div class="charge-item__amount">
                <span class="charge-item__value">{{ formatCurrency(cobranca.valorTotal) }}</span>
                <span class="charge-item__due">{{ cobranca.vencimentoFormatado }}</span>
              </div>
            </div>
            
            <div class="charge-item__actions">
              <ClButton
                v-if="cobranca.pendente"
                variant="success"
                size="md"
                label="Dar Baixa"
                @click.stop="baixarCobranca(cobranca.id as number)"
              />
              <q-icon v-else name="check_circle" color="positive" size="20px" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <ClDialog
      v-model="modalAberto"
      title="Cobranças Extras"
      :full-mobile="true"
    >
      <CobrancaExtraModal
        v-model="modalAberto"
        :cobranca-id="cobrancaSelecionada?.id ?? 0"
        :cliente-nome="cobrancaSelecionada?.nome ?? ''"
        :competencia="competenciaAtual"
        @saved="carregarCobrancas"
      />
    </ClDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import { useClientesStore } from 'src/stores/cliente-store';
import { 
  ClPageHeader, 
  ClPageCard, 
  ClButton, 
  ClDialog, 
  ClEmptyState, 
  ClLoadingState, 
  ClAvatar 
} from 'src/components/ui';
import CobrancaExtraModal from 'src/components/CobrancaExtraModal.vue';

// Filtro para formatar moeda (R$ 0,00)
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Stores
const cobrancaStore = useCobrancaStore();
const clienteStore = useClientesStore();

// Estado local
const loading = ref(false);
const competenciaAtual = ref<string>('');

// Computeds
const competenciaFormatada = computed(() => {
  if (!competenciaAtual.value) return '';
  const [ano, mes] = competenciaAtual.value.split('-');
  return `${mes}/${ano}`;
});

const cobrancasMensais = computed(() => cobrancaStore.cobrancasMensais);

// Loading status
watch(
  () => cobrancaStore.loading,
  (val) => {
    loading.value = val;
  },
);

// Watch para carregar cobranças quando a competência muda
watch(
  () => competenciaAtual.value,
  async (novaCompetencia) => {
    if (novaCompetencia) {
      await carregarCobrancas();
    }
  },
);

// Funções de navegação de competência
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

// Carregar cobrancas para a competencia atual
const carregarCobrancas = async () => {
  if (!competenciaAtual.value) return;
  await cobrancaStore.carregarCobrancas(competenciaAtual.value);
};

// Inicializar
const init = async () => {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const competenciaCorrente = `${ano}-${mes}`;
  competenciaAtual.value = competenciaCorrente;

  await clienteStore.carregar();
  await cobrancaStore.verificarEGerarCobrancasDoMes();
  await carregarCobrancas();
};

// Computeds para resumo
const pendentesCount = computed(() => {
  return cobrancasMensais.value.filter((c) => !c.data_pagamento).length;
});

const pagosCount = computed(() => {
  return cobrancasMensais.value.filter((c) => c.data_pagamento).length;
});

const pendentesTotal = computed(() => {
  return cobrancasMensais.value
    .filter((c) => !c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade, 0);
});

const pagosTotal = computed(() => {
  return cobrancasMensais.value
    .filter((c) => c.data_pagamento)
    .reduce((sum, c) => sum + c.valor_mensalidade, 0);
});

// Cobrancas filtradas (com extras e nome do cliente)
const cobrancasFiltradas = computed(() => {
  return cobrancasMensais.value.map((cobranca) => {
    const cliente = clienteStore.clientes.find((c) => c.id === cobranca.cliente_id);
    return {
      ...cobranca,
      nome: cliente?.nome ?? 'Desconhecido',
      telefone: cliente?.telefone ?? '',
      valorTotal: cobranca.valor_mensalidade,
      vencimentoFormatado: new Date(cobranca.vencimento).toLocaleDateString('pt-BR'),
      pendente: !cobranca.data_pagamento,
    };
  });
});

// Funcao para dar baixa em uma cobranca
const baixarCobranca = async (id: number) => {
  await cobrancaStore.baixarCobranca(id);
  await carregarCobrancas();
};

// Estado do modal de extras
const modalAberto = ref(false);
const cobrancaSelecionada = ref<{
  id: number;
  nome: string;
} | null>(null);

const abrirModal = (cobranca: { id: number | undefined; nome: string }) => {
  if (cobranca.id == null) return;
  cobrancaSelecionada.value = { id: cobranca.id, nome: cobranca.nome };
  modalAberto.value = true;
};

// Executar inicializacao
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

// Summary Grid
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
  transition: transform var(--transition-card), box-shadow var(--transition-card);
  
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }
  
  @media (hover: none) and (pointer: coarse) {
    &:active {
      transform: scale(0.99);
      box-shadow: var(--shadow-xs);
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

// Charges List
.charges-list {
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
  transition: box-shadow var(--transition-card), transform var(--transition-card);
  
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      box-shadow: var(--shadow-md);
    }
  }
  
  @media (hover: none) and (pointer: coarse) {
    &:active {
      box-shadow: var(--shadow-xs);
      transform: scale(0.99);
    }
  }
}

.charge-item__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.charge-item__avatar {
  flex-shrink: 0;
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

.charge-item__phone {
  margin: 0;
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

.charge-item__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-1);
  flex-shrink: 0;
  min-width: 90px;
  
  @media (max-width: 599px) {
    min-width: 80px;
  }
}

.charge-item__value {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  white-space: nowrap;
}

.charge-item__due {
  font-size: var(--font-size-caption-md);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.charge-item__actions {
  flex-shrink: 0;
  margin-left: var(--spacing-2);
}
</style>