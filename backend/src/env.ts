function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  JWT_SECRET: required('JWT_SECRET'),
  DB_FILE: process.env.DB_FILE ?? './data/pos.db',
};
