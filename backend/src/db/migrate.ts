import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db, sqlite } from './index';

migrate(db, { migrationsFolder: './drizzle' });

console.log('Migrations applied.');

sqlite.close();
