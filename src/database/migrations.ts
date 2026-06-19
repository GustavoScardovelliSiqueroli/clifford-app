import { getDB } from './connection';

export async function runMigrations(): Promise<void> {
  const db = await getDB();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clientes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL UNIQUE,
      telefone   TEXT,
      birth_date TEXT,
      obs        TEXT,
      ativo      INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_DATE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ajustes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      valor_mensalidade REAL,
      dia_vencimento INTEGER
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS mensalidade_config (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
      valor          REAL,
      dia_vencimento INTEGER
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cobrancas (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id        INTEGER NOT NULL REFERENCES clientes(id),
      valor_mensalidade REAL    NOT NULL,
      vencimento        TEXT    NOT NULL,
      data_pagamento    TEXT,
      competencia       TEXT    NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cobrancas_extras (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cobranca INTEGER NOT NULL REFERENCES cobrancas(id),
      motivo      TEXT    NOT NULL,
      valor       REAL    NOT NULL,
      created_at  TEXT    DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Migrations executadas');
}
