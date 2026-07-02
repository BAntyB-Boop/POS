import { beforeAll, describe, expect, it } from 'bun:test';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from '../src/db';
import { categories, products, users } from '../src/db/schema';
import { app } from '../src/index';

let adminToken: string;
let cashierToken: string;
let productId: number;
let categoryId: number;
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
  categoryId = category.id;

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

  it('updates product stock via PATCH', async () => {
    const res = await api(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ quantity_in_stock: 15 }),
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.quantity_in_stock).toBe(15);

    // Verify in db
    const productRes = await api(`/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const product = await json(productRes);
    expect(product.quantity_in_stock).toBe(15);

    // Restore stock back to 10
    const restoreRes = await api(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ quantity_in_stock: 10 }),
    });
    expect(restoreRes.status).toBe(200);
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

describe('product deletion', () => {
  it('archives (soft-deletes) a product with order/stock history instead of erroring', async () => {
    const res = await api(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.archived).toBe(true);

    // Hidden from the product list...
    const listRes = await api('/api/products', { headers: { Authorization: `Bearer ${adminToken}` } });
    const list = await json(listRes);
    expect(list.items.some((p: any) => p.id === productId)).toBe(false);

    // ...and from barcode lookup...
    const barcodeRes = await api(`/api/products/barcode/${productBarcode}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(barcodeRes.status).toBe(404);

    // ...but the row itself still exists (soft delete, not hard delete).
    const byIdRes = await api(`/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(byIdRes.status).toBe(200);
    const byId = await json(byIdRes);
    expect(byId.is_active).toBe(false);
  });

  it('blocks checkout against an archived product', async () => {
    const res = await api('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        items: [{ barcode: productBarcode, quantity: 1 }],
        payment_method: 'cash',
        received_amount: 1000,
      }),
    });
    expect(res.status).toBe(404);
  });

  it('hard-deletes a product with no order/stock history', async () => {
    const created = await api('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        category_id: categoryId,
        barcode: '1112223334445',
        name: 'Unused Product',
        cost_price: 100,
        sale_price: 200,
      }),
    });
    const { id } = await json(created);

    const res = await api(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.archived).toBe(false);

    const getRes = await api(`/api/products/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(getRes.status).toBe(404);
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
