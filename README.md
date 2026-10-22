# Kami Sushi · Pedidos online

Site de pedidos do Kami Sushi (React + Vite), com painel da cozinha em `/admin`.
Pedidos e login da equipe ficam no Supabase; o site é publicado na Netlify.

## Rodar no computador

```bash
npm install
npm run dev
```

Crie um arquivo `.env` a partir do `.env.example` com a URL e a chave
publishable do Supabase. Sem ele, o site roda em modo de teste local
(pedidos só no navegador, painel com PIN `1234`).

## Onde mudar as coisas

- Cardápio e preços: `src/data/menu.js`
- Horário, Pix, WhatsApp, mesas e taxas de entrega: `src/config.js`
- Banco de dados (tabela e permissões): `supabase/schema.sql`

## Netlify

Build: `npm run build` · Pasta publicada: `dist` (já configurado em `netlify.toml`).
Em *Site configuration > Environment variables*, cadastre
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
