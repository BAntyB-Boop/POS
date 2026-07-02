import { beforeAll, describe, expect, it } from 'bun:test';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from '../src/db';
import { categories, products, users } from '../src/db/schema';
import { app } from '../src/index';

let adminToken: string;
let cashierToken: string;
let productId: number;
const productBarcode = '1234567890128';

async function api(path: string, init?: RequestInit): Promise<Response> {
  return app.handle(new Request(`http://localhost${path}`, init));
}

async function json(res: Response): Promise<any> {
  return res.json();
}

async function login(username: string, password: string): Promise<string> {
  const res = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = (await res.json()) as { token: string };
  return body.token;
}

beforeAll(async () => {
  migrate(db, { migrationsFolder: './drizzle' });

  const adminHash = await Bun.password.hash('admin123', { algorithm: 'argon2id' });
  const cashierHash = await Bun.password.hash('cashier123', { algorithm: 'argon2id' });

  db.insert(users)
    .values([
      { username: 'admin', passwordHash: adminHash, name: 'Admin', role: 'admin' },
      { username: 'cashier', passwordHash: cashierHash, name: 'Cashier', role: 'cashier' },
    ])
    .run();

  const category = db.insert(categories).values({ name: 'Test Category' }).returning().get();

  const product = db
    .insert(products)
    .values({
      categoryId: category.id,
      barcode: productBarcode,
      name: 'Test Product',
      costPrice: 500,
      salePrice: 1000,
      quantityInStock: 10,
    })
    .returning()
    .get();
  productId = product.id;

  adminToken = await login('admin', 'admin123');
  cashierToken = await login('cashier', 'cashier123');
});

describe('auth', () => {
  it('logs in with valid credentials', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(typeof body.token).toBe('string');
    expect(body.user.role).toBe('admin');
  });

  it('rejects invalid credentials', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('products', () => {
  it('looks up a product by barcode', async () => {
    const res = await api(`/api/products/barcode/${productBarcode}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.id).toBe(productId);
  });

  it('404s for an unknown barcode', async () => {
    const res = await api('/api/products/barcode/0000000000000', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(404);
  });
});

describe('checkout', () => {
  it('completes a cash checkout, computes change, and decrements stock', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        items: [{ barcode: productBarcode, quantity: 3 }],
        payment_method: 'cash',
        received_amount: 5000,
      }),
    });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.total_amount).toBe(3000);
    expect(body.change_amount).toBe(2000);

    const productRes = await api(`/api/products/barcode/${productBarcode}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const product = await json(productRes);
    expect(product.quantity_in_stock).toBe(7);
  });

  it('rolls back the whole order on insufficient stock', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        items: [{ barcode: productBarcode, quantity: 999 }],
        payment_method: 'cash',
        received_amount: 999999,
      }),
    });
    expect(res.status).toBe(409);

    const productRes = await api(`/api/products/barcode/${productBarcode}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const product = await json(productRes);
    expect(product.quantity_in_stock).toBe(7);
  });
});

describe('role guards', () => {
  it('blocks unauthenticated requests', async () => {
    const res = await api('/api/products');
    expect(res.status).toBe(401);
  });

  it('blocks cashiers from admin-only routes', async () => {
    const res = await api('/api/users', { headers: { Authorization: `Bearer ${cashierToken}` } });
    expect(res.status).toBe(403);
  });

  it('blocks cashiers from the profit report', async () => {
    const res = await api('/api/reports/profit', { headers: { Authorization: `Bearer ${cashierToken}` } });
    expect(res.status).toBe(403);
  });

  it('allows admins to reach admin-only routes', async () => {
    const res = await api('/api/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
  });
});
