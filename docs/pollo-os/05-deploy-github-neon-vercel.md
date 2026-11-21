# Pollo OS — ver a construção ao vivo e publicar (GitHub → Neon → Vercel)

O Pollo OS é construído aqui, com o Claude, e guardado no GitHub
(`agenciarhodes-source/pollo-os`). Para acompanhar a construção há dois jeitos, e eles se
completam.

## 1. Ao vivo, enquanto construímos (no computador)

O app roda no seu computador (`npm run dev`) e aparece no navegador do próprio Claude, ao lado da
conversa. Cada mudança aparece na tela em um ou dois segundos, sem publicar nada. É o jeito mais
rápido de ajustar o visual.

- Custo: zero.
- Só você vê, e só enquanto o computador está ligado com o app rodando.

## 2. Online, com um link (Vercel + GitHub)

A Vercel fica ligada ao repositório do GitHub. A cada envio (`git push`):

- a branch `main` vira o **link principal** (ex.: `pollo-os.vercel.app`);
- qualquer outra branch ganha um **link de prévia** próprio, bom para testar uma tela nova antes
  de levar para a `main`.

Dá para abrir no celular e mandar o link para outra pessoa ver.

### Planos gratuitos: servem para a fase de construção

| | Plano grátis | Suficiente agora? | Quando trocar |
| --- | --- | --- | --- |
| **Vercel Hobby** | Publicações ilimitadas, links de prévia, domínio `.vercel.app` | Sim | **Antes de vender**: o Hobby não permite uso comercial e só roda tarefas agendadas uma vez por dia. Aí passa para o Pro. |
| **Neon Free** | 0,5 GB de banco, branches (cópias do banco para teste), pausa sozinho quando ninguém usa | Sim | Quando o banco passar de 0,5 GB ou tiver clientes usando de verdade (a pausa deixa o primeiro acesso um pouco lento). |

Como você já tem conta na Vercel e no Neon, dá para criar os dois projetos daqui, pelas
integrações desta conversa.

## 3. Montagem (feita uma vez)

1. **Neon**: projeto `pollo-os`, região AWS São Paulo (`sa-east-1`), com a extensão `vector`
   ligada (`CREATE EXTENSION IF NOT EXISTS vector;`).
2. **Vercel**: projeto importado do repositório do GitHub. Framework detectado sozinho.
3. **Ligação Neon ↔ Vercel**: pela integração do Neon na Vercel. Ela cria as variáveis
   `DATABASE_URL` e `DATABASE_URL_UNPOOLED` e, para cada link de prévia, um banco separado, para
   um teste nunca mexer nos dados da `main`.
4. **Variáveis de ambiente** na Vercel (Settings → Environment Variables): as do
   [mapa do backend](06-mapa-da-estrutura.md#3-variáveis-de-ambiente). Gere `KEY_ENCRYPTION_KEY`
   com `openssl rand -base64 32` e **guarde uma cópia**: sem ela, as credenciais salvas no banco
   não abrem mais.
5. **Build Command**: `npm run db:migrate && npm run build`, para cada publicação aplicar as
   mudanças do banco antes de subir.

Nunca envie para o GitHub um arquivo `.env` com chaves de verdade: elas ficam só na Vercel e no
seu computador (`.env.local`, que o Git ignora).

## 4. Antes de vender

- [ ] Vercel no plano **Pro** e Neon num plano pago (sem pausa).
- [ ] Domínio próprio (`app.seudominio.com.br`) em Settings → Domains.
- [ ] Login com Google: `https://SEU-DOMINIO/api/auth/callback/google` nas URLs autorizadas.
- [ ] Stripe: webhook para `https://SEU-DOMINIO/api/webhooks/stripe` com os eventos
      `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`, testado no
      modo de teste.
- [ ] Termos de uso e política de privacidade revisados por advogado (LGPD).
- [ ] Teste de isolamento: com duas empresas, uma não consegue ver nada da outra.
- [ ] Teste de aprovação: um Bot nunca age fora do Pollo OS sem o "Aprovar".
- [ ] Limite de gasto nos consoles da Anthropic e da OpenAI.
- [ ] Backup: retenção de histórico ligada no Neon.
- [ ] Emissão de nota fiscal ligada às assinaturas (NFE.io, eNotas ou similar).
