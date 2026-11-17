import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/client.js';

const app = express();
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));

app.get('/api/health', async (_req, res) => {
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Falha na conexão com o Neon:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      message: 'Configure a conexão do banco e verifique se ele está acessível.',
    });
  }
});

app.post('/api/leads', async (req, res) => {
  const { name, email, store, message } = req.body ?? {};
  if (![name, email, store].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Informe nome, e-mail e loja.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }

  try {
    const sql = getDb();
    const [lead] = await sql`
      INSERT INTO leads (name, email, store, message)
      VALUES (${name.trim()}, ${email.trim()}, ${store.trim()}, ${typeof message === 'string' ? message.trim() : ''})
      RETURNING id
    `;
    res.status(201).json({ ok: true, id: lead.id });
  } catch (error) {
    console.error('Falha ao salvar contato:', error.message);
    res.status(503).json({ error: 'Não foi possível enviar agora. Tente novamente mais tarde.' });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Sinal Hardware disponível em http://localhost:${port}`));
