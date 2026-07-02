import { and, asc, desc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { categories, orderItems, orders, products, users } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { currentBangkokMonthRange, parseDateRange } from '../lib/dates';
import { orderListSelection } from './orders';
import { authPlugin } from '../plugins/auth';

function resolvePeriod(from?: string, to?: string): { fromMs: number; toMs: number } {
  if (!from && !to) return currentBangkokMonthRange();
  const range = parseDateRange(from, to);
  return { fromMs: range.fromMs ?? 0, toMs: range.toMs ?? Number.MAX_SAFE_INTEGER };
}

const periodQuery = t.Object({
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
});

export const reportsModule = new Elysia({ prefix: '/reports' })
  .use(authPlugin)
  .get(
    '/summary',
    ({ query }) => {
      const { fromMs, toMs } = resolvePeriod(query.from, query.to);
      const range = and(gte(orders.createdAt, new Date(fromMs)), lt(orders.createdAt, new Date(toMs)));

      const orderTotals = db
        .select({
          revenue: sql<number>`coalesce(sum(${orders.totalAmount}),0)`,
          orderCount: sql<number>`count(*)`,
        })
        .from(orders)
        .where(range)
        .get();

      const itemTotals = db
        .select({ itemsSold: sql<number>`coalesce(sum(${orderItems.quantity}),0)` })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(range)
        .get();

      const revenue = orderTotals?.revenue ?? 0;
      const orderCount = orderTotals?.orderCount ?? 0;
      const itemsSold = itemTotals?.itemsSold ?? 0;
      const avgPerOrder = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

      return toSnakeCase({ revenue, orderCount, itemsSold, avgPerOrder });
    },
    { auth: true, query: periodQuery },
  )
  .get(
    '/sales-over-time',
    ({ query }) => {
      const { fromMs, toMs } = resolvePeriod(query.from, query.to);

      const rows = db.all<{ day: string; revenue: number; order_count: number }>(sql`
        select strftime('%Y-%m-%d', ${orders.createdAt} / 1000, 'unixepoch', '+7 hours') as day,
               coalesce(sum(${orders.totalAmount}), 0) as revenue,
               count(*) as order_count
        from ${orders}
        where ${orders.createdAt} >= ${fromMs} and ${orders.createdAt} < ${toMs}
        group by day
        order by day
      `);

      return rows.map((row) => ({ date: row.day, revenue: row.revenue, order_count: row.order_count }));
    },
    { auth: true, query: periodQuery },
  )
  .get(
    '/top-products',
    ({ query }) => {
      const { fromMs, toMs } = resolvePeriod(query.from, query.to);
      const limit = query.limit ?? 5;

      const rows = db
        .select({
          productId: products.id,
          productName: products.name,
          quantitySold: sql<number>`coalesce(sum(${orderItems.quantity}),0)`,
          revenue: sql<number>`coalesce(sum(${orderItems.subtotal}),0)`,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(gte(orders.createdAt, new Date(fromMs)), lt(orders.createdAt, new Date(toMs))))
        .groupBy(products.id)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(limit)
        .all();

      return toSnakeCase(rows);
    },
    { auth: true, query: t.Object({ ...periodQuery.properties, limit: t.Optional(t.Numeric({ minimum: 1 })) }) },
  )
  .get(
    '/sales-by-category',
    ({ query }) => {
      const { fromMs, toMs } = resolvePeriod(query.from, query.to);

      const rows = db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          quantitySold: sql<number>`coalesce(sum(${orderItems.quantity}),0)`,
          revenue: sql<number>`coalesce(sum(${orderItems.subtotal}),0)`,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(gte(orders.createdAt, new Date(fromMs)), lt(orders.createdAt, new Date(toMs))))
        .groupBy(categories.id)
        .orderBy(desc(sql`sum(${orderItems.subtotal})`))
        .all();

      return toSnakeCase(rows);
    },
    { auth: true, query: periodQuery },
  )
  .get(
    '/low-stock',
    ({ query }) => {
      const limit = query.limit ?? 8;
      const rows = db
        .select()
        .from(products)
        .where(lte(products.quantityInStock, products.reorderLevel))
        .orderBy(asc(products.quantityInStock))
        .limit(limit)
        .all();

      return toSnakeCase(rows);
    },
    { auth: true, query: t.Object({ limit: t.Optional(t.Numeric({ minimum: 1 })) }) },
  )
  .get(
    '/profit',
    ({ query }) => {
      const { fromMs, toMs } = resolvePeriod(query.from, query.to);
      const range = and(gte(orders.createdAt, new Date(fromMs)), lt(orders.createdAt, new Date(toMs)));

      const totals = db
        .select({
          revenue: sql<number>`coalesce(sum(${orderItems.subtotal}),0)`,
          cost: sql<number>`coalesce(sum(${orderItems.costPriceAtSale} * ${orderItems.quantity}),0)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(range)
        .get();

      const revenue = totals?.revenue ?? 0;
      const cost = totals?.cost ?? 0;
      const profit = revenue - cost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;

      const byDay = db.all<{ day: string; revenue: number; cost: number }>(sql`
        select strftime('%Y-%m-%d', ${orders.createdAt} / 1000, 'unixepoch', '+7 hours') as day,
               coalesce(sum(${orderItems.subtotal}), 0) as revenue,
               coalesce(sum(${orderItems.costPriceAtSale} * ${orderItems.quantity}), 0) as cost
        from ${orderItems}
        inner join ${orders} on ${orderItems.orderId} = ${orders.id}
        where ${orders.createdAt} >= ${fromMs} and ${orders.createdAt} < ${toMs}
        group by day
        order by day
      `);

      return {
        revenue,
        cost,
        profit,
        margin,
        by_day: byDay.map((row) => ({
          date: row.day,
          revenue: row.revenue,
          cost: row.cost,
          profit: row.revenue - row.cost,
        })),
      };
    },
    { auth: 'admin', query: periodQuery },
  )
  .get(
    '/recent-orders',
    ({ query }) => {
      const limit = query.limit ?? 6;
      const rows = db
        .select({
          ...orderListSelection,
          itemsCount: sql<number>`(select count(*) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .all();

      return toSnakeCase(rows);
    },
    { auth: true, query: t.Object({ limit: t.Optional(t.Numeric({ minimum: 1 })) }) },
  );
