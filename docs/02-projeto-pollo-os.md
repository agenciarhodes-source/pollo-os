# Projeto Pollo OS

> **Atualização (21/11/2026):** o proprietário confirmou que o Pollo OS é uma **aplicação separada**, e o FlipForm conecta depois por API. As regras de segurança e o mapa de agentes do [ADR-001](architecture/pollo-os-adr-001.md) continuam valendo.

## O que é

O Pollo OS é um espaço de trabalho onde empresas têm **Bots**: colegas de trabalho de IA que
conversam com as pessoas, executam tarefas nos sistemas da empresa e pedem aprovação antes de
qualquer ação importante.

Diferencial: os **apps da Pollo** (Flipform, Flip Intelligence, Inteligência de Mercado, CRM de
Vendas) vêm dentro do sistema, e os Bots sabem usá-los. O Pollo OS também se conecta ao ERP, à
agenda e aos meios de pagamento de cada cliente.

**Para quem:** pequenas e médias empresas brasileiras que querem automatizar vendas, atendimento,
relatórios e operação sem contratar uma equipe de TI.

---

## As 8 peças do Pollo OS

Usamos a mesma organização em pares (ver `01-mapa-da-logica.md`), com nomes nossos:

| Peça | No Pollo OS |
| --- | --- |
| **Conversas** | Chat com um ou vários Bots. Texto, áudio e arquivos. Resultados interativos (tabelas, gráficos, botões). |
| **Rotinas** | "Toda segunda…", "Quando entrar um pedido…", "Até bater a meta…". |
| **Memória** | O que o Bot sabe da empresa: clientes, produtos, pessoas, preferências. |
| **Habilidades** | Passo a passo reutilizável, chamado com `/`. Ex.: `/relatorio-semanal`, `/proposta`. |
| **Apps** | Apps Pollo + conexões (ERP, Google, Microsoft, WhatsApp, pagamentos). |
| **Computador** | Navegador próprio do Bot para sites sem integração (fase 3). |
| **Aprovações** | O que sempre pergunta, regras da empresa, aprovação pelo celular. |
| **Atividade** | Registro completo do que cada Bot fez. |

Mais o **Cofre** (senhas e chaves) e a **Administração** (pessoas, equipes, permissões, planos).

---

## Bots de fábrica

| Bot | Função | Apps que usa |
| --- | --- | --- |
| **Assistente Pollo** | Faz um pouco de tudo no dia a dia | Agenda, e-mail, documentos |
| **Vendas** | Funil, propostas, follow-up, previsão | CRM, ERP, Flipform |
| **Mercado** | Concorrência, tendências, preços | Inteligência de Mercado, Flip Intelligence |
| **Financeiro** | Cobranças, recebimentos, inadimplência | ERP, Pagamentos |

Cada cliente pode criar os seus.

---

## Arquitetura recomendada (toda nossa)

```
 Navegador / Celular / WhatsApp
            │
   ┌────────▼────────┐
   │  App Pollo OS   │  Next.js (React) — telas, chat ao vivo
   └────────┬────────┘
            │  API REST + streaming (SSE)
   ┌────────▼────────────────────────────────────────┐
   │  Servidor Pollo OS (Node.js + TypeScript)       │
   │  • Login, empresas, pessoas, permissões         │
   │  • Motor dos Bots (chama o modelo de IA)        │
   │  • PORTARIA: política → registro → execução     │
   │  • Aprovações, rotinas, memória, cofre          │
   └───┬──────────────┬──────────────┬───────────────┘
       │              │              │
  PostgreSQL     Fila de tarefas   Apps via MCP
  + pgvector     (rotinas)         ├─ Flipform
                                   ├─ Flip Intelligence
                                   ├─ Inteligência de Mercado
                                   ├─ CRM de Vendas ── ERP do cliente
                                   ├─ Agenda (Google / Outlook)
                                   └─ Pagamentos (Pix, boleto, cartão)
```

**Escolhas e por quê:**
- **Next.js + TypeScript:** um só idioma no app e no servidor; muita gente sabe; hospeda fácil.
- **PostgreSQL com pgvector:** guarda tudo e ainda faz a busca da memória. Sem serviço extra pago.
- **Vercel SDK de IA (pacote `ai`) ou SDK oficial de cada provedor:** para falar com OpenAI,
  Claude e Gemini com a mesma interface, com streaming e ferramentas.
- **MCP** para todos os apps: o mesmo encaixe para apps da Pollo e de terceiros.
- **Hospedagem sugerida:** Vercel (app) + Neon (PostgreSQL) para começar; servidor de rotinas
  e navegador dos Bots num serviço com contêineres (Railway, Render ou Fly.io).

---

## Ordem de construção

### Fase 1 — MVP vendável (o mínimo para o primeiro cliente)
1. Login, empresa, pessoas e papéis (admin / membro).
2. Conexão com modelo de IA (chave da empresa ou da Pollo).
3. Bots: criar, editar instruções, escolher modelo e apps.
4. Conversas com resposta ao vivo e histórico.
5. Apps via MCP + **CRM de Vendas** e **Flipform** como os primeiros.
6. Portaria + Aprovações + Atividade.

### Fase 2 — Bots que trabalham sozinhos
7. Rotinas (horário e eventos).
8. Memória.
9. Habilidades.
10. Agenda, e-mail e pagamentos.
11. Flip Intelligence e Inteligência de Mercado.

### Fase 3 — Escala e empresas maiores
12. Computador/navegador dos Bots.
13. Equipes, SSO da empresa, políticas avançadas.
14. App de celular e WhatsApp como canal de conversa.
15. Conectores de ERP adicionais.

### Fase 4 — Negócio
16. Planos e cobrança dos clientes (assinatura).
17. Painel da Pollo para acompanhar todas as empresas clientes.
18. Loja de Bots e habilidades prontas por setor.

---

## Identidade

- Nome: **Pollo OS**. Idioma principal: português do Brasil.
- Logo, cores e tom de voz: definir com o designer (prompts em `03-prompts.md`, seção Identidade).
- Toda tela fala a língua do cliente: "Bot", "Rotina", "Aprovação", "Atividade", sem jargão técnico.
