# Pollo OS — prompt completo para o Emergent

Este é o prompt para recriar o Pollo OS do zero no Emergent, com base no app do OpenBot que está
neste repositório (telas em `app/src/routes/`, dados em `api/openapi/`, visual em
`app/src/theme.css` e `branding/`).

## Antes de colar

**Por que não usar o padrão do Emergent.** O Emergent costuma gerar React + FastAPI + MongoDB.
Como o destino é **Neon (PostgreSQL) + Vercel**, o prompt pede **Next.js + PostgreSQL**. Assim, o
que sai do Emergent sobe na Vercel sem reescrever o backend. Se o Emergent insistir em FastAPI +
MongoDB, pare e peça de novo com a frase *"Não use MongoDB nem FastAPI. O projeto tem que ser
Next.js com PostgreSQL via Drizzle, porque vai rodar na Vercel com banco Neon."*

**Chave de IA.** O Emergent oferece uma "Emergent LLM Key" universal. **Não use**: ela só
funciona dentro do Emergent e para de funcionar quando você exporta para o GitHub. O prompt já
pede chaves próprias (Anthropic / OpenAI) nas variáveis de ambiente.

**Como colar.** O Emergent trabalha melhor por etapas. Cole o **Prompt principal** primeiro. Quando
ele terminar e você testar, cole as **Etapas 2 a 6**, uma por vez, no mesmo projeto. Use o
[mapa da estrutura](06-mapa-da-estrutura.md) para conferir o que ele entregou em cada etapa.

**Licença.** O OpenBot é MIT: pode copiar, mudar e vender. Mantenha o aviso de copyright da
CopilotKit no arquivo LICENSE do projeto novo.

---

## Prompt principal (Etapa 1 — base, login e chat com Bots)

```
Crie o "Pollo OS", um SaaS comercial multiempresa (multi-tenant) em que empresas conversam com
agentes de IA chamados "Bots", e os Bots executam tarefas usando ferramentas, pedindo aprovação
de uma pessoa antes de qualquer ação importante. Toda a interface em português do Brasil.

=== STACK (obrigatória, não troque) ===
- Next.js 15 (App Router) + TypeScript + React 19.
- Tailwind CSS v4 + shadcn/ui + ícones Tabler (@tabler/icons-react).
- Banco PostgreSQL com Drizzle ORM e drizzle-kit (migrations versionadas em /drizzle).
  Driver @neondatabase/serverless. NÃO use MongoDB, NÃO use FastAPI, NÃO use Supabase.
- Autenticação com Auth.js (NextAuth v5): e-mail + senha (bcrypt) e login com Google.
- IA com Vercel AI SDK (pacote "ai" + @ai-sdk/anthropic + @ai-sdk/openai), streaming.
  As chaves vêm de ANTHROPIC_API_KEY e OPENAI_API_KEY. NÃO use a Emergent LLM Key.
- Validação com Zod. Datas com date-fns (pt-BR).
- Tudo tem que rodar na Vercel: rotas em app/api/**, sem servidor próprio, sem WebSocket.
  Streaming de chat por HTTP (AI SDK useChat).
- Variáveis de ambiente: DATABASE_URL, DATABASE_URL_UNPOOLED (para migrations), AUTH_SECRET,
  AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ANTHROPIC_API_KEY, OPENAI_API_KEY, KEY_ENCRYPTION_KEY,
  APP_URL. Crie um .env.example com todas e uma linha explicando cada uma.

=== IDENTIDADE VISUAL ===
- Nome: Pollo OS. Logo: um quadrado de cantos arredondados com um ponto, na cor #CA6E23.
- Tema claro: fundo da página #FAF9F6, cartões #FFFFFF, menu lateral #F4F0E9, texto #2B201B,
  texto secundário #5F534C, bordas #E8E2D8, cor principal #CA6E23 (botões principais, foco e item
  selecionado), item selecionado do menu com fundo #F9EDE1 e texto #94500F, perigo #B53A30,
  sucesso #2C7A57. Raio dos cantos 12px.
- Tema escuro: fundo #1C1613, cartões #241C18, texto #F3ECE4, secundário #B3A69C, bordas #3A2F29,
  cor principal #E08A45.
- Títulos na fonte Manrope, texto em Inter. Alternância claro/escuro/sistema.
- Defina tudo como variáveis CSS do shadcn (--background, --primary, --sidebar etc.).
- Visual limpo, muito espaço em branco, telas de configuração com largura máxima de leitura
  (~720px) e listas em linhas (ícone, título, descrição curta, seta), não em cartões soltos.
- Estados vazios com uma frase útil e um botão de ação. Funciona bem no celular.

=== ESTRUTURA MULTIEMPRESA ===
- Uma pessoa (user) pode estar em várias organizações (organization). Papéis: owner, admin, member.
- Todo dado pertence a uma organização (coluna organization_id) e toda consulta filtra por ela.
  Nunca deixe uma empresa ver dado de outra.
- URL: /o/[slug]/... para as telas internas.
- Cadastro novo cria a organização e leva para o onboarding.

=== MODELO DE DADOS (Drizzle, PostgreSQL) — crie todas as tabelas já nesta etapa ===
users(id, name, email, password_hash, image, created_at)
organizations(id, name, slug único, logo_url, plan default 'trial', trial_ends_at, created_at)
memberships(id, organization_id, user_id, role, created_at)
invitations(id, organization_id, email, role, token, expires_at, accepted_at)
teams(id, organization_id, name, description)
team_members(team_id, user_id, role 'member'|'maintainer')
bots(id, organization_id, name, title (cargo), avatar, instructions (texto longo),
     model (ex.: 'claude-sonnet' ou 'gpt'), visibility 'private'|'team'|'organization',
     owner_id, created_at, archived_at)
conversations(id, organization_id, kind 'direct'|'channel'|'group', title, created_by,
     created_at, last_message_at)
conversation_members(conversation_id, user_id nullable, bot_id nullable)
messages(id, conversation_id, author_user_id nullable, author_bot_id nullable,
     role 'user'|'assistant'|'tool'|'system', content text, parts jsonb (partes do AI SDK,
     inclusive chamadas de ferramenta), attachments jsonb, created_at)
approvals(id, organization_id, conversation_id, message_id, bot_id, tool_name, arguments jsonb,
     summary (frase legível do que o Bot quer fazer), status 'pending'|'approved'|'denied'|'expired',
     requested_at, decided_by, decided_at, note)
approval_rules(id, organization_id, bot_id nullable, tool_name, effect 'always_allow'|'always_ask'|'never',
     created_by)
skills(id, organization_id, slug, name, description, body (markdown com instruções), created_by)
bot_skills(bot_id, skill_id)
memories(id, organization_id, bot_id nullable, user_id nullable, content, source, created_at)
routines(id, organization_id, bot_id, name, prompt, cron, timezone default 'America/Sao_Paulo',
     enabled, next_run_at, last_run_at, conversation_id)
routine_runs(id, routine_id, started_at, finished_at, status, output)
goals(id, organization_id, bot_id, title, description, status, due_at)
connections(id, organization_id, user_id nullable, provider, display_name,
     credentials_encrypted, status, created_at)
model_credentials(id, organization_id, provider 'anthropic'|'openai', key_encrypted, created_at)
notifications(id, organization_id, user_id, kind, title, body, link, read_at, created_at)
api_keys(id, organization_id, name, key_hash, last_used_at, created_by, revoked_at)
audit_events(id, organization_id, actor_user_id nullable, actor_bot_id nullable, action,
     target_type, target_id, before jsonb, after jsonb, created_at)
subscriptions(id, organization_id, provider, customer_id, subscription_id, plan, status,
     current_period_end)
usage_events(id, organization_id, bot_id, kind 'message'|'tool'|'routine', tokens_in,
     tokens_out, created_at)

Segredos (credenciais, chaves de modelo) gravados criptografados com AES-256-GCM usando
KEY_ENCRYPTION_KEY. Nunca devolva um segredo para o navegador: mostre só os 4 últimos caracteres.
Toda criação, alteração e exclusão relevante grava uma linha em audit_events.

=== LAYOUT ===
Menu lateral fixo (recolhível; no celular vira gaveta) com:
- Topo: logo + nome da organização, com troca de organização.
- Botão "Nova conversa".
- Itens principais: Início, Bots, Rotinas, Memória, Habilidades, Conexões.
- Lista "Conversas" (recentes, com o avatar do Bot ou do grupo).
- Rodapé: Times, Admin (só owner/admin), Configurações, e o nome da pessoa com menu
  (perfil, tema, sair).
Um sino de notificações no topo e um selo "Precisa de você" com o número de aprovações pendentes.

=== TELAS DESTA ETAPA ===
1. /entrar e /criar-conta: e-mail + senha e "Entrar com Google". Esqueci a senha.
2. Onboarding (3 passos): nome da empresa → criar o primeiro Bot (nome, cargo, avatar, o que ele
   faz) → primeira conversa com ele já aberta.
3. Início (/o/[slug]): saudação, caixa "Peça algo a um Bot" com seletor de Bot, lista
   "Precisa de você" (aprovações pendentes) e conversas recentes.
4. Bots (/o/[slug]/bots): lista em linhas com avatar, nome, cargo e status; botão "Novo Bot"
   abre um painel lateral com nome, cargo, avatar (emoji ou upload), instruções e modelo.
5. Página do Bot (/o/[slug]/bots/[id]) com abas: Conversa, Configuração (nome, cargo,
   instruções, modelo, visibilidade), Habilidades, Memória, Rotinas, Aprovações, Atividade
   (eventos de auditoria do Bot), Acesso (quem pode usar). As abas sem conteúdo ainda mostram o
   estado vazio com a ação certa.
6. Conversa (/o/[slug]/c/[id]): chat com streaming, Markdown, blocos de código, anexos (imagem e
   PDF), editar última mensagem, copiar, parar geração. Uma conversa "direct" é você + 1 Bot.
   Mostra as ferramentas que o Bot usou como cartões recolhíveis ("Consultou a agenda").

=== MOTOR DOS BOTS ===
- Rota app/api/chat/route.ts com streamText do AI SDK. System prompt = instruções do Bot +
  corpo das habilidades ligadas a ele + memórias relevantes do Bot e da pessoa.
- export const maxDuration = 300.
- Ferramentas iniciais do Bot: lembrar(fato) → salva em memories; buscar_memoria(consulta);
  data_hora_atual; criar_tarefa(título, prazo) → cria um goal.
- Toda mensagem e resultado de ferramenta é salvo em messages (com parts em jsonb), para a
  conversa reabrir igual.
- Registre tokens em usage_events.

Entregue o projeto com: README em português explicando como rodar local (npm install,
npm run db:migrate, npm run dev), seed com uma organização de demonstração e 2 Bots de exemplo
("Ana — Assistente Comercial" e "Léo — Analista de Dados"), e scripts db:generate, db:migrate,
db:seed no package.json.
```

---

## Etapa 2 — Aprovações (o coração do produto)

```
Adicione o sistema de aprovações ao Pollo OS, sem mudar a stack.

Regra: antes de uma ferramenta que altera algo fora do Pollo OS (enviar, criar, apagar, pagar,
publicar), o Bot para e pede aprovação.

- Cada ferramenta tem a marca needsApproval: true | false. As que alteram dados são true.
- Quando o Bot chama uma ferramenta com needsApproval, NÃO execute. Crie um registro em approvals
  com status 'pending', um summary em português ("Ana quer enviar um e-mail para
  joao@cliente.com com o assunto 'Proposta'") e os argumentos. Use o recurso de aprovação de
  ferramenta do AI SDK (tool com needsApproval / addToolApprovalResponse) ou equivalente.
- Na conversa aparece um cartão de aprovação com o resumo, os detalhes (argumentos legíveis,
  não JSON cru) e os botões "Aprovar", "Recusar" e "Sempre permitir para este Bot".
- Ao aprovar, a ferramenta roda e o Bot continua de onde parou. Ao recusar, o Bot recebe "a
  pessoa recusou" e responde de acordo. Pode deixar uma nota ao recusar.
- "Sempre permitir" cria uma approval_rule; da próxima vez a ferramenta roda sem perguntar.
- Tela /o/[slug]/aprovacoes: abas Pendentes, Decididas, Regras. Filtro por Bot. Cada item abre
  a conversa no ponto do pedido.
- Aprovações pendentes geram notificação para quem conversa com o Bot e somam no selo
  "Precisa de você". Pendentes há mais de 7 dias viram 'expired'.
- Admin pode criar regras para a organização toda em /o/[slug]/admin/aprovacoes.
- Toda decisão grava audit_events.
```

---

## Etapa 3 — Rotinas, habilidades e memória

```
Adicione ao Pollo OS, sem mudar a stack:

ROTINAS (/o/[slug]/rotinas)
- Criar rotina: escolher o Bot, nome, o que ele deve fazer (prompt) e quando: opções prontas
  ("todo dia às 8h", "toda segunda às 9h", "a cada hora", "todo dia 1º do mês") ou cron avançado.
  Fuso padrão America/Sao_Paulo.
- Cada rotina tem a sua conversa; cada execução vira uma mensagem nela e uma linha em
  routine_runs. Botões "Rodar agora", "Pausar", histórico de execuções com status.
- Executor: rota app/api/cron/routines/route.ts protegida pelo cabeçalho
  Authorization: Bearer ${CRON_SECRET}. Ela busca as rotinas com next_run_at <= agora, roda cada
  uma (mesmo motor do chat, sem streaming), salva o resultado e calcula o próximo next_run_at
  (use cron-parser). Crie vercel.json com o cron chamando essa rota a cada 5 minutos.
- Aprovações pedidas numa rotina ficam pendentes e notificam o dono da rotina.
- Aba "Metas": metas de um Bot (título, descrição, prazo, status) que o Bot pode atualizar.

HABILIDADES (/o/[slug]/habilidades)
- Uma habilidade é um conjunto de instruções em Markdown com nome e descrição
  ("Como responder um cliente insatisfeito", "Como montar o relatório semanal").
- Lista, criar, editar (editor Markdown com pré-visualização), ligar/desligar por Bot,
  compartilhar com times. Inclua 5 habilidades de exemplo no seed.

MEMÓRIA (/o/[slug]/memoria)
- Lista do que os Bots lembram, filtrável por Bot e por pessoa, com busca. Editar e apagar.
- Ative a extensão pgvector e uma coluna embedding vector(1536) em memories; gere embeddings
  com text-embedding-3-small e use busca por similaridade em buscar_memoria e na montagem do
  system prompt (as 8 mais relevantes).
```

---

## Etapa 4 — Conexões, canais, times e convites

```
Adicione ao Pollo OS, sem mudar a stack:

CONEXÕES (/o/[slug]/conexoes)
- Catálogo de apps que os Bots podem usar, em linhas com logo e descrição: Gmail, Google
  Agenda, Google Drive, Slack, WhatsApp (via API oficial), Notion, HubSpot, e "Servidor MCP
  personalizado" (URL + chave).
- Para o MVP implemente de verdade: Google (OAuth com escopos de Gmail e Agenda) e Servidor MCP
  personalizado (use o cliente MCP do AI SDK, experimental_createMCPClient, para transformar as
  ferramentas do servidor em ferramentas do Bot). Os outros aparecem como "Em breve".
- Cada conexão pode ser da pessoa (só ela usa) ou da empresa (admin compartilha).
- Na página do Bot, aba "Aplicativos": quais conexões e quais ferramentas de cada uma ele pode
  usar, ferramenta por ferramenta, e quais pedem aprovação.
- Ferramentas reais: gmail_buscar, gmail_enviar (needsApproval), agenda_listar,
  agenda_criar_evento (needsApproval).

CANAIS E GRUPOS
- "Nova conversa" passa a oferecer: conversa com um Bot, Grupo (várias pessoas e Bots) e Canal
  (aberto para a empresa toda, com nome tipo #comercial).
- Num grupo, o Bot responde quando é mencionado com @nome. Reações com emoji nas mensagens.
- Atualização em tempo real por polling a cada 3 segundos (SWR/React Query) — sem WebSocket.

TIMES E PESSOAS
- /o/[slug]/times: criar time, adicionar pessoas, papel maintainer. Bots e habilidades podem
  ser compartilhados com um time.
- Convites por e-mail (use Resend, variável RESEND_API_KEY) com link /convite/[token].
```

---

## Etapa 5 — Admin, configurações e auditoria

```
Adicione ao Pollo OS, sem mudar a stack:

ADMIN (/o/[slug]/admin, só owner/admin) com menu próprio:
- Visão geral: pessoas, Bots, conversas e consumo de tokens do mês (gráfico simples).
- Pessoas: lista, convidar, mudar papel, remover.
- Modelos de IA: a empresa pode usar a chave da plataforma (padrão, conta no plano) ou cadastrar
  a própria chave Anthropic/OpenAI (model_credentials, criptografada). Escolher o modelo padrão
  dos Bots novos.
- Aprovações: regras da empresa.
- Limites: o que os Bots nunca podem fazer (lista de ferramentas bloqueadas, domínios de e-mail
  permitidos para envio).
- Auditoria: tabela de audit_events com filtros (pessoa, Bot, ação, período), detalhe com
  antes/depois, exportar CSV (máximo 5.000 linhas).
- Empresa: nome, slug, logo.

CONFIGURAÇÕES PESSOAIS (/o/[slug]/configuracoes):
- Perfil (nome, foto, senha), Notificações (quais avisos, por e-mail ou só no app),
  Aparência (claro/escuro/sistema), Cofre (senhas e chaves que os Bots podem usar em nome da
  pessoa, criptografadas), Chaves de API (criar, mostrar uma única vez, revogar; usadas no
  cabeçalho Authorization: Bearer para chamar /api/v1/bots/[id]/messages), Atividade
  (o que a pessoa fez).
```

---

## Etapa 6 — Parte comercial (planos, cobrança e site)

```
Transforme o Pollo OS em produto vendável, sem mudar a stack:

PLANOS (valores editáveis num arquivo de configuração lib/plans.ts):
- Teste grátis: 14 dias, até 2 Bots, 3 pessoas, 500 mensagens.
- Essencial: R$ 197/mês — 5 Bots, 10 pessoas, 5.000 mensagens/mês.
- Profissional: R$ 497/mês — 20 Bots, 30 pessoas, 25.000 mensagens/mês, rotinas ilimitadas,
  conexões da empresa.
- Empresa: sob consulta — tudo ilimitado, chave de IA própria, auditoria com exportação, SSO.
Limites checados no servidor (criar Bot, convidar pessoa, enviar mensagem). Ao bater o limite,
mensagem clara com botão "Ver planos".

COBRANÇA com Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, um STRIPE_PRICE_* por plano):
- Checkout para assinar, Portal do cliente para trocar plano/cartão/cancelar.
- Webhook app/api/webhooks/stripe/route.ts atualiza subscriptions e organizations.plan.
  Aceite cartão e Pix (Stripe Brasil). Preços em BRL.
- Tela /o/[slug]/admin/plano: plano atual, uso do mês em barras, botão trocar plano, faturas.
- Fim do teste sem assinatura: o app entra em modo somente leitura com um aviso no topo.

SITE PÚBLICO (/, fora do login):
- Página de vendas: título "Agentes de IA que trabalham para a sua empresa", subtítulo,
  demonstração (print do app), como funciona em 3 passos (crie seu Bot → conecte seus apps →
  aprove o que importa), benefícios, planos com preços, perguntas frequentes, rodapé.
- Páginas /precos, /termos, /privacidade (texto-modelo marcado para revisão jurídica, LGPD).

SUPER ADMIN (/superadmin, só e-mails listados em SUPERADMIN_EMAILS):
- Lista de empresas com plano, status, uso e data de criação; entrar como a empresa (só
  leitura); estender teste.
```

---

## Depois do Emergent

Quando as seis etapas estiverem prontas e testadas, siga
[05-deploy-github-neon-vercel.md](05-deploy-github-neon-vercel.md) para exportar para o GitHub e
publicar com Neon e Vercel.

### O que fica de fora do Emergent (fase 2)

O OpenBot original também tem coisas que não cabem na Vercel. Ficam para depois:

- **Computador e navegador do Bot** (o Bot usando um navegador de verdade, telas `browser` e
  `computer`): precisa de máquina própria ou de um serviço como Browserbase.
- **App de desktop (Tauri), app de celular e extensão do navegador**: as pastas `desktop/`,
  `mobile/` e `extension/` deste repositório servem de referência.
- **Adaptadores de frameworks de agentes** (`agent-*`): só se algum cliente quiser plugar o
  próprio agente.
- **Apps da Pollo como ferramentas** (Flipform, Flip Intelligence, painel de mercado, CRM): use os
  prompts de [02-apps-prompts.md](02-apps-prompts.md) e plugue cada um como "Servidor MCP
  personalizado" (Etapa 4).
