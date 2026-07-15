import { getDB, saveDB } from '../connection';

export interface MensalidadeConfig {
  id?: number;
  cliente_id?: number;
  valor?: number | undefined;
  dia_vencimento?: number | undefined;
}

export interface Cliente {
  id?: number;
  nome: string;
  telefone?: string | undefined;
  birth_date?: string | undefined;
  obs: string;
  ativo: number;
  created_at?: string | undefined;
  mensalidade_config?: MensalidadeConfig | undefined;
}

interface ClienteRow {
  id: number;
  nome: string;
  telefone?: string;
  birth_date?: string;
  obs: string;
  ativo: number;
  created_at?: string;
  mensalidade_valor?: number;
  mensalidade_dia_vencimento?: number;
}

function mapRowToCliente(row: ClienteRow): Cliente {
  const config = row.mensalidade_valor != null || row.mensalidade_dia_vencimento != null
    ? { cliente_id: row.id, valor: row.mensalidade_valor, dia_vencimento: row.mensalidade_dia_vencimento } as MensalidadeConfig
    : undefined;
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    birth_date: row.birth_date,
    obs: row.obs,
    ativo: row.ativo,
    created_at: row.created_at,
    mensalidade_config: config,
  };
}

export const ClienteRepository = {
  async findAll(): Promise<Cliente[]> {
    const db = await getDB();
    const result = await db.query(`
      SELECT 
        c.*,
        mc.valor as mensalidade_valor,
        mc.dia_vencimento as mensalidade_dia_vencimento
      FROM clientes c
      LEFT JOIN mensalidade_config mc ON c.id = mc.cliente_id
      ORDER BY c.nome
    `);
    return (result.values ?? []).map((row: unknown) => mapRowToCliente(row as ClienteRow));
  },

  async findById(id: number): Promise<Cliente | null> {
    const db = await getDB();
    const result = await db.query(`
      SELECT 
        c.*,
        mc.valor as mensalidade_valor,
        mc.dia_vencimento as mensalidade_dia_vencimento
      FROM clientes c
      LEFT JOIN mensalidade_config mc ON c.id = mc.cliente_id
      WHERE c.id = ?
    `, [id]);
    const row = result.values?.[0] as ClienteRow | undefined;
    if (!row) return null;
    return mapRowToCliente(row);
  },

  async create(cliente: Omit<Cliente, 'id'>): Promise<void> {
    const db = await getDB();
    await db.run(
      'INSERT INTO clientes (nome, telefone, birth_date, created_at, obs, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      [
        cliente.nome,
        cliente.telefone ?? null,
        cliente.birth_date ?? null,
        cliente.created_at ?? null,
        cliente.obs ?? null,
        cliente.ativo ?? null,
      ],
    );
    // Get the last inserted ID
    const lastIdResult = await db.query('SELECT last_insert_rowid() as id');
    const clienteId = lastIdResult.values?.[0]?.id ?? 0;
    if (cliente.mensalidade_config?.valor != null || cliente.mensalidade_config?.dia_vencimento != null) {
      await db.run(
        'INSERT INTO mensalidade_config (cliente_id, valor, dia_vencimento) VALUES (?, ?, ?)',
        [clienteId, cliente.mensalidade_config.valor ?? null, cliente.mensalidade_config.dia_vencimento ?? null],
      );
    }
    await saveDB();
  },

  async update(id: number, cliente: Partial<Cliente>): Promise<void> {
    const db = await getDB();
    await db.run(
      'UPDATE clientes SET nome = ?, telefone = ?, birth_date = ?, created_at = ?, ativo = ? WHERE id = ?',
      [
        cliente.nome,
        cliente.telefone ?? null,
        cliente.birth_date ?? null,
        cliente.created_at ?? null,
        cliente.ativo ?? null,
        id,
      ],
    );
    // Handle mensalidade_config
    if (cliente.mensalidade_config !== undefined) {
      const existing = await db.query('SELECT id FROM mensalidade_config WHERE cliente_id = ?', [id]);
      if (existing.values?.length) {
        await db.run(
          'UPDATE mensalidade_config SET valor = ?, dia_vencimento = ? WHERE cliente_id = ?',
          [cliente.mensalidade_config.valor ?? null, cliente.mensalidade_config.dia_vencimento ?? null, id],
        );
      } else if (cliente.mensalidade_config.valor != null || cliente.mensalidade_config.dia_vencimento != null) {
        await db.run(
          'INSERT INTO mensalidade_config (cliente_id, valor, dia_vencimento) VALUES (?, ?, ?)',
          [id, cliente.mensalidade_config.valor ?? null, cliente.mensalidade_config.dia_vencimento ?? null],
        );
      }
    }
    await saveDB();
  },

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.run('DELETE FROM mensalidade_config WHERE cliente_id = ?', [id]);
    await db.run('DELETE FROM clientes WHERE id = ?', [id]);
    await saveDB();
  },
};
