import { Elysia } from 'elysia';

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errorPlugin = new Elysia({ name: 'error' }).onError(
  { as: 'global' },
  ({ error, code, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: { code: 'VALIDATION', message: error.message } };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    }

    console.error(error);
    set.status = 500;
    return { error: { code: 'INTERNAL', message: 'Internal server error' } };
  },
);
