# Pollo OS — do Emergent para produção (GitHub → Neon → Vercel)

Roteiro para quando o app gerado pelo [prompt do Emergent](04-emergent-prompt.md) estiver pronto.

## 1. Exportar do Emergent para o GitHub

1. No projeto do Emergent, use **Save to GitHub** e conecte a sua conta do GitHub.
2. Crie um repositório **privado** (ex.: `pollo-os-app`). O código é o seu produto: não deixe
   público.
3. Confira no GitHub que vieram: `package.json`, `drizzle/` (migrations), `drizzle.config.ts`,
   `.env.example`, `vercel.json` e `LICENSE` (igual ao deste repositório).
4. Confira que **não** veio nenhum `.env` com chaves de verdade. Se veio, apague o arquivo, troque
   todas as chaves que estavam nele e adicione `.env*` (menos `.env.example`) ao `.gitignore`.

Antes de seguir, procure no código por `EMERGENT_LLM_KEY`, `emergentintegrations` ou `mongodb`.
Se aparecer, o Emergent desviou da stack pedida: isso precisa ser trocado antes de publicar
(peça a ele de novo ou traga o código para cá que eu adapto).

## 2. Banco no Neon

1. Em [console.neon.tech](https://console.neon.tech) crie um projeto `pollo-os`, região
   **AWS São Paulo (sa-east-1)**, Postgres 17.
2. No SQL Editor rode: `CREATE EXTENSION IF NOT EXISTS vector;` (memória com busca por sentido).
3. Copie as duas strings de conexão:
   - **com pooling** (host com `-pooler`) → `DATABASE_URL` (o app usa esta);
   - **sem pooling** → `DATABASE_URL_UNPOOLED` (as migrations usam esta).
4. Na sua máquina, com o repositório clonado:
   ```powershell
   npm install
   ```
   ```powershell
   npm run db:migrate
   ```
   ```powershell
   npm run db:seed
   ```
   (com as duas variáveis no `.env.local`). Confira as tabelas no painel do Neon, em Tables.

Atalho: a integração **Neon na Vercel** (passo 3) cria o banco e as variáveis sozinha, e ainda
cria um banco separado para cada versão de teste (branch). Se usar a integração, pule os itens 1
e 3 acima e só rode as migrations.

## 3. Publicar na Vercel

1. Em [vercel.com/new](https://vercel.com/new) importe o repositório do GitHub. Framework:
   Next.js (detecta sozinho).
2. **Plano**: a Vercel Hobby (grátis) não permite uso comercial e só roda cron uma vez por dia.
   Para vender, use o **Pro** (as rotinas a cada 5 minutos dependem disso).
3. Em Settings → Environment Variables, cadastre (Production e Preview):

   | Variável | De onde vem |
   | --- | --- |
   | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Neon (ou a integração cria) |
   | `AUTH_SECRET` | gere com `npx auth secret` |
   | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud Console → Credenciais → OAuth |
   | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | console da Anthropic e da OpenAI |
   | `KEY_ENCRYPTION_KEY` | 32 bytes aleatórios em base64 (`openssl rand -base64 32`) — **guarde uma cópia: se perder, as credenciais salvas no banco não abrem mais** |
   | `CRON_SECRET` | um texto aleatório longo |
   | `RESEND_API_KEY` | resend.com (convites e e-mails) |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | painel do Stripe |
   | `SUPERADMIN_EMAILS` | o seu e-mail |
   | `APP_URL` | o domínio final, ex.: `https://app.pollo.com.br` |

4. **Build Command**: `npm run db:migrate && npm run build`, para cada publicação aplicar as
   migrations antes de subir.
5. Clique em Deploy. A cada `git push` na `main` a Vercel publica de novo; cada pull request
   ganha um link de teste.

## 4. Ajustes depois da primeira publicação

- **Domínio**: Settings → Domains → `app.seudominio.com.br` (app) e `seudominio.com.br` (site).
- **Google OAuth**: adicione `https://SEU-DOMINIO/api/auth/callback/google` nas URLs de
  redirecionamento autorizadas.
- **Stripe**: crie o webhook apontando para `https://SEU-DOMINIO/api/webhooks/stripe` com os
  eventos `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`. Teste tudo no modo
  de teste antes de ligar o modo real.
- **Cron**: em Settings → Cron Jobs, confira que `/api/cron/routines` aparece e roda.
- **Resend**: verifique o domínio de envio (registros DNS) para os e-mails não caírem em spam.

## 5. Antes de vender

- [ ] Termos de uso e política de privacidade revisados por advogado (LGPD).
- [ ] Teste de isolamento: com duas contas de empresas diferentes, uma não pode ver nada da outra
      (troque o id na URL e veja se dá erro).
- [ ] Teste de aprovação: um Bot nunca envia e-mail sem o "Aprovar".
- [ ] Limite de gasto configurado nos consoles da Anthropic e da OpenAI.
- [ ] Backup: no Neon, ative a retenção de histórico (restauração para qualquer ponto).
- [ ] Monitoramento: Vercel Analytics e alertas de erro (Sentry, opcional).
- [ ] CNPJ e emissão de nota fiscal para as assinaturas (o Stripe cobra, mas não emite NF no Brasil;
      use um emissor como NFE.io ou eNotas ligado ao webhook).
