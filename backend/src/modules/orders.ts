import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { orderItems, orders, products, stockMovements, users } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { parseDateRange } from '../lib/dates';
import { applyStockDelta } from '../lib/stock';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

interface OrderLineInput {
  product_id?: number;
  barcode?: string;
  quantity: number;
}

interface ResolvedLine {
  product: typeof products.$inferSelect;
  quantity: number;
}

function resolveLines(lines: OrderLineInput[]): ResolvedLine[] {
  const merged = new Map<number, ResolvedLine>();

  for (const line of lines) {
    if (line.product_id === undefined && !line.barcode) {
      throw new AppError(400, 'VALIDATION', 'Each item requires product_id or barcode');
    }

    const product =
      line.product_id !== undefined
        ? db.select().from(products).where(eq(products.id, line.product_id)).get()
        : db.select().from(products).where(eq(products.barcode, line.barcode as string)).get();

    if (!product || !product.isActive) {
      throw new AppError(
        404,
        'PRODUCT_NOT_FOUND',
        `Product not found for ${line.product_id ?? line.barcode}`,
      );
    }

    const existing = merged.get(product.id);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(product.id, { product, quantity: line.quantity });
    }
  }

  return [...merged.values()];
}

export const orderListSelection = {
  id: orders.id,
  userId: orders.userId,
  cashierName: users.name,
  totalAmount: orders.totalAmount,
  paymentMethod: orders.paymentMethod,
  receivedAmount: orders.receivedAmount,
  changeAmount: orders.changeAmount,
  discount: orders.discount,
  description: orders.description,
  createdAt: orders.createdAt,
};

export const ordersModule = new Elysia({ prefix: '/orders' })
  .use(authPlugin)
  .post(
    '/',
    ({ body, user, set }) => {
      const lines = resolveLines(body.items);
      const subtotal = lines.reduce((sum, line) => sum + line.product.salePrice * line.quantity, 0);
      const discount = body.discount ?? 0;
      if (discount > subtotal) {
        throw new AppError(400, 'VALIDATION', 'discount cannot exceed order subtotal');
      }
      const total = subtotal - discount;

      let receivedAmount: number;
      let changeAmount: number;
      if (body.payment_method === 'cash') {
        if (body.received_amount === undefined || body.received_amount < total) {
          throw new AppError(400, 'VALIDATION', 'received_amount must be >= total for cash payments');
        }
        receivedAmount = body.received_amount;
        changeAmount = receivedAmount - total;
      } else {
        receivedAmount = total;
        changeAmount = 0;
      }

      const userId = Number(user.sub);

      const created = db.transaction((tx) => {
        const order = tx
          .insert(orders)
          .values({
            userId,
            totalAmount: total,
            paymentMethod: body.payment_method,
            receivedAmount,
            changeAmount,
            discount,
            description: body.description,
          })
          .returning()
          .get();

        const items = lines.map((line) => {
          applyStockDelta(tx, line.product.id, -line.quantity);

          const item = tx
            .insert(orderItems)
            .values({
              orderId: order.id,
              productId: line.product.id,
              quantity: line.quantity,
              costPriceAtSale: line.product.costPrice,
              unitPrice: line.product.salePrice,
              subtotal: line.product.salePrice * line.quantity,
            })
            .returning()
            .get();

          tx.insert(stockMovements)
            .values({
              productId: line.product.id,
              userId,
              type: 'out',
              quantity: -line.quantity,
              reason: `order #${order.id}`,
            })
            .run();

          return item;
        });

        return { ...order, items };
      });

      set.status = 201;
      return toSnakeCase(created);
    },
    {
      auth: true,
      body: t.Object({
        items: t.Array(
          t.Object({
            product_id: t.Optional(t.Numeric()),
            barcode: t.Optional(t.String()),
            quantity: t.Integer({ minimum: 1 }),
          }),
          { minItems: 1 },
        ),
        payment_method: t.Union([t.Literal('cash'), t.Literal('promptpay'), t.Literal('card')]),
        received_amount: t.Optional(t.Integer({ minimum: 0 })),
        discount: t.Optional(t.Integer({ minimum: 0 })),
        description: t.Optional(t.String()),
      }),
    },
  )
  .get(
    '/',
    ({ query }) => {
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 20, 200);
      const offset = (page - 1) * limit;
      const { fromMs, toMs } = parseDateRange(query.from, query.to);

      const conditions = [];
      if (query.payment_method) conditions.push(eq(orders.paymentMethod, query.payment_method));
      if (fromMs !== undefined) conditions.push(gte(orders.createdAt, new Date(fromMs)));
      if (toMs !== undefined) conditions.push(lt(orders.createdAt, new Date(toMs)));
      const where = conditions.length ? and(...conditions) : undefined;

      const items = db
        .select({
          ...orderListSelection,
          itemsCount: sql<number>`(select count(*) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      const total =
        db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(where)
          .get()?.count ?? 0;

      return toSnakeCase({ items, total, page, limit });
    },
    {
      auth: true,
      query: t.Object({
        payment_method: t.Optional(t.Union([t.Literal('cash'), t.Literal('promptpay'), t.Literal('card')])),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
      }),
    },
  )
  .get(
    '/:id',
    ({ params }) => {
      const order = db
        .select(orderListSelection)
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.id, params.id))
        .get();

      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');

      const items = db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          productName: products.name,
          quantity: orderItems.quantity,
          costPriceAtSale: orderItems.costPriceAtSale,
          unitPrice: orderItems.unitPrice,
          subtotal: orderItems.subtotal,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, params.id))
        .all();

      return toSnakeCase({ ...order, items });
    },
    { auth: true, params: t.Object({ id: t.Numeric() }) },
  );
