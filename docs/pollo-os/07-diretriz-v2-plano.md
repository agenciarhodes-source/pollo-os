# Pollo OS — plano da diretriz v2 (Home, Agenda, reuniões com IA)

Resposta à *Diretriz de produto e prompt de implementação v2.0* (21/11/2026). Este documento
traz os itens 1 a 7 da "saída requerida". O item 8, o **PR A**, está na branch
`pr-a/home-e-navegacao`, como rascunho, para revisão. Os PRs B a E ficam esperando a aprovação do
anterior.

## 1. Diagnóstico

### Inventário por componente

| Componente | Onde | Situação |
| --- | --- | --- |
| Front web (Next.js 16, React 19, Tailwind 4) | `web/` | **Implementado.** Publicado na Vercel. Sem login nem servidor próprio. |
| Criaturas Pollo (9 formatos, 9 cores, 10 rostos, 5 jeitos) | `web/src/components/pollo/` | **Implementado.** Reutilizado em toda a interface. |
| Criação de agentes | `web/src/components/agents/` | **Mock.** Os agentes ficam no `localStorage` do navegador. Não há multiempresa. |
| Conversa (Pollo CEO e agentes) | `web/src/components/chat/` | **Mock.** A resposta é simulada e diz que não há IA ligada. |
| Apps (FlipForm, Flip Intelligence) | `web/src/components/apps/`, `web/src/lib/apps.ts` | **Mock.** O catálogo e os interruptores de acesso ficam no `localStorage`. Não é autorização. "Abrir" está desligado. |
| Contrato da API (433 operações, REST + WebSocket) | `api/openapi/*.yaml`, `api/asyncapi.yaml` | **Especificado.** É o contrato do servidor do OpenBot. Nada no Pollo OS o implementa hoje. |
| Primitivas de orquestração (delegação, tarefas, reações) | `shared/orchestration.ts` e outros arquivos em `shared/` | **Especificado / código reutilizável.** São declarações lidas pelo servidor e pelo navegador. Não há servidor que as execute. |
| Adaptadores de agentes (LangGraph, CrewAI, Claude SDK…) | `agent-*/` | **Código reutilizável, não implantado.** |
| Agente de administração | `management-agent/` | **Código reutilizável, não implantado.** |
| Servidor, computador do agente, supervisor | imagens `ghcr.io/copilotkit/openbot*` (`backend-images.env`) | **Externo.** Imagens fechadas da CopilotKit, na tag móvel `main`. Dependem do CopilotKit Intelligence (pago). Não estão em uso. |
| Banco de dados | Neon, projeto `pollo-os` (us-east-1, 0,25 CU) | **Criado, vazio.** Não está ligado ao app. |
| Login, organizações, permissões | — | **Indisponível.** |
| Modelo de IA (texto) | — | **Indisponível.** Sem chave nem runtime. |
| Voz em tempo real, transcrição, atas | — | **Indisponível.** |
| Integração FlipForm / Flip Intelligence | — | **Externo, sem API homologada.** |
| Calendários externos (Google, Outlook) | — | **Indisponível.** |

### Origem e licença

A estrutura base veio do OpenBot (CopilotKit, licença MIT). O aviso de copyright continua em
`LICENSE`, como a licença exige. As imagens do servidor **não** são código aberto deste
repositório: são publicadas pela CopilotKit e dependem de um serviço pago. Por isso, os PRs B
em diante assumem um backend próprio, que reaproveita o **contrato** e as **primitivas**, não as
imagens.

### Lacunas principais

1. Sem backend: tudo o que a interface mostra é local ao navegador.
2. A rota `/` abria a criação de agentes, não a Home executiva.
3. O menu não seguia a navegação da diretriz.
4. `docs/pollo-os/02-apps-prompts.md` mandava criar painéis de CRM e de mercado dentro do Pollo
   OS. **Corrigido no PR A.**
5. `backend-images.env` aponta para a tag móvel `main`. Antes de dar computadores de agente a
   clientes, é preciso fixar uma versão ou substituir as imagens (PR D).

## 2. Arquivos por PR

| PR | Arquivos |
| --- | --- |
| **A** (este) | `web/src/lib/navigation.ts` (novo), `web/src/components/shell/app-shell.tsx`, `web/src/components/home/home-screen.tsx` (novo), `web/src/components/modules/unavailable-module.tsx` (novo), `web/src/components/chat/*`, `web/src/lib/agents.ts`, `web/src/app/(app)/page.tsx`, `web/src/app/(app)/agentes/**` (novo), `web/src/app/(app)/[secao]/page.tsx`, `web/next.config.ts` (redirecionamentos), `web/vitest.config.ts` e `web/src/**/*.test.tsx` (novos), `docs/pollo-os/02-apps-prompts.md`, este documento |
| **B** | `web/src/app/api/**` (rotas), `web/src/lib/db/**` (Drizzle + Neon), `web/src/lib/auth.ts`, `web/src/lib/agents.ts` (passa a ler da API), `web/src/components/chat/*` (streaming real), migração de `localStorage` |
| **C** | `web/src/lib/db/schema/meetings.ts`, `web/src/app/api/meetings/**`, `web/src/app/(app)/agenda/**`, `web/src/app/api/voice/session/**` (token efêmero), componentes da sala de reunião |
| **D** | `web/src/lib/orchestration/**` (a partir de `shared/orchestration.ts`), aprovações, atividade, habilidades, memória institucional (`segundo-cerebro`) |
| **E** | `web/src/lib/connectors/flipform.ts`, `.../flip-intelligence.ts`, `.../calendar.ts`, `web/src/app/(app)/visao-geral/**` |

## 3. Contratos e dados mínimos

Todas as tabelas levam `organization_id`, e toda consulta filtra por ele.

- **Organização e pessoa** (B): `organizations`, `users`, `memberships(role)`.
- **Agente** (B): `agents(id, organization_id, name, purpose, level: estrategico|tatico|operacional, model, shape, color, face, mood, created_by)`. O Pollo CEO é um agente de nível estratégico, criado com a organização.
- **Conversa** (B): `conversations(id, organization_id, agent_id, user_id, kind: home|agente|reuniao)`, `messages(id, conversation_id, role, parts jsonb, kind: fato|hipotese|recomendacao|decisao|execucao|null, sources jsonb, created_at)`.
- **Reunião executiva** (C): `executive_meetings(id, organization_id, user_id, agent_id, title, agenda, starts_at, ends_at, timezone, status: rascunho|agendada|em_andamento|concluida|cancelada, recording_consent, retention_days)`, `meeting_participants`, `meeting_minutes(meeting_id, summary, decisions jsonb, action_items jsonb, confirmed_by, confirmed_at)`.
- **Trabalho de agente** (D): `agent_jobs(id, organization_id, agent_id, requested_by, status: pendente|executando|precisa_aprovacao|concluido|falhou, source, cost, result, started_at, finished_at)`.
- **Aprovação** (D): `approvals(id, organization_id, job_id, tool, arguments, requested_at, decided_by, decision, decided_at)`.
- **Consumo** (B/C): `usage_events(organization_id, agent_id, service, modality: texto|voz, tokens_in, tokens_out, seconds, cost, created_at)`.

Rotas mínimas (B e C): `GET/POST /api/organizations/:org/agents`, `POST /api/organizations/:org/conversations/:id/messages` (streaming), `GET/POST /api/organizations/:org/meetings`, `POST /api/organizations/:org/meetings/:id/voice-session` (devolve token efêmero, nunca a chave do provedor), `POST /api/organizations/:org/approvals/:id`.

## 4. Matriz de dependências

| Entrega | FlipForm | Runtime de agentes (OpenBot) | Voz | Provedores |
| --- | --- | --- | --- | --- |
| A — Home e navegação | — | — | — | — |
| B — Backend e conversa real | — | Reaproveita o contrato e as primitivas, não as imagens | — | Neon, Auth (Auth.js ou Neon Auth), modelo de IA (Anthropic ou OpenAI) |
| C — Agenda e reuniões | — | Conversa do B | WebRTC/WebSocket do provedor de voz, com token efêmero | Provedor de voz em tempo real, calendários (opcional) |
| D — Orquestração e Segundo Cérebro | — | Delegação, tarefas, aprovações, habilidades, memória | — | Modelo de IA, embeddings (pgvector no Neon) |
| E — Conectores e Visão Geral | **API homologada**: leitura primeiro, escrita depois | Ferramentas com aprovação | — | Google Calendar, Outlook |

## 5. Critérios de aceite do PR A

1. `/` abre a **Home**, com o Pollo CEO no centro e a pergunta "O que vamos resolver hoje?". A criação de agentes não aparece na entrada.
2. Menu principal: Home, Agenda, Visão Geral, Agentes & Operações, Segundo Cérebro, Apps. Em **Mais**: Rotinas, Decisões & Aprovações, Atividade, Consumo & Custos, Habilidades, Criaturas, Configurações, Ajuda.
3. A criação de agentes está em `/agentes`, com as criaturas Pollo como antes. `/criaturas` e `/tarefas` redirecionam sem erro.
4. Módulos sem backend mostram um estado vazio honesto, com o que farão, o que falta para funcionarem e um caminho útil. Nenhum número, reunião ou atividade inventados.
5. Na Home, "Conversar por voz", "Preparar reunião" e "Analisar empresa" ficam desabilitados, com o motivo. "Acompanhar agentes" leva a Agentes & Operações. O microfone e os anexos ficam desabilitados, com o motivo.
6. A conversa da Home mostra o aviso **Em demonstração** e não apresenta resposta simulada como real.
7. Nenhum CRM, funil, ficha de lead ou ERP no Pollo OS. `02-apps-prompts.md` não recomenda mais criar esses painéis.
8. Funciona de 375px a 1440px, sem rolagem lateral. Navegação por teclado, nomes acessíveis em todos os botões de ícone e `aria-current` no item ativo.
9. Lint, verificação de tipos, build e testes passando.

## 6. Testes

- `npm run test` (Vitest + Testing Library), em `web/`:
  - `navigation.test.ts`: os itens principais e os de "Mais" na ordem da diretriz, sem endereços repetidos, cada endereço com página ou redirecionamento, sem nenhum item de CRM.
  - `home-screen.test.tsx`: saudação, campo de mensagem com nome acessível, botões indisponíveis desabilitados e com motivo, "Acompanhar agentes" com link para `/agentes`, aviso de demonstração.
  - `app-shell.test.tsx`: menu com rótulo, item ativo com `aria-current`, botão "Mais" abrindo a lista.
  - `unavailable-module.test.tsx`: estado vazio sem dados inventados e com link útil.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Manual: 375px, 768px e 1440px, teclado (Tab, Enter, Esc) e a prévia da Vercel da branch.

## 7. Riscos e como voltar atrás

| Risco | Mitigação | Como voltar |
| --- | --- | --- |
| Links antigos (`/criaturas`, `/tarefas`) quebrarem | Redirecionamentos não permanentes em `next.config.ts` | Remover os redirecionamentos |
| Agentes salvos no navegador sumirem | A chave do `localStorage` não muda | — |
| Usuário achar que a IA responde de verdade | Aviso "Em demonstração" e botões desabilitados com o motivo | — |
| Mudança grande de navegação | PR único, em rascunho, com prévia da Vercel antes do merge | Não fazer merge, ou reverter o commit do merge |
| Imagens do servidor na tag móvel `main` | Fora do PR A. Decidir no PR D entre fixar a versão ou substituir as imagens | — |
