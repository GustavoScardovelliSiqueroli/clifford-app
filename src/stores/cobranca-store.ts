import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CobrancaRepository, type Cobranca, type CobrancaExtra } from '../database/repositories/cobranca-repository';

export const useCobrancaStore = defineStore('cobranca', () => {
  const cobrancasMensais = ref<Cobranca[]>([]);
  const loading = ref(false);
  const competenciaAtual = ref<string>('');
  const extrasCache = ref<Record<number, CobrancaExtra[]>>({});

  async function carregarCobrancas(competencia: string) {
    loading.value = true;
    cobrancasMensais.value = await CobrancaRepository.findByCompetencia(competencia);
    loading.value = false;
  }

  function obterCompetenciaAtual(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  async function verificarEGerarCobrancasDoMes() {
    loading.value = true;
    try {
      const competencia = obterCompetenciaAtual();
      competenciaAtual.value = competencia;

      // Verificar se já existem cobranças para esta competencia
      const existentes = await CobrancaRepository.findByCompetencia(competencia);
      if (existentes.length > 0) {
        cobrancasMensais.value = existentes;
        return;
      }

      // Buscar candidatos (clientes ativos com config ou ajustes)
      const candidatos = await CobrancaRepository.obterCandidatosGeracao();

      // Preparar cobrancas para inserção
      const novasCobrancas: Omit<Cobranca, 'id'>[] = [];

      for (const cand of candidatos) {
        // Calcular vencimento: dia_vencimento do mês corrente
        const parts = competencia.split('-').map(Number);
        const ano = parts[0];
        const mes = parts[1];
        // Garantir que ano e mes sejam números válidos
        const anoNum = ano && ano > 0 ? ano : new Date().getFullYear();
        const mesNum = mes && mes >= 1 && mes <= 12 ? mes : new Date().getMonth() + 1;
        // Garantir dia válido (1-31)
        const diaVenc = cand.dia_vencimento && cand.dia_vencimento > 0 ? cand.dia_vencimento : 5;
        const ultimoDiaMes = new Date(anoNum, mesNum, 0).getDate();
        const dia = Math.min(diaVenc, ultimoDiaMes);
        const dateObj = new Date(anoNum, mesNum - 1, dia);
        // Validar se a data é válida
        if (isNaN(dateObj.getTime())) {
          console.warn('Data de vencimento inválida gerada, usando hoje', { anoNum, mesNum, dia });
          continue; // Pula este candidato
        }
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const vencimento = `${year}-${month}-${day}`;

        novasCobrancas.push({
          cliente_id: cand.id,
          valor_mensalidade: cand.valor_mensalidade,
          vencimento,
          data_pagamento: null,
          competencia,
        });
      }

      if (novasCobrancas.length > 0) {
        await CobrancaRepository.inserirCobrancasEmLote(novasCobrancas);
        cobrancasMensais.value = await CobrancaRepository.findByCompetencia(competencia);
      } else {
        cobrancasMensais.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  async function baixarCobranca(id: number) {
    loading.value = true;
    try {
      const hoje = new Date().toISOString().split('T')[0] as string;
      await CobrancaRepository.atualizarStatusPagamento(id, hoje);
      // Recarregar cobrancas da competencia atual
      await carregarCobrancas(competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function adicionarExtra(idCobranca: number, motivo: string, valor: number) {
    loading.value = true;
    try {
      await CobrancaRepository.adicionarCobrancaExtra(idCobranca, motivo, valor);
      // Invalidar cache de extras desta cobrança
      delete extrasCache.value[idCobranca];
      // Recarregar cobrancas da competencia atual para refletir o total
      await carregarCobrancas(competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function carregarExtras(idCobranca: number): Promise<CobrancaExtra[]> {
    if (extrasCache.value[idCobranca]) {
      return extrasCache.value[idCobranca];
    }
    const extras = await CobrancaRepository.findExtrasByCobranca(idCobranca);
    extrasCache.value[idCobranca] = extras;
    return extras;
  }

  return {
    cobrancasMensais,
    loading,
    competenciaAtual,
    carregarCobrancas,
    verificarEGerarCobrancasDoMes,
    baixarCobranca,
    adicionarExtra,
    carregarExtras,
  };
});
