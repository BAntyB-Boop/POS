import { and, eq, like, lte, or, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { categories, orderItems, products, stockMovements } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

export const productsModule = new Elysia({ prefix: '/products' })
  .use(authPlugin)
  .get(
    '/',
    ({ query }) => {
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 20, 200);
      const offset = (page - 1) * limit;

      const conditions = [];
      if (query.search) {
        conditions.push(or(like(products.name, `%${query.search}%`), eq(products.barcode, query.search)));
      }
      if (query.category_id !== undefined) {
        conditions.push(eq(products.categoryId, query.category_id));
      }
      if (query.low_stock) {
        conditions.push(lte(products.quantityInStock, products.reorderLevel));
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const items = db.select().from(products).where(where).limit(limit).offset(offset).all();
      const total =
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(where)
          .get()?.count ?? 0;

      return toSnakeCase({ items, total, page, limit });
    },
    {
      auth: true,
      query: t.Object({
        search: t.Optional(t.String()),
        category_id: t.Optional(t.Numeric()),
        low_stock: t.Optional(t.BooleanString()),
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
      }),
    },
  )
  .get(
    '/barcode/:barcode',
    ({ params }) => {
      const row = db.select().from(products).where(eq(products.barcode, params.barcode)).get();
      if (!row) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      return toSnakeCase(row);
    },
    { auth: true, params: t.Object({ barcode: t.String() }) },
  )
  .get(
    '/:id',
    ({ params }) => {
      const row = db.select().from(products).where(eq(products.id, params.id)).get();
      if (!row) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      return toSnakeCase(row);
    },
    { auth: true, params: t.Object({ id: t.Numeric() }) },
  )
  .post(
    '/',
    ({ body, set, user }) => {
      const dup = db.select().from(products).where(eq(products.barcode, body.barcode)).get();
      if (dup) throw new AppError(409, 'BARCODE_TAKEN', 'Barcode already in use');

      const category = db.select().from(categories).where(eq(categories.id, body.category_id)).get();
      if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

      const initialStock = body.quantity_in_stock ?? 0;

      const created = db.transaction((tx) => {
        const product = tx
          .insert(products)
          .values({
            categoryId: body.category_id,
            barcode: body.barcode,
            name: body.name,
            description: body.description,
            costPrice: body.cost_price,
            salePrice: body.sale_price,
            quantityInStock: initialStock,
            reorderLevel: body.reorder_level ?? 5,
            imageUrl: body.image_url,
            icon: body.icon ?? '',
          })
          .returning()
          .get();

        if (initialStock > 0) {
          tx.insert(stockMovements)
            .values({
              productId: product.id,
              userId: Number(user.sub),
              type: 'in',
              quantity: initialStock,
              reason: 'Initial stock',
            })
            .run();
        }

        return product;
      });

      set.status = 201;
      return toSnakeCase(created);
    },
    {
      auth: 'admin',
      body: t.Object({
        category_id: t.Numeric(),
        barcode: t.String({ minLength: 1 }),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        cost_price: t.Integer({ minimum: 0 }),
        sale_price: t.Integer({ minimum: 0 }),
        quantity_in_stock: t.Optional(t.Integer({ minimum: 0 })),
        reorder_level: t.Optional(t.Integer({ minimum: 0 })),
        image_url: t.Optional(t.String()),
        icon: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    '/:id',
    ({ params, body, user }) => {
      const existing = db.select().from(products).where(eq(products.id, params.id)).get();
      if (!existing) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

      if (body.barcode && body.barcode !== existing.barcode) {
        const dup = db.select().from(products).where(eq(products.barcode, body.barcode)).get();
        if (dup) throw new AppError(409, 'BARCODE_TAKEN', 'Barcode already in use');
      }

      if (body.category_id !== undefined) {
        const category = db.select().from(categories).where(eq(categories.id, body.category_id)).get();
        if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }

      const updated = db.transaction((tx) => {
        let finalStock = existing.quantityInStock;

        if (body.quantity_in_stock !== undefined && body.quantity_in_stock !== existing.quantityInStock) {
          finalStock = body.quantity_in_stock;
          const delta = finalStock - existing.quantityInStock;

          tx.insert(stockMovements)
            .values({
              productId: existing.id,
              userId: Number(user.sub),
              type: 'adjustment',
              quantity: delta,
              reason: 'Manual adjustment via product edit',
            })
            .run();
        }

        return tx
          .update(products)
          .set({
            categoryId: body.category_id,
            barcode: body.barcode,
            name: body.name,
            description: body.description,
            costPrice: body.cost_price,
            salePrice: body.sale_price,
            quantityInStock: finalStock,
            reorderLevel: body.reorder_level,
            imageUrl: body.image_url,
            icon: body.icon,
            updatedAt: new Date(),
          })
          .where(eq(products.id, params.id))
          .returning()
          .get();
      });

      return toSnakeCase(updated);
    },
    {
      auth: 'admin',
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        category_id: t.Optional(t.Numeric()),
        barcode: t.Optional(t.String({ minLength: 1 })),
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        cost_price: t.Optional(t.Integer({ minimum: 0 })),
        sale_price: t.Optional(t.Integer({ minimum: 0 })),
        quantity_in_stock: t.Optional(t.Integer({ minimum: 0 })),
        reorder_level: t.Optional(t.Integer({ minimum: 0 })),
        image_url: t.Optional(t.String()),
        icon: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/:id',
    ({ params }) => {
      const existing = db.select().from(products).where(eq(products.id, params.id)).get();
      if (!existing) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

      const movementCount = db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.productId, params.id))
        .all().length;
      const orderItemCount = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.productId, params.id))
        .all().length;
      if (movementCount > 0 || orderItemCount > 0) {
        throw new AppError(409, 'PRODUCT_IN_USE', 'Product has related stock movements or orders');
      }

      db.delete(products).where(eq(products.id, params.id)).run();
      return { success: true };
    },
    { auth: 'admin', params: t.Object({ id: t.Numeric() }) },
  );
