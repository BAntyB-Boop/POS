import { eq } from 'drizzle-orm';
import { db, sqlite } from './index';
import { categories, orderItems, orders, products, stockMovements, users } from './schema';

const FORCE = process.argv.includes('--force');

function ean13(base12: string): string {
  const digits = base12.split('').map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return base12 + String(check);
}

const CATEGORY_DEFS = [
  { slug: 'drink', name: 'เครื่องดื่ม', icon: '🥤' },
  { slug: 'snack', name: 'ขนม', icon: '🍪' },
  { slug: 'fresh', name: 'ของสด', icon: '🥚' },
  { slug: 'dry', name: 'อาหารแห้ง', icon: '🍜' },
  { slug: 'home', name: 'ของใช้ในบ้าน', icon: '🧴' },
  { slug: 'candy', name: 'ลูกอม', icon: '🍬' },
] as const;

type CategorySlug = (typeof CATEGORY_DEFS)[number]['slug'];

// [name, price in baht, category slug, opening stock, icon]
const PRODUCT_DEFS: Array<[string, number, CategorySlug, number, string]> = [
  ['น้ำดื่มสิงห์', 7, 'drink', 48, '💧'],
  ['โค้ก กระป๋อง', 15, 'drink', 30, '🥤'],
  ['เอ็ม-150', 12, 'drink', 24, '🧃'],
  ['นมกล่องจืด', 18, 'drink', 20, '🥛'],
  ['กาแฟกระป๋อง', 20, 'drink', 18, '☕'],
  ['ชาเขียวขวด', 20, 'drink', 15, '🍵'],
  ['มันฝรั่งเลย์', 20, 'snack', 22, '🥔'],
  ['ปลาเส้นทาโร่', 10, 'snack', 40, '🐟'],
  ['บิสกิตแครกเกอร์', 12, 'snack', 16, '🍘'],
  ['สาหร่ายเถ้าแก่น้อย', 22, 'snack', 14, '🍙'],
  ['ไข่ไก่ เบอร์ 2', 5, 'fresh', 60, '🥚'],
  ['นมสดพาสเจอร์ไรส์', 25, 'fresh', 12, '🥛'],
  ['เต้าหู้ไข่', 10, 'fresh', 8, '🧈'],
  ['มาม่าต้มยำ', 6, 'dry', 80, '🍜'],
  ['ข้าวสารหอมมะลิ 1กก.', 48, 'dry', 10, '🍚'],
  ['น้ำปลาทิพรส', 35, 'dry', 9, '🫙'],
  ['น้ำมันพืช 1ล.', 58, 'dry', 6, '🛢️'],
  ['น้ำตาลทราย 1กก.', 28, 'dry', 11, '🥄'],
  ['สบู่โพรเทคส์', 15, 'home', 20, '🧼'],
  ['ยาสีฟันคอลเกต', 42, 'home', 7, '🪥'],
  ['ผงซักฟอกซอง', 10, 'home', 26, '🧺'],
  ['กระดาษทิชชู่', 25, 'home', 13, '🧻'],
  ['ไฟแช็ก', 10, 'home', 34, '🔥'],
  ['หมากฝรั่งล็อตเต้', 5, 'candy', 50, '🫧'],
  ['ลูกอมมิ้นต์', 8, 'candy', 44, '🍬'],
  ['เยลลี่ผลไม้', 10, 'candy', 30, '🐻'],
];

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

    const admin = tx
      .insert(users)
      .values({ username: 'admin', passwordHash: adminPasswordHash, name: 'Admin', role: 'admin' })
      .returning()
      .get();

    tx.insert(users)
      .values({ username: 'cashier', passwordHash: cashierPasswordHash, name: 'Cashier', role: 'cashier' })
      .run();

    const categoryIdBySlug = new Map<CategorySlug, number>();
    for (const def of CATEGORY_DEFS) {
      const row = tx.insert(categories).values({ name: def.name, icon: def.icon }).returning().get();
      categoryIdBySlug.set(def.slug, row.id);
    }

    PRODUCT_DEFS.forEach(([name, priceBaht, slug, stock, icon], index) => {
      const salePrice = priceBaht * 100;
      const costPrice = Math.round(salePrice * 0.72);
      const barcode = ean13('885' + String(index + 1).padStart(9, '0'));
      const categoryId = categoryIdBySlug.get(slug);
      if (!categoryId) throw new Error(`Unknown category slug: ${slug}`);

      const product = tx
        .insert(products)
        .values({ categoryId, barcode, name, costPrice, salePrice, quantityInStock: stock, icon })
        .returning()
        .get();

      if (stock > 0) {
        tx.insert(stockMovements)
          .values({
            productId: product.id,
            userId: admin.id,
            type: 'in',
            quantity: stock,
            reason: 'Opening stock',
          })
          .run();
      }
    });
  });

  console.log(`Seeded ${CATEGORY_DEFS.length} categories and ${PRODUCT_DEFS.length} products.`);
  console.log('Users: admin/admin123 (admin), cashier/cashier123 (cashier)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sqlite.close());
