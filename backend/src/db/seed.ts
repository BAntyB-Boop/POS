import { eq } from 'drizzle-orm';
import { db, sqlite } from './index';
import { categories, orderItems, orders, products, stockMovements, users } from './schema';

const FORCE = process.argv.includes('--force');

async function main() {
  const existingAdmin = db.select().from(users).where(eq(users.username, 'admin')).get();
  if (existingAdmin && !FORCE) {
    console.log('Database already seeded. Re-run with --force to wipe and reseed.');
    return;
  }

  const adminPasswordHash = await Bun.password.hash('admin123', { algorithm: 'argon2id' });
  const cashierPasswordHash = await Bun.password.hash('cashier123', { algorithm: 'argon2id' });

  db.transaction((tx) => {
    if (existingAdmin) {
      tx.delete(orderItems).run();
      tx.delete(orders).run();
      tx.delete(stockMovements).run();
      tx.delete(products).run();
      tx.delete(categories).run();
      tx.delete(users).run();
    }

    tx.insert(users)
      .values({ username: 'admin', passwordHash: adminPasswordHash, name: 'Admin', role: 'admin' })
      .run();

    tx.insert(users)
      .values({ username: 'cashier', passwordHash: cashierPasswordHash, name: 'Cashier', role: 'cashier' })
      .run();
  });

  console.log('Users: admin/admin123 (admin), cashier/cashier123 (cashier)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sqlite.close());
