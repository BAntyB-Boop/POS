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
  // คั่นหลาย origin ด้วย comma เช่น "https://pos.vercel.app,http://localhost:5173"
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
