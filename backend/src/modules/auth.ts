import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users } from '../db/schema';
import { authPlugin } from '../plugins/auth';
import { AppError } from '../plugins/error';

export const authModule = new Elysia({ prefix: '/auth' })
  .use(authPlugin)
  .post(
    '/login',
    async ({ body, jwt }) => {
      const user = db.select().from(users).where(eq(users.username, body.username)).get();
      if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
      }

      const valid = await Bun.password.verify(body.password, user.passwordHash);
      if (!valid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
      }

      const token = await jwt.sign({ sub: String(user.id), role: user.role, name: user.name });

      return {
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .get(
    '/me',
    ({ user }) => {
      const row = db.select().from(users).where(eq(users.id, Number(user.sub))).get();
      if (!row) {
        throw new AppError(401, 'UNAUTHORIZED', 'User no longer exists');
      }
      return { id: row.id, username: row.username, name: row.name, role: row.role };
    },
    { auth: true },
  );
