import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '../env';
import * as schema from './schema';

if (env.DB_FILE !== ':memory:') {
  mkdirSync(dirname(env.DB_FILE), { recursive: true });
}

export const sqlite = new Database(env.DB_FILE, { create: true });

sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec('PRAGMA busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });
