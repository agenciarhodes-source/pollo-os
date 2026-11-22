# Pollo OS — prompts para os apps da Pollo

Os apps da Pollo são dois: o **FlipForm** (operação comercial e relacionamento, com o CRM de
vendas, formulários, atendimento, funil, agenda de vendas e integração com o ERP) e o **Flip
Intelligence** (análise e inteligência de negócios, com indicadores, painéis e o Painel de
Mercado).

**O Pollo OS não é um CRM e não recria a interface desses apps.** Cada app entra no Pollo OS de
uma forma só: **como conector para os agentes**, um servidor MCP (Model Context Protocol) com
permissão. Primeiro só leitura; as ferramentas de escrita vêm depois, cada uma com autorização
e, nas sensíveis, aprovação humana. Para operar o CRM ou ver uma análise a fundo, a pessoa abre
o próprio app a partir do Pollo OS (link para o app de origem).

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

## FlipForm

O CRM de vendas, os formulários, o atendimento, o funil, a agenda de vendas e a integração com o
ERP vivem no FlipForm. O conector expõe esses dados aos agentes; não cria telas no Pollo OS.

```
Use o prompt-base de servidor MCP para o app "FlipForm".
O app faz: operação comercial e relacionamento: leads, atendimento e WhatsApp, funil de vendas,
tarefas e agenda, formulários e integração com o ERP do cliente.

Fase 1, só leitura:
- buscar_cliente(nome_ou_documento): dados do cliente e histórico de contatos.
- funil_resumo(periodo, vendedor?): quantidade e valor por etapa, sem dados pessoais em massa.
- leads_recentes(periodo, origem?): leads novos com origem e status.
- tempo_de_resposta(periodo, origem?): tempo até o primeiro contato.
- historico_de_compras(cliente_id, periodo): pedidos vindos do ERP.
- estoque_do_produto(produto): estoque vindo do ERP.
- listar_formularios / respostas_do_formulario(id, periodo) / resumo_do_formulario(id).

Fase 2, escrita (cada ferramenta com "destructiveHint": true, autorização por empresa e
aprovação humana no Pollo OS):
- registrar_contato(cliente_id, resumo)
- criar_tarefa(responsavel, titulo, prazo)
- mover_oportunidade(id, etapa)
- criar_formulario(titulo, perguntas)

Nunca: apagar ou mover leads em massa, mudar campanhas, anúncios ou pixel.
Toda resposta traz a origem ("FlipForm") e o período dos dados.
```

## Flip Intelligence

Os indicadores, os painéis, os relatórios e o Painel de Mercado vivem no Flip Intelligence. O
Pollo CEO mostra os resultados com a fonte e o período, e leva a pessoa ao app para se
aprofundar.

```
Use o prompt-base de servidor MCP para o app "Flip Intelligence".
O app faz: análise e inteligência de negócios: indicadores e painéis da empresa, relatórios,
alertas e o Painel de Mercado (concorrentes, preços e tendências do setor).

Só leitura:
- consultar_indicador(indicador, periodo): série histórica, com fonte e data de atualização.
- alertas_ativos(): alertas atuais com gravidade.
- gerar_relatorio(tema, periodo): relatório em Markdown com as fontes citadas.
- resumo_de_mercado(setor, periodo): os pontos mais importantes do Painel de Mercado.
- comparar_concorrentes(categoria, regiao): preços e novidades dos concorrentes monitorados.
- link_do_painel(painel_id): endereço do painel no Flip Intelligence, para abrir no app.

Escrita (com aprovação):
- compartilhar_painel(painel_id, pessoa)
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

1. No Pollo OS, entre em **Apps** e adicione o conector com esse endereço.
2. Escolha se a conexão é por pessoa (OAuth) ou pela empresa (chave).
3. Em cada Bot, libere as ferramentas desse app e escolha quais pedem aprovação.
