<div align="center">

<img src="app/src/assets/pollo-os-logo.svg" alt="" width="72">

# Pollo OS

### Agentes de IA que trabalham para a sua empresa

</div>

O Pollo OS é um espaço de trabalho onde as pessoas conversam com agentes de IA (os Bots) e eles
executam tarefas: usam navegador e ferramentas, consultam os sistemas da empresa e pedem aprovação
antes de qualquer ação importante.

Dentro do Pollo OS, o cliente também acessa os apps da Pollo (Flipform, Flip Intelligence, painel
de inteligência de mercado e CRM de vendas integrado ao ERP), e os Bots podem usar esses apps
como ferramentas.

## O que tem aqui

| Pasta | O que é |
| --- | --- |
| `app/` | O app web (React + Vite) |
| `desktop/` | O app para Windows e Mac (Tauri) |
| `mobile/` | O app para celular |
| `extension/` | A extensão do navegador |
| `agent-*/` | Adaptadores para agentes de vários frameworks (LangGraph, CrewAI, Mastra, Claude SDK…) |
| `api/` | A especificação da API do servidor (OpenAPI, 433 operações) |
| `docs/pollo-os/` | **Prompts para construir o que falta** |

## O que falta construir

O servidor central não vem neste código. Os prompts para construí-lo, módulo por módulo, estão
em [`docs/pollo-os/01-servidor-prompts.md`](docs/pollo-os/01-servidor-prompts.md).

- [Servidor do Pollo OS](docs/pollo-os/01-servidor-prompts.md)
- [Apps da Pollo como ferramentas dos Bots](docs/pollo-os/02-apps-prompts.md)
- [Identidade visual e Bots](docs/pollo-os/03-identidade-prompts.md)

## Origem e licença

O Pollo OS foi criado a partir do modelo de código aberto
[OpenBot](https://github.com/CopilotKit/OpenBot), da CopilotKit, distribuído sob a licença MIT.
O aviso de copyright original está mantido em [LICENSE](LICENSE), como a licença exige. O README
original está em [docs/openbot-upstream/README.md](docs/openbot-upstream/README.md).
