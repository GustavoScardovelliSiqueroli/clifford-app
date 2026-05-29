import { getDB, saveDB } from '../connection';

export interface Cliente {
  id?: number;
  nome: string;
  telefone?: string;
  birth_date?: string;
  obs: string;
  created_at?: string;
}

export const ClienteRepository = {
  async findAll(): Promise<Cliente[]> {
    const db = await getDB();
    const result = await db.query('SELECT * FROM clientes ORDER BY nome');
    return result.values ?? [];
  },

  async findById(id: number): Promise<Cliente | null> {
    const db = await getDB();
    const result = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
    return result.values?.[0] ?? null;
  },

  async create(cliente: Omit<Cliente, 'id'>): Promise<void> {
    const db = await getDB();
    await db.run(
      'INSERT INTO clientes (nome, telefone, birth_date, created_at, obs) VALUES (?, ?, ?, ?, ?)',
      [
        cliente.nome,
        cliente.telefone ?? null,
        cliente.birth_date ?? null,
        cliente.created_at ?? null,
        cliente.obs ?? null,
      ],
    );
    await saveDB();
  },

  async update(id: number, cliente: Partial<Cliente>): Promise<void> {
    const db = await getDB();
    await db.run(
      'UPDATE clientes SET nome = ?, telefone = ?, birth_date = ?, created_at = ? WHERE id = ?',
      [cliente.nome, cliente.telefone ?? null, cliente.birth_date ?? null, cliente.created_at, id],
    );
    await saveDB();
  },

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.run('DELETE FROM clientes WHERE id = ?', [id]);
    await saveDB();
  },
};
