import { eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { categories, products } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

export const categoriesModule = new Elysia({ prefix: '/categories' })
  .use(authPlugin)
  .get(
    '/',
    () =>
      toSnakeCase(
        db
          .select({
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            productCount: sql<number>`count(${products.id})`,
          })
          .from(categories)
          .leftJoin(products, eq(products.categoryId, categories.id))
          .groupBy(categories.id)
          .all(),
      ),
    { auth: true },
  )
  .post(
    '/',
    ({ body, set }) => {
      const created = db.insert(categories).values({ name: body.name, icon: body.icon ?? '' }).returning().get();
      set.status = 201;
      return created;
    },
    { auth: 'admin', body: t.Object({ name: t.String({ minLength: 1 }), icon: t.Optional(t.String()) }) },
  )
  .patch(
    '/:id',
    ({ params, body }) => {
      const existing = db.select().from(categories).where(eq(categories.id, params.id)).get();
      if (!existing) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

      return db
        .update(categories)
        .set({ name: body.name, icon: body.icon })
        .where(eq(categories.id, params.id))
        .returning()
        .get();
    },
    {
      auth: 'admin',
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({ name: t.Optional(t.String({ minLength: 1 })), icon: t.Optional(t.String()) }),
    },
  )
  .delete(
    '/:id',
    ({ params }) => {
      const existing = db.select().from(categories).where(eq(categories.id, params.id)).get();
      if (!existing) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

      const productCount = db
        .select()
        .from(products)
        .where(eq(products.categoryId, params.id))
        .all().length;
      if (productCount > 0) {
        throw new AppError(409, 'CATEGORY_IN_USE', 'Category has products assigned to it');
      }

      db.delete(categories).where(eq(categories.id, params.id)).run();
      return { success: true };
    },
    { auth: 'admin', params: t.Object({ id: t.Numeric() }) },
  );
