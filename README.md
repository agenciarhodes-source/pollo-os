<div align="center">

# Pollo OS

### O sistema operacional da sua empresa, com agentes de IA trabalhando junto

</div>

O Pollo OS é a interface onde a empresa reúne as suas ferramentas e trabalha com agentes de IA
(os Bots). Não é um CRM nem mais um sistema de gestão: é o lugar de onde a pessoa abre e usa os
apps da Pollo, como o **Flipform** e o **Flip Intelligence**, e onde os Bots executam tarefas
nesses apps, pedindo aprovação antes de qualquer ação importante.

## Situação

O **front está sendo refeito do zero**, a partir de uma nova referência visual. O que está neste
repositório hoje é a base que não depende do visual.

| Pasta | O que é |
| --- | --- |
| `api/` | A especificação da API do servidor (OpenAPI) |
| `shared/` | Código compartilhado (tipos e regras) |
| `agent-*/` | Adaptadores para agentes de vários frameworks (LangGraph, CrewAI, Mastra, Claude SDK…) |
| `management-agent/` | O agente que administra o Pollo OS |
| `docs/pollo-os/` | Prompts e mapas do Pollo OS |

## Documentos

- [**Plano da diretriz v2**](docs/pollo-os/07-diretriz-v2-plano.md) (Home, Agenda, reuniões com IA: diagnóstico e PRs A a E)
- [Servidor do Pollo OS](docs/pollo-os/01-servidor-prompts.md)
- [Apps da Pollo como ferramentas dos Bots](docs/pollo-os/02-apps-prompts.md)
- [Mapa do backend](docs/pollo-os/06-mapa-da-estrutura.md) (rotas, tabelas e variáveis)
- [Ver ao vivo e publicar: GitHub → Neon → Vercel](docs/pollo-os/05-deploy-github-neon-vercel.md)

## Licença

Veja [LICENSE](LICENSE).
