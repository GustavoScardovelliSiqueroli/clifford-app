import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  CobrancaRepository,
  type Cobranca,
  type CobrancaComExtras,
  type CobrancaExtra,
} from '../database/repositories/cobranca-repository';
import { proximoDiaUtil } from '../utils/business-days';

export const useCobrancaStore = defineStore('cobranca', () => {
  const cobrancasMensais = ref<CobrancaComExtras[]>([]);
  const loading = ref(false);
  const competenciaAtual = ref<string>('');
  const extrasCache = ref<Record<number, CobrancaExtra[]>>({});

  async function carregarCobrancas(competencia: string) {
    loading.value = true;
    cobrancasMensais.value = await CobrancaRepository.findByCompetenciaComExtras(competencia);
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

      const existentes = await CobrancaRepository.findByCompetencia(competencia);
      if (existentes.length > 0) {
        cobrancasMensais.value = await CobrancaRepository.findByCompetenciaComExtras(competencia);
        return;
      }

      const candidatos = await CobrancaRepository.obterCandidatosGeracao();

      const novasCobrancas: Omit<Cobranca, 'id'>[] = [];

      for (const cand of candidatos) {
        const parts = competencia.split('-').map(Number);
        const ano = parts[0];
        const mes = parts[1];
        const anoNum = ano && ano > 0 ? ano : new Date().getFullYear();
        const mesNum = mes && mes >= 1 && mes <= 12 ? mes : new Date().getMonth() + 1;
        const diaVenc = cand.dia_vencimento && cand.dia_vencimento > 0 ? cand.dia_vencimento : 5;
        const ultimoDiaMes = new Date(anoNum, mesNum, 0).getDate();
        const dia = Math.min(diaVenc, ultimoDiaMes);
        const dateObj = new Date(anoNum, mesNum - 1, dia);
        if (isNaN(dateObj.getTime())) {
          console.warn('Data de vencimento inválida gerada, usando hoje', { anoNum, mesNum, dia });
          continue;
        }
        const dateUtil = proximoDiaUtil(dateObj);
        const year = dateUtil.getFullYear();
        const month = String(dateUtil.getMonth() + 1).padStart(2, '0');
        const day = String(dateUtil.getDate()).padStart(2, '0');
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
        cobrancasMensais.value = await CobrancaRepository.findByCompetenciaComExtras(competencia);
      } else {
        cobrancasMensais.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  async function baixarCobranca(id: number, competencia?: string) {
    loading.value = true;
    try {
      const hoje = new Date().toISOString().split('T')[0] as string;
      await CobrancaRepository.atualizarStatusPagamento(id, hoje);
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function estornarBaixa(id: number, competencia?: string) {
    loading.value = true;
    try {
      await CobrancaRepository.estornarPagamento(id);
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function atualizarCobranca(
    id: number,
    dados: Partial<Pick<Cobranca, 'valor_mensalidade' | 'vencimento' | 'data_pagamento'>>,
    competencia?: string,
  ) {
    loading.value = true;
    try {
      await CobrancaRepository.atualizar(id, dados);
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function removerCobranca(id: number, competencia?: string) {
    loading.value = true;
    try {
      await CobrancaRepository.remover(id);
      delete extrasCache.value[id];
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function adicionarExtra(
    idCobranca: number,
    motivo: string,
    valor: number,
    competencia?: string,
  ) {
    loading.value = true;
    try {
      await CobrancaRepository.adicionarCobrancaExtra(idCobranca, motivo, valor);
      delete extrasCache.value[idCobranca];
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function atualizarExtra(
    id: number,
    idCobranca: number,
    motivo: string,
    valor: number,
    competencia?: string,
  ) {
    loading.value = true;
    try {
      await CobrancaRepository.atualizarExtra(id, motivo, valor);
      delete extrasCache.value[idCobranca];
      await carregarCobrancas(competencia ?? competenciaAtual.value);
    } finally {
      loading.value = false;
    }
  }

  async function removerExtra(id: number, idCobranca: number, competencia?: string) {
    loading.value = true;
    try {
      await CobrancaRepository.removerExtra(id);
      delete extrasCache.value[idCobranca];
      await carregarCobrancas(competencia ?? competenciaAtual.value);
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
    estornarBaixa,
    atualizarCobranca,
    removerCobranca,
    adicionarExtra,
    atualizarExtra,
    removerExtra,
    carregarExtras,
  };
});
