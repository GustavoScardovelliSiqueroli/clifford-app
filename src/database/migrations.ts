import { getDB } from './connection';

export async function runMigrations(): Promise<void> {
  const db = await getDB();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clientes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nome      TEXT NOT NULL UNIQUE,
      telefone  TEXT,
      birth_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

  `);

  console.log('Migrations executadas');
}
