import { and, eq, ne } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { orders, stockMovements, users } from '../db/schema';
import { toSnakeCase } from '../lib/case';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

const userView = {
  id: users.id,
  username: users.username,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
};

export const usersModule = new Elysia({ prefix: '/users' })
  .use(authPlugin)
  .get('/', () => toSnakeCase(db.select(userView).from(users).all()), { auth: 'admin' })
  .get(
    '/:id',
    ({ params }) => {
      const row = db.select(userView).from(users).where(eq(users.id, params.id)).get();
      if (!row) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      return toSnakeCase(row);
    },
    { auth: 'admin', params: t.Object({ id: t.Numeric() }) },
  )
  .post(
    '/',
    async ({ body, set }) => {
      const existing = db.select().from(users).where(eq(users.username, body.username)).get();
      if (existing) throw new AppError(409, 'USERNAME_TAKEN', 'Username already in use');

      const passwordHash = await Bun.password.hash(body.password, { algorithm: 'argon2id' });
      const created = db
        .insert(users)
        .values({ username: body.username, passwordHash, name: body.name, role: body.role })
        .returning(userView)
        .get();

      set.status = 201;
      return toSnakeCase(created);
    },
    {
      auth: 'admin',
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 6 }),
        name: t.String({ minLength: 1 }),
        role: t.Union([t.Literal('admin'), t.Literal('cashier')]),
      }),
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      const existing = db.select().from(users).where(eq(users.id, params.id)).get();
      if (!existing) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

      if (Object.keys(body).length === 0) {
        throw new AppError(400, 'VALIDATION', 'No fields to update');
      }

      if (body.username) {
        const dup = db
          .select()
          .from(users)
          .where(and(eq(users.username, body.username), ne(users.id, params.id)))
          .get();
        if (dup) throw new AppError(409, 'USERNAME_TAKEN', 'Username already in use');
      }

      const passwordHash = body.password
        ? await Bun.password.hash(body.password, { algorithm: 'argon2id' })
        : undefined;

      const updated = db
        .update(users)
        .set({
          username: body.username,
          name: body.name,
          role: body.role,
          ...(passwordHash ? { passwordHash } : {}),
        })
        .where(eq(users.id, params.id))
        .returning(userView)
        .get();

      return toSnakeCase(updated);
    },
    {
      auth: 'admin',
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        username: t.Optional(t.String({ minLength: 1 })),
        password: t.Optional(t.String({ minLength: 6 })),
        name: t.Optional(t.String({ minLength: 1 })),
        role: t.Optional(t.Union([t.Literal('admin'), t.Literal('cashier')])),
      }),
    },
  )
  .delete(
    '/:id',
    ({ params, user }) => {
      const existing = db.select().from(users).where(eq(users.id, params.id)).get();
      if (!existing) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

      if (Number(user.sub) === params.id) {
        throw new AppError(409, 'CANNOT_DELETE_SELF', 'Cannot delete your own account');
      }

      const orderCount = db.select().from(orders).where(eq(orders.userId, params.id)).all().length;
      const movementCount = db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.userId, params.id))
        .all().length;
      if (orderCount > 0 || movementCount > 0) {
        throw new AppError(409, 'USER_IN_USE', 'User has related orders or stock movements');
      }

      db.delete(users).where(eq(users.id, params.id)).run();
      return { success: true };
    },
    { auth: 'admin', params: t.Object({ id: t.Numeric() }) },
  );
