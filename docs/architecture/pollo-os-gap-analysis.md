# E0 — Análise de lacunas: Prompt Mestre × código real

Status: **M** mergeado em `main` · **D** draft · **∅** inexistente. "Mergeado" ≠ implantado ≠ homologado.

## 1. Diagnóstico em uma página

**Já funciona (M):** CRM multi-tenant com RBAC de 5 papéis, sessão JWT, tarefas, inbox, notificações, Stripe; **Flip AI** maduro para atendimento (agentes por pipeline, RAG pgvector 1536, uso por tokens, carteira de créditos idempotente, voz realtime/transcrição/TTS, handoff humano, busca web); **Flip** interno (ask/briefing/sugestões/alertas, 3 por dia); motor de automação com fila durável em Postgres; Sentry; R2.

**Em draft (D):** `/api/v1` M2M completo em desenho (#627), com leitura de pipelines (#627) e de formulários e campos (#628), e 10 modelos novos **sem migration**. Releases em **NO-GO**: faltam `runtime_db_identity_attested` e `staging_egress_isolation_attested`. PR00 tem 8 PRs abertos, incluindo **dois P0 de segurança** (#624 identidade de formulário público, #625 CAS em mudança de etapa).

**Ainda é visão (∅):** Pollo OS (portal, SSO entre apps, app switcher), Pollo CEO, Flip Intelligence, Agent Registry de trabalho interno, runs/passos/handoffs, Tool Gateway genérico, aprovações de decisão executiva, reuniões, Segundo Cérebro com ACL, Model Router multiprovedor, orçamento por run, agenda.

**Conflitos com o roadmap:**
1. O Prompt Mestre propõe E3 (Control Plane de agentes) **antes** de E5, mas o Plano Mestre só libera o Pollo OS no **PR 12**, depois de PR 08–11 (Intelligence + Flip). As épicas precisam ser encaixadas na numeração oficial, não correr em paralelo.
2. Rotas candidatas `/api/os/*` **não conflitam** com `/api/v1/*`. Mas o Pollo CEO **deve consumir** `/api/v1` (ou serviços internos equivalentes) em vez de criar leitura paralela do CRM.
3. O Plano diz "não criar três mecanismos de IA desconectados" (§14.1). O Pollo CEO tem de ser um **perfil** da fundação Flip AI, não um sistema novo.
4. O documento `02-projeto-pollo-os.md` deste repositório propunha um app novo (Next.js + Postgres próprios). **Fica superado pelo ADR-001** para a engenharia; permanece só como visão de produto.

## 2. Lacunas por serviço lógico

| Serviço (Prompt Mestre §3.1) | O que existe | Lacuna | Gravidade |
|---|---|---|---|
| Identity & Entitlements | JWT/cookie, RBAC, `Plan`/`Subscription`, `TenantEntitlementGrant` (D) | SSO entre apps; seleção de empresa unificada; matriz Premium/Premium Pro reconciliada | Bloqueante p/ PR 12 |
| Agent Registry | `FlipAiAgent` (atendimento) | Definição/versão de agentes internos com dono, finalidade, ferramentas, nível e autonomia | Alta |
| Orchestration Engine | Fila de automação (`webhook_events`, SKIP LOCKED, 60 s) | Máquina de estados de run/passo, checkpoints, cancelamento, anti-loop | Alta |
| Tool Gateway | `action-capabilities`, `action-eligibility`, `/api/v1` policy (D) | Catálogo de tools versionado, política por tenant/plano/autonomia, auditoria **antes** da execução | **Crítica** |
| Knowledge & Memory | `FlipAiKnowledge*` + pgvector | ACL por documento, tipos (fato/regra/decisão/hipótese), validade, revisão, exclusão propagada | Alta |
| Analytics & Context | `lib/dashboard-metrics.ts`, `lib/reports` | Snapshots de KPI com fonte/período/frescor; Flip Intelligence inexistente | Alta |
| Realtime Conversations | Voz realtime e transcrição do Flip AI | Conversa do CEO (texto + áudio gravado) sobre a mesma base | Média |
| Agent Control Center | — | Tela e estados reais `queued/running/waiting_approval/...` | Média |
| Decision Workflow | `human-action-request*` | Proposta → aprovação atômica → execução → evidência | Alta |
| Usage & Billing Guard | `FlipAiUsageEvent`, carteira, `openai-pricing` | Orçamento por run/agente, alertas 50/75/90/100 %, corte | Média |
| Observability & Safety | Sentry, `AuditLog` | `ToolCallAudit` com tenant obrigatório; correlação por run; testes adversariais | Alta |

## 3. Riscos herdados que afetam os agentes

| Risco | Onde | Por que importa para agentes | Mitigação |
|---|---|---|---|
| Fallback permissivo de rate limit | `lib/rate-limit.ts` | Agente em loop pode estourar escrita se o banco cair | Ferramentas de escrita fail-closed |
| Tenant arbitrário na auditoria | `lib/platform-audit.ts` | Registro de ação do agente no tenant errado | Nunca usar; auditoria nova exige tenant |
| Limite do Flip não atômico | `lib/flip/daily-limit.ts` | Pollo CEO poderia contornar a franquia | Serviço de quota atômico (PR 11) |
| P0 abertos do PR00 | #624, #625 | Agentes que movem etapa ou leem formulário herdam o bug | Pré-requisito do E1 |
| Envios reais (WhatsApp, Instagram, conversões Google/Meta) | `lib/whatsapp-ai`, `lib/tracking` | Ação externa irreversível | Fora do catálogo de tools do CEO até E8 |
| Provedor único (OpenAI via `fetch`) | `lib/flip-ai/openai-*.ts` | Custo e indisponibilidade | Interface de provedor no E3; roteamento no E10 |
