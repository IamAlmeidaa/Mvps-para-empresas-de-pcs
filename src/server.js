import 'dotenv/config';
import express from 'express';
import { getDb } from './db/client.js';

const app = express();
app.use(express.json());
app.use(express.static(new URL('./public', import.meta.url).pathname));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: Boolean(process.env.DATABASE_URL) }));
app.post('/api/leads', async (req, res) => {
  const { name, email, store, message } = req.body ?? {};
  if (![name, email, store].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Informe nome, e-mail e loja.' });
  }
  try {
    const sql = getDb();
    await sql`CREATE TABLE IF NOT EXISTS leads (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      store TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`INSERT INTO leads (name, email, store, message)
      VALUES (${name.trim()}, ${email.trim()}, ${store.trim()}, ${typeof message === 'string' ? message.trim() : ''})`;
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Falha ao salvar lead:', error.message);
    res.status(503).json({ error: 'Não foi possível enviar agora. Tente novamente mais tarde.' });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Sinal Hardware disponível em http://localhost:${port}`));
