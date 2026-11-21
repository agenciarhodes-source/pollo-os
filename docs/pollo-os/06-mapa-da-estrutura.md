# Pollo OS — mapa da estrutura

A planta do app que o Emergent vai gerar com o [prompt](04-emergent-prompt.md). Serve para três
coisas:

- **Conferir** o que o Emergent entregou em cada etapa (as pastas e rotas estão no lugar?);
- **Corrigir o rumo**: se ele inventar outra organização, cole o trecho deste mapa e peça para
  seguir;
- **Juntar depois**: quando o código vier para o GitHub, é este mapa que o Neon e a Vercel esperam.

A coluna **Etapa** diz em qual etapa do prompt cada parte nasce.

---

## 1. Pastas

```
pollo-os-app/
├─ app/
│  ├─ (site)/                      site público, sem login                    Etapa 6
│  │  ├─ page.tsx                  página de vendas
│  │  ├─ precos/page.tsx
│  │  ├─ termos/page.tsx
│  │  └─ privacidade/page.tsx
│  ├─ (auth)/                      telas de entrada                          Etapa 1
│  │  ├─ entrar/page.tsx
│  │  ├─ criar-conta/page.tsx
│  │  ├─ esqueci-a-senha/page.tsx
│  │  └─ convite/[token]/page.tsx                                            Etapa 4
│  ├─ onboarding/page.tsx                                                     Etapa 1
│  ├─ o/[slug]/                    tudo dentro de uma empresa (com menu lateral)
│  │  ├─ layout.tsx                menu lateral + topo (sino, "Precisa de você")
│  │  ├─ page.tsx                  Início
│  │  ├─ bots/…                    ver seção 2
│  │  ├─ c/[id]/page.tsx           conversa
│  │  ├─ aprovacoes/page.tsx                                                  Etapa 2
│  │  ├─ rotinas/…                                                            Etapa 3
│  │  ├─ habilidades/…                                                        Etapa 3
│  │  ├─ memoria/page.tsx                                                     Etapa 3
│  │  ├─ conexoes/…                                                           Etapa 4
│  │  ├─ times/…                                                              Etapa 4
│  │  ├─ admin/…                   menu próprio, só owner/admin               Etapa 5
│  │  └─ configuracoes/…           menu próprio                               Etapa 5
│  ├─ superadmin/…                 só SUPERADMIN_EMAILS                       Etapa 6
│  └─ api/                         ver seção 3
├─ components/
│  ├─ ui/                          shadcn/ui (não editar à mão)
│  ├─ layout/                      menu lateral, topo, troca de empresa
│  ├─ page/                        PageShell, PageSection, linha de lista (ItemRow)
│  ├─ chat/                        mensagens, caixa de texto, cartão de ferramenta
│  ├─ approvals/                   cartão de aprovação, lista
│  ├─ bots/  routines/  skills/  memory/  connections/  admin/  billing/
│  └─ empty-state.tsx
├─ lib/
│  ├─ db/
│  │  ├─ index.ts                  conexão (@neondatabase/serverless + Drizzle)
│  │  └─ schema/                   um arquivo por área (seção 4)
│  ├─ auth.ts                      Auth.js (e-mail/senha + Google)
│  ├─ org.ts                       pega a empresa da URL e checa se a pessoa é membro
│  ├─ crypto.ts                    AES-256-GCM com KEY_ENCRYPTION_KEY
│  ├─ audit.ts                     grava audit_events
│  ├─ plans.ts                     planos, preços e limites                   Etapa 6
│  ├─ limits.ts                    checa limite do plano no servidor          Etapa 6
│  ├─ bots/
│  │  ├─ run.ts                    monta o system prompt e chama o modelo
│  │  ├─ tools/                    uma ferramenta por arquivo, com needsApproval
│  │  └─ models.ts                 qual modelo e qual chave usar
│  ├─ mcp.ts                       cliente MCP (Servidor MCP personalizado)   Etapa 4
│  ├─ cron.ts                      cálculo do próximo horário (cron-parser)  Etapa 3
│  └─ email.ts                     Resend                                     Etapa 4
├─ drizzle/                        migrations geradas (versionadas no Git)
├─ scripts/seed.ts                 empresa demo, 2 Bots, 5 habilidades
├─ drizzle.config.ts
├─ vercel.json                     cron das rotinas
├─ .env.example
└─ LICENSE                         igual ao deste repositório
```

---

## 2. Telas

Todas debaixo de `/o/[slug]`. Linha de cima = menu lateral.

| Menu | Rota | O que tem | Etapa |
| --- | --- | --- | --- |
| Início | `/o/[slug]` | saudação, "Peça algo a um Bot", Precisa de você, conversas recentes | 1 |
| Bots | `/bots` | lista em linhas, botão "Novo Bot" (painel lateral) | 1 |
| | `/bots/[id]` | aba **Conversa** | 1 |
| | `/bots/[id]/configuracao` | nome, cargo, avatar, instruções, modelo, visibilidade | 1 |
| | `/bots/[id]/habilidades` | ligar/desligar habilidades | 3 |
| | `/bots/[id]/memoria` | o que este Bot lembra | 3 |
| | `/bots/[id]/rotinas` | rotinas e metas deste Bot | 3 |
| | `/bots/[id]/aplicativos` | conexões e ferramentas liberadas, quais pedem aprovação | 4 |
| | `/bots/[id]/aprovacoes` | pedidos deste Bot | 2 |
| | `/bots/[id]/atividade` | auditoria deste Bot | 1 |
| | `/bots/[id]/acesso` | quem pode usar | 1 |
| (conversas) | `/c/[id]` | chat com streaming, anexos, cartões de ferramenta e de aprovação | 1 |
| | `/c/nova` | escolher: com um Bot, Grupo ou Canal | 4 |
| Aprovações | `/aprovacoes` | abas Pendentes, Decididas, Regras | 2 |
| Rotinas | `/rotinas`, `/rotinas/nova`, `/rotinas/[id]` | lista, criar, histórico de execuções | 3 |
| Memória | `/memoria` | busca, filtro por Bot e pessoa | 3 |
| Habilidades | `/habilidades`, `/habilidades/nova`, `/habilidades/[slug]` | lista, editor Markdown | 3 |
| Conexões | `/conexoes`, `/conexoes/[provider]` | catálogo, conectar, detalhes | 4 |
| Times | `/times`, `/times/novo`, `/times/[id]` | times e membros | 4 |
| Admin | `/admin` | visão geral e consumo | 5 |
| | `/admin/pessoas` | convidar, papel, remover | 5 |
| | `/admin/modelos` | chave da plataforma ou própria, modelo padrão | 5 |
| | `/admin/aprovacoes` | regras da empresa | 2 |
| | `/admin/limites` | ferramentas bloqueadas, domínios permitidos | 5 |
| | `/admin/auditoria` | filtros, antes/depois, exportar CSV | 5 |
| | `/admin/empresa` | nome, slug, logo | 5 |
| | `/admin/plano` | plano, uso do mês, faturas | 6 |
| Configurações | `/configuracoes` | perfil | 5 |
| | `/configuracoes/notificacoes`, `/aparencia`, `/cofre`, `/chaves-de-api`, `/atividade` | | 5 |

Fora da empresa: `/entrar`, `/criar-conta`, `/esqueci-a-senha`, `/convite/[token]`,
`/onboarding`, o site público e `/superadmin`.

---

## 3. Rotas da API (`app/api/`)

Toda rota checa: está logado → é membro da empresa → tem o papel necessário → está no limite do
plano. Erros voltam como `{ "error": "frase clara em português" }` com o status certo.

| Rota | Métodos | Para quê | Etapa |
| --- | --- | --- | --- |
| `auth/[...nextauth]` | GET, POST | login (Auth.js) | 1 |
| `orgs` | GET, POST | minhas empresas, criar empresa | 1 |
| `orgs/[slug]` | GET, PATCH | dados da empresa | 1 |
| `orgs/[slug]/bots` | GET, POST | listar e criar Bots | 1 |
| `orgs/[slug]/bots/[id]` | GET, PATCH, DELETE | ver, editar, arquivar | 1 |
| `orgs/[slug]/conversations` | GET, POST | listar e criar conversas | 1 |
| `orgs/[slug]/conversations/[id]/messages` | GET | histórico | 1 |
| `chat` | POST | streaming do Bot (maxDuration 300) | 1 |
| `orgs/[slug]/approvals` | GET | pendentes / decididas | 2 |
| `orgs/[slug]/approvals/[id]` | POST | aprovar ou recusar (com nota, "sempre permitir") | 2 |
| `orgs/[slug]/approval-rules` | GET, POST, DELETE | regras | 2 |
| `orgs/[slug]/routines` (+ `/[id]`, `/[id]/run`) | GET, POST, PATCH, DELETE | rotinas e "rodar agora" | 3 |
| `orgs/[slug]/goals` (+ `/[id]`) | GET, POST, PATCH | metas | 3 |
| `orgs/[slug]/skills` (+ `/[id]`) | GET, POST, PATCH, DELETE | habilidades | 3 |
| `orgs/[slug]/memories` (+ `/[id]`) | GET, PATCH, DELETE | memória | 3 |
| `cron/routines` | GET | executor das rotinas, exige `Bearer CRON_SECRET` | 3 |
| `orgs/[slug]/connections` (+ `/[id]`) | GET, POST, DELETE | conexões | 4 |
| `connections/google/callback` | GET | retorno do OAuth do Google | 4 |
| `orgs/[slug]/teams` (+ `/[id]`, `/[id]/members`) | GET, POST, PATCH, DELETE | times | 4 |
| `orgs/[slug]/invitations` | GET, POST, DELETE | convites | 4 |
| `invitations/[token]/accept` | POST | aceitar convite | 4 |
| `orgs/[slug]/members` (+ `/[id]`) | GET, PATCH, DELETE | pessoas e papéis | 5 |
| `orgs/[slug]/model-credentials` | GET, POST, DELETE | chave de IA própria | 5 |
| `orgs/[slug]/audit` | GET | auditoria; `?format=csv` exporta | 5 |
| `orgs/[slug]/notifications` | GET, PATCH | listar, marcar como lida | 5 |
| `orgs/[slug]/api-keys` | GET, POST, DELETE | chaves de API | 5 |
| `v1/bots/[id]/messages` | POST | API pública com chave `Bearer` | 5 |
| `orgs/[slug]/billing/checkout` | POST | abrir o Checkout do Stripe | 6 |
| `orgs/[slug]/billing/portal` | POST | abrir o Portal do cliente | 6 |
| `orgs/[slug]/usage` | GET | uso do mês contra o limite | 6 |
| `webhooks/stripe` | POST | atualiza assinatura e plano | 6 |
| `superadmin/orgs` | GET, PATCH | lista de empresas, estender teste | 6 |

---

## 4. Tabelas (`lib/db/schema/`)

Toda tabela de dados da empresa tem `organization_id`. 🔒 = guarda segredo criptografado.

| Arquivo | Tabelas | Etapa |
| --- | --- | --- |
| `auth.ts` | users, accounts, sessions, verification_tokens (as do Auth.js) | 1 |
| `orgs.ts` | organizations, memberships, invitations, teams, team_members | 1 |
| `bots.ts` | bots, bot_skills | 1 |
| `conversations.ts` | conversations, conversation_members, messages | 1 |
| `approvals.ts` | approvals, approval_rules | 1 (usada na 2) |
| `skills.ts` | skills | 1 (usada na 3) |
| `memory.ts` | memories (+ coluna `embedding vector(1536)` na Etapa 3) | 1 |
| `routines.ts` | routines, routine_runs, goals | 1 (usada na 3) |
| `connections.ts` | connections 🔒, model_credentials 🔒 | 1 (usadas na 4 e 5) |
| `account.ts` | notifications, api_keys (só o hash), audit_events | 1 |
| `billing.ts` | subscriptions, usage_events | 1 (usadas na 6) |

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

## 5. Variáveis de ambiente

| Variável | Etapa | Obrigatória |
| --- | --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | 1 | sim |
| `AUTH_SECRET` | 1 | sim |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 1 | para login com Google |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | 1 | ao menos uma; OpenAI para embeddings |
| `KEY_ENCRYPTION_KEY` | 1 | sim — guardar cópia |
| `APP_URL` | 1 | sim |
| `CRON_SECRET` | 3 | sim |
| `RESEND_API_KEY` | 4 | para convites |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ESSENCIAL`, `STRIPE_PRICE_PROFISSIONAL` | 6 | para cobrar |
| `SUPERADMIN_EMAILS` | 6 | sim |

---

## 6. Como usar com o Emergent

- **Antes da Etapa 1**: cole o prompt principal e, logo abaixo, as seções 1 e 4 deste mapa com a
  frase *"Siga exatamente esta estrutura de pastas e estas tabelas."*
- **No fim de cada etapa**: peça *"Liste as pastas e rotas que você criou"* e compare com as seções
  1, 2 e 3. O que faltar ou estiver em outro lugar, peça para corrigir antes de seguir.
- **Se o Emergent já criou o front com outra organização**: não force a mudança no meio. Anote as
  diferenças; dá para ajustar depois da exportação para o GitHub.
