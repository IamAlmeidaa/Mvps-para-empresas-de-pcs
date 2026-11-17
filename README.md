# Sinal — inteligência de mercado para hardware

Página de apresentação e esqueleto de um serviço independente de monitoramento de preços e inteligência competitiva para lojas de hardware.

## Estrutura

```text
.
├── db/
│   └── schema.sql             # esquema inicial PostgreSQL
├── src/
│   ├── db/
│   │   ├── client.js          # cliente Neon via DATABASE_URL
│   │   └── init.js            # criação idempotente das tabelas
│   ├── public/
│   │   ├── app.js             # formulário e interações
│   │   ├── index.html         # página de apresentação
│   │   └── styles.css         # estilos responsivos
│   └── server.js              # servidor Express e API de contato
├── .env.example
├── .gitignore
└── package.json
```

## Rodar localmente

Requer Node.js 20 ou superior.

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env` e substitua `DATABASE_URL` pela connection string do Neon.
3. Crie as tabelas: `npm run db:init`.
4. Inicie o servidor: `npm run dev`.
5. Abra `http://localhost:3000`.

A URL está disponível no painel do projeto Neon em **Connect**. Use uma connection string com TLS (`sslmode=require`) e mantenha-a apenas no `.env`. Não coloque credenciais no código cliente nem versione o `.env`.

## Modelo inicial

- `stores`: lojas acompanhadas.
- `products`: catálogo monitorado.
- `price_observations`: histórico de preço em centavos, moeda, disponibilidade, origem e instante de observação.
- `alert_rules`: regras de alerta configuráveis.
- `leads`: contatos recebidos pela landing page.

O formulário faz `POST /api/leads` e grava no Neon após configurar a variável. O endpoint `/api/health` indica se o processo enxerga a configuração do banco; não executa uma consulta de disponibilidade do Neon.

## Escopo

A interface apresenta conceitos de produto sem divulgar resultados de clientes ou métricas inventadas. Coleta automatizada de preços, autenticação, gestão de lojas/produtos e envio real de alertas são etapas futuras; o banco apenas prepara a estrutura para elas.

