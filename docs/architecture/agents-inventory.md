# E0 — Inventário do código existente (FlipForm)

**Data da análise:** 21/11/2026 · **Modo:** somente leitura (clone local sem checkout, `git show`/`git grep`, páginas do GitHub). Nada foi executado, instalado, migrado ou alterado no `flipform`.

## Base analisada

| Ref | Commit | Data | Observação |
|---|---|---|---|
| `main` | `6def5c5ed92920deadd0f83806f057da4219a022` | 17/11/2026 | Merge do PR #618. **Difere** do commit citado no Plano Mestre v6.1 (`4f65eff…`, PR #609); o plano está defasado em ~9 merges. |
| PR #627 `feature/pr01-global-api-foundation` | `0491f415` | 21/11/2026 | **Draft**, 96 commits, 70 arquivos, +6.139 linhas. Base = `main` atual. |
| PR #628 `feature/pr02-forms-catalog-read` | `94159127` | 21/11/2026 | **Draft**, 108 commits; **empilhado sobre #627** (contém o head do #627). |

Números de `main`: 1.593 arquivos · 92 modelos Prisma · 92 migrations · 266 rotas `app/api/**/route.ts` · 637 branches remotas · 10 PRs abertos (todos draft: #619–#628).

## Stack confirmada (`package.json` de `main`)

Next.js 15.5.28 · React 19.1.10 · TypeScript 6.0.3 · Prisma 5.22.0 · Zod 4 · jose 6 (JWT) · bcryptjs · Stripe 22.6.2 · Sentry 11.8.0 · Playwright · testes Python (pytest) e `tsx --test`. **Não há** SDK de LLM: chamadas à OpenAI são `fetch` direto (8 arquivos). **Não há** Anthropic, Gemini, MCP, fila externa (BullMQ/Inngest/Upstash) nem Google/Microsoft Calendar.

## Inventário

Legenda de status: **M** = mergeado em `main` (não prova que está implantado/homologado em produção) · **D** = só em PR draft · **∅** = não encontrado · **NV** = não verificado.

| Recurso | Local no código | Status | Reaproveitar? | Risco | Próximo passo |
|---|---|---|---|---|---|
| Sessão JWT em cookie | `lib/auth.ts`, `lib/jwt.ts` (jose, rotação de segredos) | M | **Sim** — base do login único | Médio: SSO entre apps não existe | E2 (SSO) |
| RBAC | `lib/rbac.ts`, `lib/rbac-server.ts` — `owner/admin/manager/agent/viewer` + `platform_admin` | M | **Sim** | Baixo | Mapear papéis → escopos de agente |
| Multi-tenant | `Tenant`, `TenantUser`, `BusinessGroup*`, `lib/business-group-read-scope.ts` | M | **Sim** | **Alto**: PR00 P0 abertos (#624 identidade de formulário público, #625 CAS de mudança de etapa) | Concluir PR00 |
| CRM / pipelines / leads | `Lead`, `Pipeline`, `PipelineStage`, `LeadStageHistory`, `lib/leads*` | M | **Sim, só via API tipada** | Alto: rota de lead deduplica e pode marcar "ganho" (Plano 00A.2) | Ler via `/api/v1` |
| Tarefas | `Task` (sem campos de agente/run), `lib/tasks/*`, `lib/whatsapp-ai/team-task.ts` | M | **Sim** — não duplicar `Task` | Médio: idempotência da tarefa por IA a auditar | Estender, não clonar |
| Agenda | — | **∅** | — | — | Plano PR 03 |
| Formulários | `Form`, `FormField`, `LeadAnswer`, `lib/forms` | M | Sim | P0 #624 | — |
| Inbox / conversas | `Conversation`, `Message`, `lib/inbox`, `lib/conversations` | M | Sim (fonte de eventos) | PII | — |
| Notificações | `lib/notifications`, rotas `notifications` | M | Sim | Baixo | — |
| **Flip AI — agentes** | `FlipAiAgent` (por tenant, ligado a pipeline/etapa/rodízio), `lib/flip-ai/agents.ts` (rascunho/versão/status) | M | **Parcial** — são agentes de **atendimento ao lead**, não agentes de trabalho interno | Médio | Reusar padrão de versão/status no Agent Registry |
| Flip AI — conhecimento/RAG | `FlipAiKnowledgeBase/Document/Revision/Index/Batch/Chunk`, `embedding vector(1536)` (pgvector), `lib/flip-ai/knowledge.ts`, `chunking.ts`, `indexing.ts`, `openai-embeddings.ts` | M | **Sim** — base do Segundo Cérebro V1 | Médio: ACL por documento não existe (escopo = agente/tenant) | E4 |
| Flip AI — uso e custo | `FlipAiUsageEvent` (`requestKey` único, tokens, modelo, provedor), `lib/flip-ai/usage*.ts`, `openai-pricing.ts`, `openai-admin-observability.ts` | M | **Sim** — base do Usage & Billing Guard | Baixo | Generalizar `agentId` → run |
| Flip AI — carteira de créditos | `FlipAiCreditAccount`, `FlipAiCreditLedgerEntry` (idempotente por `tenantId+idempotencyKey`), top-ups Stripe | M | **Sim** — orçamento por tenant | Médio: dinheiro real | Só leitura no E3 |
| Flip AI — modelos | `text-model-catalog.ts` (default `gpt-5.6-luna`), `openai-responses.ts` (streaming), `harness-resolver.ts` (orçamento de tokens/histórico) | M | **Sim** — virar adaptador do Model Router | Médio: provedor único | E3/E10 |
| Flip AI — voz | `openai-realtime.ts`, `realtime-session.ts`, `openai-transcription.ts`, `openai-speech.ts`, `elevenlabs-speech.ts`, `AgentSpeechSetting` | M | **Sim** — base de E7 | Alto: custo e consentimento | E7 |
| Flip AI — handoff humano / ações | `human-handoff*.ts`, `human-action-request*.ts`, `action-capabilities*.ts`, `action-eligibility.ts` | M | **Sim** — conceito de capacidade + elegibilidade | Médio | Base do Tool Gateway |
| Flip AI — decisão | `decision-engine.ts`, `jev-*.ts` (intenção/objeção/estágio, flags por tenant/plano) | M | Parcial (domínio de atendimento) | Baixo | — |
| Flip AI — busca web | `external-web-search.ts`, `FlipAiExternalSource`, `FlipAiExternalSearchCache` | M | Sim, com allowlist | **Alto**: SSRF/injeção | Gateway |
| Flip (assistente interno) | `lib/flip/ask*.ts`, `briefing*.ts`, `suggestions*.ts`, `learning*.ts`, `alerts*.ts`; `FlipDailyBriefing`, `FlipSuggestion` | M | **Sim** — embrião do Pollo CEO consultivo | Médio: limite `FLIP_DAILY_REQUEST_LIMIT = 3` (fuso America/Sao_Paulo) não é atômico | E5 / PR 11 |
| IA WhatsApp / Instagram | `lib/whatsapp-ai/*` (36 arquivos), `lib/instagram-ai`, settings por tenant | M | Agentes operacionais existentes | Alto: envio real a clientes | Não tocar no E0–E3 |
| Motor de automação | `lib/automation/execution-engine.ts` + `worker.ts`: fila em `webhook_events` (`provider='automation_execution_v1'`), `FOR UPDATE SKIP LOCKED`, tentativas máximas, recuperação de execução travada; disparo por `app/api/internal/jobs/*` com `CRON_SECRET`, `maxDuration=60` | M | **Sim** — padrão de fila durável em Postgres | Médio: limite de 60 s por drenagem; jobs longos de agente não cabem | ADR-001 decide |
| Auditoria | `AuditLog` (tenant, user, entity, action, metadata), `lib/audit.ts`; `lib/platform-audit.ts` | M | Sim para trilha humana | **Alto**: `platform-audit` pode escolher tenant arbitrário sem tenant informado (Plano 00A.2) | Novo `ToolCallAudit` com tenant obrigatório |
| Rate limit | `lib/rate-limit.ts` + `RateLimitBucket`; fallback em memória se o banco falhar | M | Sim para leitura | **Alto** para escrita (falha permissiva) | Fail-closed em ferramentas de escrita |
| Billing | Stripe (`lib/stripe`, `lib/billing*`), `Plan`, `Subscription`, `BusinessGroupPlan`; `premium-pro` com `isActive:false` no catálogo (Plano 00A.2, NV em produção) | M | Sim via entitlements | Alto | Reconciliar planos (gate 00A.5) |
| Integrações | Meta/Instagram (`TenantMetaConnection`, `TenantInstagramConnection`), WhatsApp Cloud (`TenantWhatsAppConnection`), Google Conversions (`GoogleConversionEvent`), ZapSign (`LeadContract`) | M | Sim, **só leitura** pelo Pollo CEO | **Crítico**: conversões publicitárias e envios reais | Não acionar por agente |
| Armazenamento | `lib/storage/attachment-storage.ts` (Cloudflare R2) | M | Sim para Segundo Cérebro | Médio | E4 |
| Observabilidade | Sentry (`sentry.*.config.ts`, `sentry.privacy.ts`), `lib/observability.ts`, `instrumentation.ts` | M | Sim | Baixo | Correlation ID por run |
| API `/api/v1` | `lib/api-v1/*` (identidade M2M, credenciais hash/rotação, idempotência, quota, inbox/outbox, webhooks HMAC/replay/SSRF), rotas `capabilities`, `status`, `pipelines`, `forms`, `forms/{id}/fields`, OpenAPI `docs/api/openapi-v1.yaml` | **D** (#627/#628) | **Sim — é o contrato que o Pollo CEO deve consumir** | NO-GO de staging (ver PR) | E1 |
| Modelos API v1 | `ApiIntegration`, `ApiCredential`, `ApiCredentialAudit`, `TenantEntitlementGrant`, `ApiV1QuotaBucket`, `ApiV1IdempotencyRecord`, `ApiV1InboxEvent`, `ApiV1OutboxEvent`, `ApiV1WebhookReplay`, `ApiV1DeliveryAttempt` | **D**, **sem arquivo de migration** (só ensaios offline) | Sim | Alto: migration pendente de gate | E1 |
| CI | `ci.yml` (DB isolado, `prisma validate`, `typecheck`, pytest, testes tsx, `env:check`, build; `npm audit` com `continue-on-error`), `playwright.yml`, `security.yml`, `zap.yml`, `sync-lockfile.yml` | M | Sim | Médio: audit não bloqueante | — |
| Workflows de reparo | `repair-{production,business-group,team-hierarchy,whatsapp-cloud}-schema.yml` — **só `workflow_dispatch`** (manual) | M | **Não tocar** | Crítico | Estado "desativado" no GitHub: **NV** |
| Deploy | `vercel.json` desliga deploy automático das branches de auditoria PR00 e de `feature/pr01-global-api-foundation` | M/D | — | — | — |
| Flip Intelligence (app) | Nenhum código encontrado em `main` nem nos repositórios listados | **∅** | — | — | Plano PRs 08–11 |
| Pollo OS / Pollo CEO | Nenhum código | **∅** (só documentos e protótipos HTML) | — | — | E3+ |

## Outros repositórios da conta (lidos em `--depth 1`)

| Repositório | O que é | Relevância |
|---|---|---|
| `flipschedule` (privado, TS, 732 arquivos) | App com `frontend/`, `backend/server.py` (Python), `memory/PRD.md` | Candidato a **agenda** (PR 03); auditar antes de reaproveitar |
| `flippush` (privado, TS, 58 arquivos) | App Next.js pequeno com `db/` e `SECURITY.md` | Não relacionado a agentes; NV |
| `mcp-agendamentos` (privado, Python, 6 arquivos) | "Servidor MCP genérico para agendamentos (n8n)" | **Único MCP existente da Pollo**; referência para ferramentas de agenda |
| `pollo-os` | Documentação (este repositório) | — |
| `openbot-estudo` | Cópia de estudo do OpenBot da CopilotKit | Ver `openbox-reuse-audit.md` |

## Fontes internas

| Documento | Situação |
|---|---|
| Plano Mestre v6.1 (`Downloads/Pollo_OS_Plano_Mestre_v6.1_Aprovacao_Tecnica_PR01.md`) | **Lido** (seções 00A, 14, 17) |
| Prompt Claude Design v3 (`Downloads/PROMPT_CLAUDE_DESIGN_POLLO_OS_V3_UX_INTUITIVO_POLLO_CEO_2026-11-20.md`) | Localizado; estrutura lida |
| `POLLO_OS_AGENTE_CEO_DOCUMENTO_MESTRE_E_PROMPT_V1_2026-11-20.md` | **NÃO ENCONTRADO** no computador |
| `POLLO_OS_AGENTE_CEO_PROMPT_SISTEMA_V1_2026-11-20.md` | **NÃO ENCONTRADO** |
| `POLLO_OFERTA_COMERCIAL_ENTERPRISE_360_2026-11-21.md` | **NÃO ENCONTRADO** |
