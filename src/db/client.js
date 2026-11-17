import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

let sql;
let activeUrl;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL não configurada.');
    error.code = 'DATABASE_URL_MISSING';
    throw error;
  }
  let parsedUrl;
  try { parsedUrl = new URL(databaseUrl); }
  catch {
    const error = new Error('DATABASE_URL inválida.');
    error.code = 'DATABASE_URL_INVALID';
    throw error;
  }
  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    const error = new Error('DATABASE_URL precisa ser uma URL PostgreSQL válida.');
    error.code = 'DATABASE_URL_INVALID';
    throw error;
  }
  if (!sql || activeUrl !== databaseUrl) {
    sql = neon(databaseUrl);
    activeUrl = databaseUrl;
  }
  return sql;
}
