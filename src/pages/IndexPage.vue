<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <div class="row items-center q-mb-sm">
        <q-btn round flat dense icon="keyboard_arrow_left" @click="competenciaAnterior" />
        <div class="text-h6 q-ml-md q-mr-md">{{ competenciaFormatada }}</div>
        <q-btn round flat dense icon="keyboard_arrow_right" @click="competenciaProxima" />
      </div>

      <div class="row q-gutter-sm q-mb-md">
        <q-col sm="6" md="3">
          <q-card class="text-center bg-primary text-white">
            <div class="q-pa-md">
              <div class="text-subtitle1">Pendentes</div>
              <div class="text-h4">{{ pendentesCount }}</div>
              <div class="text-subtitle1">{{ formatCurrency(pendentesTotal) }}</div>
            </div>
          </q-card>
        </q-col>

        <q-col sm="6" md="3">
          <q-card class="text-center bg-positive text-white">
            <div class="q-pa-md">
              <div class="text-subtitle1">Pagos</div>
              <div class="text-h4">{{ pagosCount }}</div>
              <div class="text-subtitle1">{{ formatCurrency(pagosTotal) }}</div>
            </div>
          </q-card>
        </q-col>
      </div>
    </div>

    <div v-if="loading" class="q-mx-auto">
      <q-spinner dots size="48px" color="primary" />
    </div>

    <div v-else>
      <q-separator class="q-my-md" />

      <div v-if="cobrancasFiltradas.length === 0" class="text-center q-py-md">
        <div class="text-body1">Nenhuma cobrança encontrada para esta competencia.</div>
      </div>

      <q-list v-else separator>
        <q-item
          v-for="cobranca in cobrancasFiltradas"
          :key="cobranca.id as number"
          class="q-py-sm"
          @click="abrirModal({ id: cobranca.id, nome: cobranca.nome })"
          style="cursor: pointer"
        >
          <q-item-section avatar>
            <q-avatar>
              <q-icon color="white" :class="cobranca.statusColor">
                {{ cobranca.statusIcon }}
              </q-icon>
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <div class="text-subtitle1">{{ cobranca.nome }}</div>
            <div class="text-caption">{{ cobranca.telefone }}</div>
          </q-item-section>

          <q-item-section side top class="text-right">
            <div class="text-h6">{{ formatCurrency(cobranca.valorTotal) }}</div>
            <div class="text-caption">{{ cobranca.vencimentoFormatado }}</div>
          </q-item-section>

          <q-item-section side>
            <q-btn
              v-if="cobranca.pendente"
              round
              flat
              dense
              color="positive"
              label="Dar Baixa"
              @click.stop="baixarCobranca(cobranca.id as number)"
            />
            <q-icon v-else name="check_circle" color="positive" size="18px" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>

  <CobrancaExtraModal
    v-model="modalAberto"
    :cobranca-id="cobrancaSelecionada?.id ?? 0"
    :cliente-nome="cobrancaSelecionada?.nome ?? ''"
    :competencia="competenciaAtual"
    @saved="carregarCobrancas"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useCobrancaStore } from 'src/stores/cobranca-store';
import { useClientesStore } from 'src/stores/cliente-store';
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

// Competencia atual (formato YYYY-MM)
const competenciaAtual = ref<string>('');

// Computeds
const competenciaFormatada = computed(() => {
  if (!competenciaAtual.value) return '';
  const [ano, mes] = competenciaAtual.value.split('-');
  return `${mes}/${ano}`;
});

// Cobrancas da competencia atual
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

// Funções de navegação de competencia
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
  // Define competencia atual como mês/ano corrente
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const competenciaCorrente = `${ano}-${mes}`;
  competenciaAtual.value = competenciaCorrente;

  // Garante que as cobrancas do mes corrente sejam geradas (se nao existirem)
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
      valorTotal: cobranca.valor_mensalidade, // TODO: adicionar soma dos extras quando implementado
      vencimentoFormatado: new Date(cobranca.vencimento).toLocaleDateString('pt-BR'),
      statusColor: cobranca.data_pagamento ? 'positive' : 'negative',
      statusIcon: cobranca.data_pagamento ? 'check_circle' : 'error_outline',
      pendente: !cobranca.data_pagamento,
    };
  });
});

// Funcao para dar baixa em uma cobranca
const baixarCobranca = async (id: number) => {
  await cobrancaStore.baixarCobranca(id);
  // Recarregar a competencia atual para refletir a alteracao
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
