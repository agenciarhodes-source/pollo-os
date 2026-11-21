# E0 — Auditoria "Openbox" e matriz de reaproveitamento

**Data:** 21/11/2026 · **Modo:** somente leitura.

## 1. Onde procuramos

| Local | Método | Resultado |
|---|---|---|
| `flipform` — **todas as 637 branches + heads dos PRs #627/#628** | `git grep -i 'openbox\|openclaw\|openbot\|copilotkit'` em cada ponta | **0 ocorrências** |
| `flipform` — **todo o histórico** (`--all`) | nomes de arquivo em todos os commits + `git log -G` | **0 ocorrências** |
| `flipform` — submódulos | `.gitmodules` em todas as pontas | **nenhum** |
| `flippush`, `flipschedule`, `mcp-agendamentos` | `git grep` (depth 1) | **0 ocorrências** |
| Disco `C:\Users\ACER` (exceto AppData/node_modules) e `D:\` | busca por nome `*openbox*`, `*openclaw*`, `*openbot*` | ver item 2 |

**Nenhum arquivo chamado "Openbox" existe** nos repositórios nem no disco. O que existe são **dois projetos diferentes, ambos chamados "OpenBot"**, e é muito provável que "Openbox" se refira a um deles. O proprietário precisa confirmar qual.

## 2. O que foi encontrado

### A) OpenBot da **Synthetify Labs** — instalado neste computador

| Item | Evidência |
|---|---|
| Instalador | `C:\Users\ACER\Downloads\OpenBot-0.75.0-x64.exe` (235 MB, 20/11/2026) |
| App instalado | `C:\Users\ACER\AppData\Local\Programs\OpenBot\` — **Electron** |
| Pasta de trabalho | `C:\Users\ACER\OpenBot\` (`Agents`, `Downloads`, `Shared`) — **vazia** (0 arquivos) |
| Atalho | `OneDrive\Desktop\OpenBot.lnk` |
| Origem | `resources/app-update.yml`: `owner: nightly-labs`, `repo: openbot`, editor **SYNTHETIFY LABS sp. z o.o.** (Polônia) |
| Repositório | `github.com/nightly-labs/openbot` (público, TypeScript, ~9,6 mil estrelas, ativo, última versão v0.76.0) |
| Descrição | "Local-first desktop workspace for persistent AI teammates": Codex, Claude e Grok com workspaces, filas de tarefas, compartilhamento de arquivos, controle de navegador e colaboração agente-a-agente |
| **Licença** | **PolyForm Noncommercial 1.0.0**. `NOTICE`: "For a commercial license, contact licenses@openbot.run" |
| Componentes no pacote | `agent-runtime`, `cli/openbot-cli.mjs`, `cua-driver` (uso de computador), `remote-desktop-runtime`, `voice` (modelos Whisper, Parakeet, Cohere Transcribe, Supertonic, Bark), `managed-skills`, `plugin-catalog`, SDK 1Password |
| Arquitetura | **Desktop local, single-user**; os agentes são CLIs de terceiros (Codex/Claude/Grok) executando na máquina do usuário |

### B) OpenBot da **CopilotKit** — baixado nesta sessão para estudo

| Item | Evidência |
|---|---|
| Local | `D:\Pollo OS\_estudo-openbot\` e repositório privado `agenciarhodes-source/openbot-estudo` (cópia de `github.com/CopilotKit/OpenBot`, commit `aa72929`) |
| Licença | **MIT** apenas para o "template" (app web, desktop Tauri, mobile, extensão, adaptadores de agentes, especificação OpenAPI) |
| **Servidor** | **Não publicado**: imagem fechada `ghcr.io/copilotkit/openbot` sem licença declarada; exige **CopilotKit Intelligence** (licença comercial paga em produção) |
| Arquitetura | Workspace multiusuário: Bots, AG-UI, MCP, gateway de ferramentas com política/auditoria, aprovações, computadores por Bot, rotinas, memória |
| Decisão anterior do proprietário | Usar **somente como inspiração**, sem código no produto |

## 3. Matriz de reaproveitamento

"Reutilizar código" só é possível onde a licença permite **e** o desenho serve a SaaS multi-tenant. Nos dois casos a resposta é **não reutilizar código**: A é não comercial e B tem o núcleo fechado e é desenhado em torno de um serviço pago. Reaproveitamos **conceitos**, implementados dentro do FlipForm.

| Capacidade | Existe no analisado? | Como funciona | Reutilizar | Adaptar (conceito) | Rejeitar | Isolamento necessário |
|---|---|---|---|---|---|---|
| Motor de agentes | A: runtime local que dirige CLIs Codex/Claude/Grok. B: servidor fechado + agentes AG-UI | A: processo local por usuário. B: turno → endpoint AG-UI | — | Contrato de "run" com eventos em streaming (B) | Código de A (licença) e servidor de B (fechado) | Run sempre com `tenantId`, ator e orçamento |
| Registro/catálogo | A: catálogo de plugins/skills. B: Bots com instruções, modelo e grants | Configuração por Bot | — | **Agent Registry** com versão/status (já há padrão em `FlipAiAgent`) | — | Por tenant; versão imutável publicada |
| Tasks/queue | A: fila de tarefas local. B: rotinas com piso de 15 min e teto de 20 | A: memória local. B: agendador no servidor | — | **Fila durável em Postgres** (padrão de `lib/automation/execution-engine.ts`) | Fila local de A | `SKIP LOCKED`, idempotência, dead-letter, kill switch por tenant |
| Ferramentas | A: CLIs com shell/arquivos/navegador. B: MCP via gateway | B: resolve alvo → política → auditoria → execução | — | **Tool Gateway** com essa ordem; ferramentas tipadas em vez de shell | Shell/CLI arbitrário (A) | Allowlist, schema estrito, fail-closed em escrita |
| Memória | A: arquivos locais. B: memória pessoal + por Bot no Intelligence | — | **FlipAiKnowledge*** (próprio, pgvector) | Separar fato/regra/decisão/hipótese (Prompt Mestre §6) | Serviço pago de B | ACL antes da busca; nunca entre tenants |
| Subagentes/delegação | A: agente-a-agente. B: `message_bot` com handoff tipado | B: quem/onde/autoria/profundidade decididos pelo sistema | — | **Handoff tipado** + limite de profundidade e orçamento | Delegação livre por texto | Profundidade máx., detector de repetição, circuit breaker |
| Observabilidade | A: NV. B: trilha de auditoria por decisão | — | Sentry + `FlipAiUsageEvent` (próprios) | Correlation ID por run/passo | Telemetria de terceiros | Logs sanitizados, sem PII bruta |
| Aprovações | A: NV. B: ações sensíveis sempre perguntam; pagamento sempre humano | Estado pendente → decisão humana → execução | `human-action-request*.ts` (próprio) | Transição atômica com payload imutável | — | Anti-replay, duplo envio, CAS |
| Sandbox | A: `cua-driver` + desktop remoto local. B: contêiner por Bot (supervisor) | — | — | **Adiar** (fase posterior) | Execução de código/desktop no MVP | Contêiner isolado e egress controlado se um dia existir |

## 4. Conclusão

1. **"Openbox" não está no código da Pollo.** Os candidatos são o OpenBot da Synthetify (instalado) e o OpenBot da CopilotKit (estudo). **Pergunta bloqueante ao proprietário:** qual dos dois é o "Openbox"? Ou é um terceiro projeto?
2. **Nenhum dos dois pode virar código do Pollo OS**: A é PolyForm Noncommercial; B tem o servidor fechado e depende de serviço pago.
3. **O FlipForm já tem a maior parte da fundação** (RAG com pgvector, consumo de tokens, carteira de créditos, voz, handoff humano, fila durável, auditoria, RBAC). O caminho é **evoluir o FlipForm**, não importar um runtime externo.
4. O app da Synthetify instalado nesta máquina roda agentes com acesso ao computador. Se ele foi usado com dados de clientes, isso merece revisão de segurança (fora do escopo do E0).
