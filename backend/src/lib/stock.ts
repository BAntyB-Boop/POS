import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema';
import { AppError } from '../plugins/error';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Atomically applies a signed quantity delta to a product's stock within a
 * transaction. The WHERE-guarded UPDATE makes the check-and-decrement race-free:
 * a negative delta only commits if there is enough stock to cover it.
 */
export function applyStockDelta(tx: Tx, productId: number, delta: number) {
  const updated = tx
    .update(products)
    .set({
      quantityInStock: sql`${products.quantityInStock} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(
      delta < 0
        ? and(eq(products.id, productId), gte(products.quantityInStock, -delta))
        : eq(products.id, productId),
    )
    .returning()
    .get();

  if (!updated) {
    const exists = tx.select().from(products).where(eq(products.id, productId)).get();
    if (!exists) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    throw new AppError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available');
  }

  return updated;
}
