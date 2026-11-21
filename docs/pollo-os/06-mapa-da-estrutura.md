# Pollo OS — mapa do backend

As partes do Pollo OS que não dependem do visual: as rotas da API, as tabelas do banco e as
variáveis de ambiente. O front está sendo refeito do zero e vai consumir estas rotas.

---

## 1. Rotas da API (`app/api/`)

Toda rota checa: está logado → é membro da empresa → tem o papel necessário → está no limite do
plano. Erros voltam como `{ "error": "frase clara em português" }` com o status certo.

| Rota | Métodos | Para quê |
| --- | --- | --- |
| `auth/[...nextauth]` | GET, POST | login (Auth.js) |
| `orgs` | GET, POST | minhas empresas, criar empresa |
| `orgs/[slug]` | GET, PATCH | dados da empresa |
| `orgs/[slug]/bots` | GET, POST | listar e criar Bots |
| `orgs/[slug]/bots/[id]` | GET, PATCH, DELETE | ver, editar, arquivar |
| `orgs/[slug]/conversations` | GET, POST | listar e criar conversas |
| `orgs/[slug]/conversations/[id]/messages` | GET | histórico |
| `chat` | POST | streaming do Bot (maxDuration 300) |
| `orgs/[slug]/approvals` | GET | pendentes / decididas |
| `orgs/[slug]/approvals/[id]` | POST | aprovar ou recusar (com nota, "sempre permitir") |
| `orgs/[slug]/approval-rules` | GET, POST, DELETE | regras |
| `orgs/[slug]/routines` (+ `/[id]`, `/[id]/run`) | GET, POST, PATCH, DELETE | rotinas e "rodar agora" |
| `orgs/[slug]/goals` (+ `/[id]`) | GET, POST, PATCH | metas |
| `orgs/[slug]/skills` (+ `/[id]`) | GET, POST, PATCH, DELETE | habilidades |
| `orgs/[slug]/memories` (+ `/[id]`) | GET, PATCH, DELETE | memória |
| `cron/routines` | GET | executor das rotinas, exige `Bearer CRON_SECRET` |
| `orgs/[slug]/connections` (+ `/[id]`) | GET, POST, DELETE | conexões |
| `connections/google/callback` | GET | retorno do OAuth do Google |
| `orgs/[slug]/teams` (+ `/[id]`, `/[id]/members`) | GET, POST, PATCH, DELETE | times |
| `orgs/[slug]/invitations` | GET, POST, DELETE | convites |
| `invitations/[token]/accept` | POST | aceitar convite |
| `orgs/[slug]/members` (+ `/[id]`) | GET, PATCH, DELETE | pessoas e papéis |
| `orgs/[slug]/model-credentials` | GET, POST, DELETE | chave de IA própria |
| `orgs/[slug]/audit` | GET | auditoria; `?format=csv` exporta |
| `orgs/[slug]/notifications` | GET, PATCH | listar, marcar como lida |
| `orgs/[slug]/api-keys` | GET, POST, DELETE | chaves de API |
| `v1/bots/[id]/messages` | POST | API pública com chave `Bearer` |
| `orgs/[slug]/billing/checkout` | POST | abrir o Checkout do Stripe |
| `orgs/[slug]/billing/portal` | POST | abrir o Portal do cliente |
| `orgs/[slug]/usage` | GET | uso do mês contra o limite |
| `webhooks/stripe` | POST | atualiza assinatura e plano |
| `superadmin/orgs` | GET, PATCH | lista de empresas, estender teste |

---

## 2. Tabelas (`lib/db/schema/`)

Toda tabela de dados da empresa tem `organization_id`. 🔒 = guarda segredo criptografado.

| Arquivo | Tabelas |
| --- | --- |
| `auth.ts` | users, accounts, sessions, verification_tokens (as do Auth.js) |
| `orgs.ts` | organizations, memberships, invitations, teams, team_members |
| `bots.ts` | bots, bot_skills |
| `conversations.ts` | conversations, conversation_members, messages |
| `approvals.ts` | approvals, approval_rules |
| `skills.ts` | skills |
| `memory.ts` | memories (+ coluna `embedding vector(1536)` na Etapa 3) |
| `routines.ts` | routines, routine_runs, goals |
| `connections.ts` | connections 🔒, model_credentials 🔒 |
| `account.ts` | notifications, api_keys (só o hash), audit_events |
| `billing.ts` | subscriptions, usage_events |

Ligações principais:

```
organizations ─┬─ memberships ── users
               ├─ teams ── team_members ── users
               ├─ bots ─┬─ bot_skills ── skills
               │        ├─ memories
               │        ├─ routines ── routine_runs
               │        └─ goals
               ├─ conversations ─┬─ conversation_members (pessoa ou Bot)
               │                 └─ messages ── approvals
               ├─ connections, model_credentials
               ├─ audit_events, notifications, api_keys
               └─ subscriptions, usage_events
```

Índices que precisam existir: `organization_id` em todas; `messages(conversation_id, created_at)`;
`approvals(organization_id, status)`; `routines(enabled, next_run_at)`;
`usage_events(organization_id, created_at)`; `organizations(slug)` único;
`memberships(organization_id, user_id)` único.

---

## 3. Variáveis de ambiente

| Variável | Obrigatória |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | sim |
| `AUTH_SECRET` | sim |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | para login com Google |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | ao menos uma; OpenAI para embeddings |
| `KEY_ENCRYPTION_KEY` | sim — guardar cópia |
| `APP_URL` | sim |
| `CRON_SECRET` | sim |
| `RESEND_API_KEY` | para convites |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ESSENCIAL`, `STRIPE_PRICE_PROFISSIONAL` | para cobrar |
| `SUPERADMIN_EMAILS` | sim |

---

