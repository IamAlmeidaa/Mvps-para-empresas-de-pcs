import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/client.js';

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));

function diagnoseDatabaseError(error) {
  const code = error?.code ?? error?.cause?.code ?? null;
  const detail = String(error?.message ?? '').toLowerCase();
  if (code === 'DATABASE_URL_INVALID') {
    return { database: 'invalid_configuration', cause: 'invalid_DATABASE_URL', message: 'A DATABASE_URL está configurada, mas não parece ser uma URL PostgreSQL válida.' };
  }
  const networkCodes = new Set(['ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENOTFOUND','EAI_AGAIN']);
  if (networkCodes.has(code) || /fetch failed|network|timeout|enotfound|eai_again/.test(detail)) {
    return { database: 'unavailable', cause: 'network_error', code, message: 'A DATABASE_URL está configurada, mas o Neon não respondeu. Verifique a rede e o endereço do banco.' };
  }
  return { database: 'unavailable', cause: 'database_connection_error', code, message: 'A DATABASE_URL está configurada, mas a conexão com o Neon falhou. Verifique a URL e as credenciais.' };
}

async function healthHandler(_req, res) {
  res.set('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL?.trim()) {
    return res.status(503).json({ status: 'error', database: 'not_configured', cause: 'missing_DATABASE_URL', message: 'DATABASE_URL não está configurada no ambiente do servidor.' });
  }
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    const diagnostic = diagnoseDatabaseError(error);
    console.error('Falha de saúde do Neon:', diagnostic.cause, diagnostic.code ?? '');
    return res.status(503).json({ status: 'error', ...diagnostic });
  }
}

app.get(['/health', '/api/health'], healthHandler);

app.post('/api/leads', async (req, res) => {
  const { name, email, store, message } = req.body ?? {};
  if (![name, email, store].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Informe nome, e-mail e loja.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return res.status(503).json({ error: 'O formulário está temporariamente indisponível: a conexão com o banco ainda não foi configurada.', cause: 'missing_DATABASE_URL' });
  }
  try {
    const sql = getDb();
    const [lead] = await sql`
      INSERT INTO leads (name, email, store, message)
      VALUES (${name.trim()}, ${email.trim()}, ${store.trim()}, ${typeof message === 'string' ? message.trim() : ''})
      RETURNING id
    `;
    return res.status(201).json({ ok: true, id: lead.id });
  } catch (error) {
    const diagnostic = diagnoseDatabaseError(error);
    console.error('Falha ao salvar contato:', diagnostic.cause, diagnostic.code ?? '');
    return res.status(503).json({ error: diagnostic.cause === 'network_error' ? 'O Neon não respondeu. Verifique a conexão e tente novamente.' : 'Não foi possível salvar seu interesse no banco. Tente novamente mais tarde.', cause: diagnostic.cause });
  }
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const isInvalidJson = error instanceof SyntaxError && Object.hasOwn(error, 'body');
  const status = isInvalidJson ? 400 : 500;
  console.error('Erro da API:', error.message);
  return res.status(status).json({ error: isInvalidJson ? 'Os dados enviados estão em formato inválido.' : 'Ocorreu um erro interno. Tente novamente.' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`PricePulse disponível em http://localhost:${port}`));
