import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'atelieDB';
let db: SQLiteDBConnection | null = null;

export async function getDB(): Promise<SQLiteDBConnection> {
  if (db) return db;

  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
  if (isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  }

  await db.open();
  await db.execute('PRAGMA foreign_keys = ON');
  return db;
}

export async function saveDB(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    await sqlite.saveToStore(DB_NAME);
  }
}

export async function closeConnection(): Promise<void> {
  if (db) {
    try {
      await db.close();
    } catch {
      // Ignore if already closed
    }
    db = null;
  }
  try {
    await sqlite.closeConnection(DB_NAME, false);
  } catch {
    // Ignore if already closed
  }
}
