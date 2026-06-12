import { getDB, saveDB } from '../connection';

export interface Ajuste {
  id?: number;
  valor_mensalidade: number;
  dia_vencimento: number;
}

export const AjusteRepository = {
  async find(): Promise<Ajuste | null> {
    const db = await getDB();
    const result = await db.query('SELECT * FROM ajustes LIMIT 1');
    return result.values?.[0] ?? null;
  },

  async create(ajuste: Omit<Ajuste, 'id'>): Promise<void> {
    const db = await getDB();
    await db.run(
      'INSERT INTO ajustes (valor_mensalidade, dia_vencimento) VALUES (?, ?)',
      [ajuste.valor_mensalidade, ajuste.dia_vencimento]
    );
    await saveDB();
  },

  async update(id: number, ajuste: Partial<Ajuste>): Promise<void> {
    const db = await getDB();
    await db.run(
      'UPDATE ajustes SET valor_mensalidade = ?, dia_vencimento = ? WHERE id = ?',
      [
        ajuste.valor_mensalidade ?? null,
        ajuste.dia_vencimento ?? null,
        id
      ]
    );
    await saveDB();
  },

  async save(ajuste: Omit<Ajuste, 'id'>): Promise<void> {
    const existing = await this.find();
    if (existing) {
      await this.update(existing.id ?? 0, ajuste);
    } else {
      await this.create(ajuste);
    }
  }
};