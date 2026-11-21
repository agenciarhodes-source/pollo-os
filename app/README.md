# Pollo OS — app (modo demonstração)

App Next.js 15 do Pollo OS, construído **separado do FlipForm**. Reproduz o protótipo Pollo CEO v3
com rotas reais, mas ainda **sem IA, banco, login real nem integrações**. Todos os dados são
fictícios (empresa exemplo "Horizonte Imóveis") e ficam em `src/demo/data.ts`.

## Rodar

```bash
npm install
npm run dev -- --port 3020   # http://localhost:3020
npm run build                # checagem de produção (tipos + lint)
```

## Telas

| Rota | Tela |
|---|---|
| `/login` | Entrar (escolha de perfil de exemplo) |
| `/empresa` | Seleção de empresa (perfil com mais de uma) |
| `/ceo` | Pollo CEO — resumo do dia, perguntas e respostas roteirizadas |
| `/visao-executiva` · `/visao-analitica` | Indicadores com fonte e período |
| `/reunioes` · `/agentes` · `/decisoes` · `/segundo-cerebro` | Gestão |
| `/integracoes` · `/consumo` | Sistema |
| `/apps` · `/configuracoes` | Aplicativos e conta |

## Perfis de exemplo

- **Marina Andrade**: proprietária, vê tudo e aprova decisões.
- **Bruno Lima**: atendente, sem acesso ao Pollo OS (testa o bloqueio).
- **Patrícia Nunes**: duas empresas; a "Casa Nobre" não tem dados (testa o isolamento).

## Estrutura

- `src/app/globals.css`: identidade visual extraída do protótipo v3.
- `src/demo/`: dados fictícios e sessão simulada (localStorage). **Substituir pela API real**.
- `src/components/`: Shell (menu, topo, troca de empresa e de app), ícones e componentes base.
- `src/app/(os)/*`: uma pasta por tela.
