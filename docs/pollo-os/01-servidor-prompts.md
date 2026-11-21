# Pollo OS — prompts para construir o servidor

O app do Pollo OS (web, desktop, mobile, extensão e agentes) já está neste repositório. O que **ainda
não existe** é o servidor central. Estes prompts servem para construir um servidor próprio, que fala a mesma "língua" do app, no app de criação
de apps que você usar.

## Como usar

1. **A planta do servidor é a especificação da API**, que está em `api/openapi/` (um arquivo por
   área) e em `api/openapi.yaml` (tudo junto). São 433 operações. O app chama exatamente essas
   rotas, então o servidor precisa responder do mesmo jeito.
2. Construa **um módulo por vez**, na ordem abaixo. Em cada prompt, **anexe** o arquivo `.yaml`
   indicado e o `api/openapi/common.yaml` (que tem os tipos compartilhados).
3. Comece sempre pelo **prompt-base** (Módulo 0) num projeto novo e cole os outros no mesmo
   projeto, um de cada vez.
4. Para testar, rode o app deste repositório apontando para o seu servidor (porta 3001). A tela
   que funcionar mostra que o módulo está certo.

Tecnologia recomendada (é a mesma que o servidor original usa, e o app espera): **TypeScript +
Bun + Hono + PostgreSQL**. Se o seu app de criação só faz Node + Supabase, funciona também: troque
Bun por Node e use o Postgres do Supabase.

---

## Módulo 0 — Prompt-base (cole primeiro)

```
Crie o servidor backend do "Pollo OS", um espaço de trabalho onde empresas conversam com agentes
de IA (chamados Bots) que executam tarefas usando ferramentas.

Stack: TypeScript, Bun, framework Hono, PostgreSQL com migrations versionadas (Drizzle ORM).
Porta 3001. Todas as rotas REST ficam sob /api/v2/organizations/{organizationId}/, onde
organizationId aceita o id ou o slug da organização, e "default" é a organização padrão.

Regras gerais:
- Siga EXATAMENTE os contratos do arquivo OpenAPI anexado (common.yaml): nomes de campos, códigos
  de status e o formato de erro (application/problem+json com title e detail).
- Suporte o cabeçalho Idempotency-Key nas rotas POST que o declaram.
- Toda escrita relevante grava uma linha de auditoria (quem, o quê, quando, valor anterior).
- Segredos (chaves de modelo, tokens OAuth) ficam criptografados no banco com a variável
  KEY_ENCRYPTION_KEY (AES-256-GCM). Nunca devolva um segredo numa resposta.
- Variáveis obrigatórias: DATABASE_URL, KEY_ENCRYPTION_KEY. Recuse iniciar sem elas, com uma frase
  que diga qual falta.
- GET /health responde 200 com {"ok": true}.

Nesta etapa: crie a estrutura do projeto, a conexão com o banco, o sistema de migrations, o
middleware de erros no formato problem+json, o middleware de auditoria e a rota /health.
```

## Módulo 1 — Contas, login e organizações

Anexe: `accounts.yaml`, `organizations.yaml`, `teams.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente as rotas dos arquivos OpenAPI anexados: contas de usuário,
login, organizações e equipes.

- Login por e-mail e senha (senha com argon2id) e sessão por cookie httpOnly, SameSite=Lax.
- Papéis: administrador e membro. Só administrador altera configurações da organização e convida
  pessoas.
- Modo "single user" (variável POLLO_SINGLE_USER=true): sem login, uma pessoa só, para rodar no
  computador.
- Login com Google e Microsoft (OAuth/OIDC) e SSO por SAML da empresa ficam para depois, mas deixe
  a tabela de provedores de identidade pronta.
Gere migrations, as rotas e testes para cada rota.
```

## Módulo 2 — Modelos de IA

Anexe: `model-connections.yaml`, `admin-settings.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente as conexões com modelos de IA e as configurações de admin dos
arquivos anexados.

- Provedores: OpenAI, Anthropic (Claude), Google (Gemini) e qualquer endpoint compatível com a
  API da OpenAI (base URL + chave).
- A chave é guardada criptografada. Ao salvar, teste a chave com uma chamada pequena e devolva o
  erro do provedor numa frase clara se falhar.
- Um "gateway de modelos" interno: os agentes chamam o servidor, e o servidor chama o provedor com
  a chave certa. Assim a chave nunca sai do servidor.
```

## Módulo 3 — Bots, agentes e conversas (o coração)

Anexe: `bots.yaml`, `agents.yaml`, `conversations.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente Bots, agentes e conversas dos arquivos anexados.

- Um Bot tem nome, descrição, instruções (prompt de sistema), modelo, ferramentas permitidas e o
  agente que o executa.
- Um agente é um endereço AG-UI (protocolo aberto da CopilotKit para agentes; use o pacote npm
  @ag-ui/client). Os agentes deste repositório (pastas agent-*) já falam AG-UI.
- Conversas e mensagens são guardadas no PostgreSQL (substituindo o "CopilotKit Intelligence":
  aqui o histórico é nosso). Anexos vão para um armazenamento de arquivos (pasta local ou S3).
- Crie a rota POST /api/copilotkit, que o app usa para conversar (o app usa
  @copilotkit/react-core 1.88.0 com runtimeUrl="/api/copilotkit"). Use o pacote
  @copilotkit/runtime (licença MIT) para receber a mensagem, mandar o turno para o agente do Bot
  via AG-UI e transmitir a resposta em streaming de volta.
- Cada conversa pertence a uma organização e só quem participa dela pode lê-la.
```

## Módulo 4 — Ferramentas, permissões, aprovações e auditoria

Anexe: `approvals.yaml`, `bot-grants.yaml`, `audit-events.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente o gateway de ferramentas, as permissões, as aprovações e a
auditoria dos arquivos anexados.

- Toda ferramenta que um Bot chama passa pelo gateway do servidor, nesta ordem: descobre o alvo,
  avalia a política, grava a linha de auditoria e só então executa. Não existe caminho que execute
  sem o registro existir antes.
- Política por Bot e por ferramenta: permitir, negar ou pedir aprovação.
- Ações que pedem aprovação (enviar e-mail, pagar, apagar) ficam pendentes até uma pessoa aprovar
  ou recusar na tela de Aprovações. O agente espera a resposta.
- A tela de Auditoria lista tudo com filtros por pessoa, Bot, ferramenta e data.
```

## Módulo 5 — Apps, conexões e MCP

Anexe: `apps.yaml`, `connections.yaml`, `skills.yaml`, `components.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente o catálogo de apps, as conexões, as skills e os componentes dos
arquivos anexados.

- Um "app" é um servidor MCP (Model Context Protocol). O servidor Pollo OS se conecta a ele (HTTP
  streamable ou SSE), lista as ferramentas e as oferece aos Bots que têm permissão.
- Conexão por OAuth (cada pessoa conecta a própria conta) ou por chave de API da organização. Os
  tokens ficam criptografados e são renovados automaticamente.
- Catálogo inicial: Google Drive, Google Agenda, Gmail, Notion e os apps próprios do Pollo
  (Flipform, Flip Intelligence, Painel de Mercado, CRM de Vendas). Veja docs/pollo-os/02-apps-prompts.md.
- Skills são instruções reutilizáveis (texto em Markdown) que um Bot pode carregar.
```

## Módulo 6 — Rotinas e notificações

Anexe: `schedules.yaml`, `notifications.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente as rotinas agendadas e as notificações dos arquivos anexados.

- Uma rotina é "faça X neste horário": cron com intervalo mínimo de 15 minutos, no máximo 20
  rotinas ativas por pessoa. Ela roda como a pessoa que criou, no canal em que foi pedida.
- Dez falhas seguidas desligam a rotina e avisam a pessoa.
- Notificações no app (lista com lidas e não lidas) e por e-mail (SMTP configurável).
```

## Módulo 7 — Memória e aprendizado

Anexe: `memory.yaml`, `learning.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente memória e aprendizado dos arquivos anexados, sem depender de
serviços externos pagos.

- Memória: fatos que o Bot guarda sobre a pessoa e a empresa, com busca por similaridade usando
  pgvector no PostgreSQL e embeddings do provedor de modelo configurado. Sem embeddings, a busca
  cai para palavras-chave.
- A pessoa vê, edita e apaga o que o Bot lembra.
- Aprendizado: a partir de gravações de tarefas feitas por uma pessoa, o Bot gera uma skill
  (passo a passo em Markdown) que um admin revisa antes de publicar.
```

## Módulo 8 — Computadores e navegador dos Bots

Anexe: `computers.yaml`, `browsers.yaml`, `passwords-and-recorder.yaml`, `common.yaml`

```
No servidor Pollo OS, implemente os computadores e navegadores dos Bots dos arquivos anexados.

- Cada pessoa (e cada Bot isolado) ganha um "computador": um contêiner Docker com Chromium
  (Playwright), uma pasta /workspace e um perfil de navegador persistente.
- Um serviço supervisor cria, para e apaga esses contêineres sob demanda.
- O app mostra a tela do navegador ao vivo e a pessoa pode assumir o controle.
- Senhas que o Bot usa ficam num cofre criptografado. O Bot pede a senha pelo nome e nunca a vê
  em texto puro nos logs.
Este é o módulo mais pesado. Deixe para o fim.
```

## Módulo 9 — Gestão (opcional)

Anexe: `management.yaml`

```
No servidor Pollo OS, implemente as rotas de gestão do arquivo anexado para que a equipe Pollo
possa ver, de um painel central, as instalações dos clientes (versão, saúde, uso), sem acessar
conversas nem dados dos clientes.
```
