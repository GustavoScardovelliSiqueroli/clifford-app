import { getDB, saveDB } from '../connection';

export interface Cobranca {
  id?: number;
  cliente_id: number;
  valor_mensalidade: number;
  vencimento: string; // YYYY-MM-DD
  data_pagamento?: string | null; // YYYY-MM-DD or null
  competencia: string; // YYYY-MM
}

export interface CobrancaExtra {
  id?: number;
  id_cobranca: number;
  motivo: string;
  valor: number;
  created_at?: string;
}

export interface ClienteCobrancaCandidato {
  id: number;
  nome: string;
  valor_mensalidade: number;
  dia_vencimento: number;
}

export const CobrancaRepository = {
  async obterCandidatosGeracao(): Promise<ClienteCobrancaCandidato[]> {
    const db = await getDB();
    const result = await db.query(`
      SELECT
        c.id,
        c.nome,
        COALESCE(mc.valor, a.valor_mensalidade, 0) AS valor_mensalidade,
        COALESCE(mc.dia_vencimento, a.dia_vencimento, 5) AS dia_vencimento
      FROM clientes c
      LEFT JOIN mensalidade_config mc ON c.id = mc.cliente_id
      LEFT JOIN (SELECT * FROM ajustes LIMIT 1) a ON 1=1
      WHERE c.ativo = 1
    `);
    return (result.values ?? []).filter((c) => c.valor_mensalidade > 0);
  },

  async findByCompetencia(competencia: string): Promise<Cobranca[]> {
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM cobrancas WHERE competencia = ? ORDER BY vencimento',
      [competencia],
    );
    return result.values ?? [];
  },

  async inserirCobrancasEmLote(cobrancas: Omit<Cobranca, 'id'>[]): Promise<void> {
    if (!cobrancas.length) return;

    const db = await getDB();

    await db.executeSet([
      {
        statement: `
        INSERT INTO cobrancas (
          cliente_id,
          valor_mensalidade,
          vencimento,
          data_pagamento,
          competencia
        )
        VALUES (?, ?, ?, ?, ?)
      `,
        values: cobrancas.map((c) => [
          c.cliente_id,
          c.valor_mensalidade,
          c.vencimento,
          c.data_pagamento ?? null,
          c.competencia,
        ]),
      },
    ]);

    await saveDB();
  },

  async atualizarStatusPagamento(id: number, dataPagamento: string | null): Promise<void> {
    const db = await getDB();
    await db.run('UPDATE cobrancas SET data_pagamento = ? WHERE id = ?', [
      dataPagamento ?? null,
      id,
    ]);
    await saveDB();
  },

  async adicionarCobrancaExtra(idCobranca: number, motivo: string, valor: number): Promise<void> {
    const db = await getDB();
    await db.run('INSERT INTO cobrancas_extras (id_cobranca, motivo, valor) VALUES (?, ?, ?)', [
      idCobranca,
      motivo,
      valor,
    ]);
    await saveDB();
  },

  async findExtrasByCobranca(idCobranca: number): Promise<CobrancaExtra[]> {
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM cobrancas_extras WHERE id_cobranca = ? ORDER BY id DESC',
      [idCobranca],
    );
    return result.values ?? [];
  },
};
