import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { products, stockMovements, users } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { parseDateRange } from '../lib/dates';
import { applyStockDelta } from '../lib/stock';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

export const stockModule = new Elysia({ prefix: '/stock' })
  .use(authPlugin)
  .post(
    '/restock',
    ({ body, user }) => {
      const result = db.transaction((tx) => {
        const product = applyStockDelta(tx, body.product_id, body.quantity);
        tx.insert(stockMovements)
          .values({
            productId: body.product_id,
            userId: Number(user.sub),
            type: 'in',
            quantity: body.quantity,
            reason: body.reason,
          })
          .run();
        return product;
      });
      return toSnakeCase(result);
    },
    {
      auth: 'admin',
      body: t.Object({
        product_id: t.Numeric(),
        quantity: t.Integer({ minimum: 1 }),
        reason: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/adjust',
    ({ body, user }) => {
      if (body.quantity === 0) {
        throw new AppError(400, 'VALIDATION', 'quantity must be nonzero');
      }

      const result = db.transaction((tx) => {
        const product = applyStockDelta(tx, body.product_id, body.quantity);
        tx.insert(stockMovements)
          .values({
            productId: body.product_id,
            userId: Number(user.sub),
            type: 'adjustment',
            quantity: body.quantity,
            reason: body.reason,
          })
          .run();
        return product;
      });
      return toSnakeCase(result);
    },
    {
      auth: 'admin',
      body: t.Object({
        product_id: t.Numeric(),
        quantity: t.Integer(),
        reason: t.String({ minLength: 1 }),
      }),
    },
  )
  .post(
    '/damaged',
    ({ body, user }) => {
      const delta = -body.quantity;
      const result = db.transaction((tx) => {
        const product = applyStockDelta(tx, body.product_id, delta);
        tx.insert(stockMovements)
          .values({
            productId: body.product_id,
            userId: Number(user.sub),
            type: 'damaged',
            quantity: delta,
            reason: body.reason,
          })
          .run();
        return product;
      });
      return toSnakeCase(result);
    },
    {
      auth: 'admin',
      body: t.Object({
        product_id: t.Numeric(),
        quantity: t.Integer({ minimum: 1 }),
        reason: t.Optional(t.String()),
      }),
    },
  )
  .get(
    '/movements',
    ({ query }) => {
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 20, 200);
      const offset = (page - 1) * limit;
      const { fromMs, toMs } = parseDateRange(query.from, query.to);

      const conditions = [];
      if (query.product_id !== undefined) conditions.push(eq(stockMovements.productId, query.product_id));
      if (query.type) conditions.push(eq(stockMovements.type, query.type));
      if (fromMs !== undefined) conditions.push(gte(stockMovements.createdAt, new Date(fromMs)));
      if (toMs !== undefined) conditions.push(lt(stockMovements.createdAt, new Date(toMs)));
      const where = conditions.length ? and(...conditions) : undefined;

      const items = db
        .select({
          id: stockMovements.id,
          productId: stockMovements.productId,
          productName: products.name,
          userId: stockMovements.userId,
          userName: users.name,
          type: stockMovements.type,
          quantity: stockMovements.quantity,
          reason: stockMovements.reason,
          createdAt: stockMovements.createdAt,
        })
        .from(stockMovements)
        .innerJoin(products, eq(stockMovements.productId, products.id))
        .innerJoin(users, eq(stockMovements.userId, users.id))
        .where(where)
        .orderBy(desc(stockMovements.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      const total =
        db
          .select({ count: sql<number>`count(*)` })
          .from(stockMovements)
          .where(where)
          .get()?.count ?? 0;

      return toSnakeCase({ items, total, page, limit });
    },
    {
      auth: 'admin',
      query: t.Object({
        product_id: t.Optional(t.Numeric()),
        type: t.Optional(
          t.Union([t.Literal('in'), t.Literal('out'), t.Literal('adjustment'), t.Literal('damaged')]),
        ),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
      }),
    },
  );
