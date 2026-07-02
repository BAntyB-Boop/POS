import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { env } from './env';
import { authModule } from './modules/auth';
import { categoriesModule } from './modules/categories';
import { ordersModule } from './modules/orders';
import { productsModule } from './modules/products';
import { reportsModule } from './modules/reports';
import { stockModule } from './modules/stock';
import { usersModule } from './modules/users';
import { errorPlugin } from './plugins/error';

const api = new Elysia({ prefix: '/api' })
  .use(authModule)
  .use(usersModule)
  .use(categoriesModule)
  .use(productsModule)
  .use(stockModule)
  .use(ordersModule)
  .use(reportsModule)
  .get('/health', () => ({ status: 'ok' }));

export const app = new Elysia()
  .use(errorPlugin)
  .use(cors({ origin: env.CORS_ORIGINS }))
  .use(swagger({ path: '/swagger' }))
  .use(api);

if (import.meta.main) {
  app.listen(env.PORT);
  console.log(`🦊 Meow Mart POS backend running at http://localhost:${env.PORT}`);
}

export type App = typeof app;
