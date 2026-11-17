import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

let sql;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada. Copie .env.example para .env e informe a URL do Neon.');
  }
  sql ??= neon(process.env.DATABASE_URL);
  return sql;
}
