import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { env } from '../env';
import { AppError } from './error';

export interface AuthUser {
  sub: string;
  role: 'admin' | 'cashier';
  name: string;
}

export const authPlugin = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      exp: '12h',
    }),
  )
  .macro({
    auth: (required: true | 'admin') => {
      return {
        async resolve({ headers, jwt }) {
          const header = headers.authorization;
          const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
          if (!token) {
            throw new AppError(401, 'UNAUTHORIZED', 'Missing bearer token');
          }

          const payload = await jwt.verify(token);
          if (!payload) {
            throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
          }

          const user = payload as unknown as AuthUser;
          if (required === 'admin' && user.role !== 'admin') {
            throw new AppError(403, 'FORBIDDEN', 'Admin role required');
          }

          return { user };
        },
      };
    },
  });
