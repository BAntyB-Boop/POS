import { db } from './src/db';
import { orders } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  const allOrders = db.select().from(orders).all();
  console.log('All orders in DB:', allOrders);

  if (allOrders.length === 0) {
    console.log('No orders in DB.');
    return;
  }

  // Use the time of the first order to test query
  const firstOrderTime = allOrders[0].createdAt.getTime();
  const d = new Date(firstOrderTime);
  const fromMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const toMs = fromMs + 86400000;

  console.log(`Querying range: ${fromMs} to ${toMs} (${new Date(fromMs).toLocaleString()} to ${new Date(toMs).toLocaleString()})`);

  const rows = db.all<{ hour: string; revenue: number; order_count: number }>(sql`
    select strftime('%H', ${orders.createdAt} / 1000, 'unixepoch', '+7 hours') as hour,
           coalesce(sum(${orders.totalAmount}), 0) as revenue,
           count(*) as order_count
    from ${orders}
    where ${orders.createdAt} >= ${fromMs} and ${orders.createdAt} < ${toMs}
    group by hour
    order by hour
  `);

  console.log('Query result:', rows);
}

run().catch(console.error);
