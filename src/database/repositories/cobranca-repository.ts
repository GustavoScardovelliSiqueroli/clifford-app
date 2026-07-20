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

export interface CobrancaComExtras extends Cobranca {
  total_extras: number;
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

  async criar(dados: Omit<Cobranca, 'id'>): Promise<void> {
    const db = await getDB();
    await db.run(
      `INSERT INTO cobrancas (cliente_id, valor_mensalidade, vencimento, data_pagamento, competencia)
       VALUES (?, ?, ?, ?, ?)`,
      [
        dados.cliente_id,
        dados.valor_mensalidade,
        dados.vencimento,
        dados.data_pagamento ?? null,
        dados.competencia,
      ],
    );
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

  async estornarPagamento(id: number): Promise<void> {
    const db = await getDB();
    await db.run('UPDATE cobrancas SET data_pagamento = NULL WHERE id = ?', [id]);
    await saveDB();
  },

  async atualizar(id: number, campos: Partial<Cobranca>): Promise<void> {
    const sets: string[] = [];
    const valores: unknown[] = [];

    if (campos.valor_mensalidade !== undefined) {
      sets.push('valor_mensalidade = ?');
      valores.push(campos.valor_mensalidade);
    }
    if (campos.vencimento !== undefined) {
      sets.push('vencimento = ?');
      valores.push(campos.vencimento);
    }
    if (campos.data_pagamento !== undefined) {
      sets.push('data_pagamento = ?');
      valores.push(campos.data_pagamento);
    }

    if (!sets.length) return;

    const db = await getDB();
    await db.run(`UPDATE cobrancas SET ${sets.join(', ')} WHERE id = ?`, [...valores, id]);
    await saveDB();
  },

  async atualizarExtra(id: number, motivo: string, valor: number): Promise<void> {
    const db = await getDB();
    await db.run('UPDATE cobrancas_extras SET motivo = ?, valor = ? WHERE id = ?', [
      motivo,
      valor,
      id,
    ]);
    await saveDB();
  },

  async removerExtra(id: number): Promise<void> {
    const db = await getDB();
    await db.run('DELETE FROM cobrancas_extras WHERE id = ?', [id]);
    await saveDB();
  },

  async remover(id: number): Promise<void> {
    const db = await getDB();
    await db.run('DELETE FROM cobrancas_extras WHERE id_cobranca = ?', [id]);
    await db.run('DELETE FROM cobrancas WHERE id = ?', [id]);
    await saveDB();
  },

  async findByCompetenciaComExtras(competencia: string): Promise<CobrancaComExtras[]> {
    const db = await getDB();
    const result = await db.query(
      `
      SELECT
        c.*,
        COALESCE(SUM(ce.valor), 0) AS total_extras
      FROM cobrancas c
      LEFT JOIN cobrancas_extras ce ON c.id = ce.id_cobranca
      WHERE c.competencia = ?
      GROUP BY c.id
      ORDER BY c.vencimento
    `,
      [competencia],
    );
    return result.values ?? [];
  },
};
