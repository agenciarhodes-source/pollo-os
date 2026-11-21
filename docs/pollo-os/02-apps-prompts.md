# Pollo OS — prompts para os apps da Pollo

Cada app da Pollo entra no Pollo OS de duas formas:

1. **Como ferramenta para os Bots**: um servidor MCP (Model Context Protocol). O Bot passa a
   poder consultar e agir no app ("crie um formulário", "qual o ticket médio da semana?").
2. **Como painel para as pessoas**: uma tela própria que o cliente abre dentro do Pollo OS.

Complete os trechos entre `[colchetes]` com o que cada app faz hoje antes de colar.

---

## Prompt-base para qualquer app virar ferramenta dos Bots

```
Crie um servidor MCP (Model Context Protocol) em TypeScript para o app "[NOME DO APP]", usando
o SDK oficial @modelcontextprotocol/sdk com transporte HTTP streamable na rota /mcp.

O app faz: [descreva em 2 ou 3 frases].

Ferramentas que o servidor deve oferecer (cada uma com descrição clara e parâmetros em JSON Schema):
- [ferramenta 1: o que faz, parâmetros, o que devolve]
- [ferramenta 2]
- [ferramenta 3]

Regras:
- Autenticação por OAuth 2.0 (cada pessoa conecta a própria conta) ou por chave de API da
  empresa no cabeçalho Authorization: Bearer.
- Cada ferramenta responde em JSON curto e, quando der, também em texto legível para o Bot.
- Ferramentas que alteram dados (criar, apagar, enviar, pagar) devem ter "destructiveHint": true
  nas anotações, para o Pollo OS pedir aprovação antes.
- Erros numa frase clara que diga o que fazer.
- Inclua testes e um Dockerfile.
```

---

## Flipform

```
Use o prompt-base de servidor MCP para o app "Flipform".
O app faz: [ex.: cria formulários e coleta respostas de clientes].
Ferramentas:
- listar_formularios: devolve id, título, nº de respostas e data de criação.
- criar_formulario: recebe título e lista de perguntas (texto, múltipla escolha, data, arquivo);
  devolve o link público. Marcar como destrutiva.
- respostas_do_formulario: recebe id e período; devolve as respostas em tabela.
- resumo_do_formulario: recebe id; devolve contagens e médias por pergunta.
```

## Flip Intelligence

```
Use o prompt-base de servidor MCP para o app "Flip Intelligence".
O app faz: [descreva].
Ferramentas:
- [ex.: consultar_indicadores: recebe indicador e período; devolve a série histórica]
- [ex.: gerar_relatorio: recebe tema; devolve um relatório em Markdown]
- [ex.: alertas_ativos: devolve os alertas atuais com gravidade]
```

## Painel de Inteligência de Mercado

```
Crie um painel web "Inteligência de Mercado" do Pollo OS (React + TypeScript + Tailwind) e um
servidor MCP que expõe os mesmos dados aos Bots.

Painel:
- Concorrentes monitorados: preço, produtos, novidades, presença digital.
- Tendências do setor do cliente: [setor], com notícias e buscas em alta.
- Indicadores: participação estimada, faixa de preço, sazonalidade.
- Filtros por região, período e categoria. Exportar para PDF e planilha.

Fontes de dados: [ex.: Google Trends, sites dos concorrentes, APIs de notícias, base própria].

Ferramentas MCP:
- comparar_concorrentes(categoria, regiao)
- tendencias(setor, periodo)
- resumo_de_mercado(setor): texto curto com os 5 pontos mais importantes da semana.
```

## Painel de CRM de Vendas integrado ao ERP

```
Crie um painel web "CRM de Vendas" do Pollo OS (React + TypeScript + Tailwind, backend em
TypeScript + PostgreSQL) integrado ao ERP do cliente, e um servidor MCP para os Bots.

CRM:
- Funil de vendas em colunas (lead, contato, proposta, negociação, ganho, perdido), arrastar e
  soltar.
- Ficha do cliente: contatos, histórico de compras (vindo do ERP), propostas, tarefas, anotações.
- Metas por vendedor, previsão de vendas e ticket médio.

Integração com ERP:
- Camada de conectores com uma interface comum (clientes, produtos, pedidos, notas fiscais,
  estoque, contas a receber).
- Primeiros conectores: [ex.: Bling, Tiny, Omie, Sankhya, TOTVS Protheus, SAP Business One].
- Sincronização incremental a cada 15 minutos e por webhook quando o ERP oferecer.

Ferramentas MCP:
- buscar_cliente(nome_ou_documento)
- historico_de_compras(cliente_id, periodo)
- criar_oportunidade(cliente_id, valor, etapa): destrutiva.
- mover_oportunidade(id, etapa): destrutiva.
- previsao_de_vendas(periodo, vendedor?)
- estoque_do_produto(produto)
```

## Agenda

```
Crie um servidor MCP "Agenda" do Pollo OS que conecta Google Agenda e Microsoft Outlook por
OAuth 2.0.
Ferramentas:
- listar_eventos(inicio, fim)
- horarios_livres(participantes, duracao, periodo)
- criar_evento(titulo, inicio, fim, participantes, local_ou_link): destrutiva.
- remarcar_evento(id, novo_inicio): destrutiva.
- cancelar_evento(id): destrutiva.
```

## Pagamentos

```
Crie um servidor MCP "Pagamentos" do Pollo OS com conectores para [ex.: Mercado Pago, Asaas,
Stripe, PagSeguro], usando a chave de API da empresa.
Ferramentas:
- consultar_recebimentos(periodo, status)
- cobrancas_em_aberto(cliente?)
- gerar_cobranca(cliente, valor, vencimento, forma: pix | boleto | cartao): destrutiva e sempre
  com aprovação humana.
- status_do_pagamento(id)
Nunca permitir estorno ou transferência sem aprovação humana registrada na auditoria.
```

---

## Como ligar um app pronto ao Pollo OS

Depois que o servidor MCP estiver no ar (ex.: `https://flipform.pollo.app/mcp`):

1. No Pollo OS, entre em **Apps** e adicione um app novo com esse endereço.
2. Escolha se a conexão é por pessoa (OAuth) ou pela empresa (chave).
3. Em cada Bot, libere as ferramentas desse app e escolha quais pedem aprovação.
