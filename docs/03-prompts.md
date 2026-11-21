# Pollo OS — prompts para o app de criação

Prompts para construir o Pollo OS do zero, sem depender de nenhum código de terceiros. Cole na
ordem, **no mesmo projeto**, um por vez. Só passe para o próximo quando o anterior estiver
funcionando.

Se o seu app de criação já define a tecnologia (por exemplo, React + Supabase), mantenha a dele e
apague a linha "Tecnologia" do prompt 0.

---

## Fase 1 — MVP

### 0. Base do projeto

```
Crie o "Pollo OS", um espaço de trabalho onde empresas brasileiras conversam com agentes de IA
(chamados Bots) que executam tarefas nos sistemas da empresa e pedem aprovação antes de ações
importantes. Todo o texto da interface em português do Brasil.

Tecnologia: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, PostgreSQL com Drizzle ORM.

Estrutura de navegação (barra lateral, nesta ordem):
Conversas · Rotinas · Memória · Habilidades · Apps · Aprovações · Atividade · Configurações.
Itens ainda não construídos mostram "Em breve".

Conceitos do banco (crie as tabelas agora):
- empresas (multi-empresa: todo dado pertence a uma empresa)
- pessoas (nome, e-mail, papel: admin ou membro, empresa)
- bots (nome, descrição, instruções, modelo, ativo)
- conversas e mensagens
- atividade (quem, qual Bot, ação, alvo, decisão, resultado, data)

Visual: limpo, moderno, modo claro e escuro, cor principal #F2552C. Crie também uma página de
login simples (e-mail e senha) e proteja todas as outras páginas.
```

### 1. Login, empresa e pessoas

```
No Pollo OS, complete login e administração:
- Cadastro cria a empresa e a primeira pessoa como admin.
- Admin convida pessoas por e-mail (link com validade de 7 dias), muda papel e remove.
- Remover uma pessoa encerra todas as sessões dela e bloqueia o e-mail de entrar de novo.
- Login com Google e Microsoft (OAuth), além de e-mail e senha.
- Toda mudança de pessoa ou papel grava uma linha na tabela de atividade.
```

### 2. Modelos de IA

```
No Pollo OS, em Configurações → Inteligência Artificial, permita conectar modelos:
OpenAI, Anthropic (Claude), Google (Gemini) e qualquer endpoint compatível com a API da OpenAI.
- A chave é guardada criptografada (AES-256-GCM, chave mestra em variável de ambiente) e nunca
  aparece de novo na tela nem nas respostas da API.
- Ao salvar, testa a chave com uma chamada pequena e mostra o erro numa frase clara se falhar.
- Cada Bot escolhe um modelo; a empresa tem um modelo padrão.
```

### 3. Bots e conversas

```
No Pollo OS, construa Bots e Conversas:

Bots:
- Página de Bots com lista e botão "Novo Bot".
- Um Bot tem: nome, foto/ícone, descrição, instruções (o que ele faz, tom, o que nunca faz),
  modelo e apps liberados.
- Crie 4 Bots de fábrica: "Assistente Pollo" (dia a dia), "Vendas", "Mercado" e "Financeiro",
  com instruções em português.

Conversas:
- Chat com resposta da IA chegando ao vivo (streaming), com Markdown, tabelas e blocos de código.
- Escolher com qual Bot falar; mencionar outro Bot com @ para chamá-lo na mesma conversa.
- Anexar arquivos (PDF, imagem, planilha) que o Bot consegue ler.
- Histórico na barra lateral, com busca. Recarregar a página mantém a conversa inteira.
- Use o pacote "ai" (Vercel AI SDK) para chamar o modelo com streaming e ferramentas.
```

### 4. Apps via MCP

```
No Pollo OS, construa a página Apps:
- Um app é um servidor MCP (Model Context Protocol). O admin adiciona pelo endereço (HTTP
  streamable), e o sistema lista as ferramentas que ele oferece.
- Conexão por OAuth 2.0 (cada pessoa conecta a própria conta) ou por chave de API da empresa.
  Tokens criptografados e renovados automaticamente.
- Em cada Bot, o admin marca quais apps e quais ferramentas ele pode usar.
- Na conversa, o Bot chama as ferramentas liberadas e mostra um cartão "Usando: <ferramenta>"
  com o resultado.
- Se um Bot tiver mais de 20 ferramentas, antes de cada resposta escolha só as relevantes para a
  mensagem; acima de 50, ofereça uma ferramenta "buscar_ferramentas" no lugar das demais.
Use o SDK oficial @modelcontextprotocol/sdk.
```

### 5. Portaria, Aprovações e Atividade

```
No Pollo OS, toda ferramenta que um Bot chama deve passar por uma "portaria" no servidor, sempre
nesta ordem: (1) identificar o alvo, (2) avaliar a política, (3) gravar a decisão na atividade,
(4) só então executar, (5) se falhar, gravar de novo. Nenhum caminho executa sem registro.

Políticas (Configurações → Aprovações):
- Por ferramenta: permitir, negar ou pedir aprovação. Negar tem prioridade sobre permitir.
- Ferramentas marcadas como destrutivas (enviar, apagar, publicar, pagar) pedem aprovação por
  padrão. Pagamento nunca é automático.
- Política vazia ou com erro bloqueia tudo.
- Modo de teste: registra o que seria bloqueado, mas deixa passar.
- A regra pode diferenciar "pedido por uma pessoa" de "rodando numa rotina".

Aprovações:
- Quando precisa de aprovação, o Bot mostra na conversa um cartão com o que vai fazer e os botões
  Aprovar / Recusar. A página Aprovações lista as pendentes. Notifica por e-mail.

Atividade:
- Lista de tudo que os Bots fizeram, permitido, negado ou com erro, com filtros por pessoa, Bot,
  app e data, e exportação em CSV. Segredos nunca aparecem nos registros.
```

---

## Fase 2 — Bots que trabalham sozinhos

### 6. Rotinas

```
No Pollo OS, construa Rotinas. Cada rotina tem 4 partes:
- O quê: a instrução em português.
- Quando começa: horário (diário, semanal, mensal, mínimo a cada 15 min) ou evento vindo de um
  app (ex.: novo pedido no ERP, novo lead no CRM) via webhook.
- O que faz: "age" (dentro das aprovações) ou "só me avisa".
- Até quando: até eu parar, ou até atingir um objetivo (mostra o progresso).
A pessoa cria pela página ou pedindo na conversa ("toda segunda às 9h, mande…").
A rotina roda como a pessoa que criou e responde na conversa em que foi pedida.
Máximo de 20 rotinas ativas por pessoa. 10 falhas seguidas pausam a rotina e avisam a pessoa.
Use uma fila de tarefas persistente (ex.: pg-boss no próprio PostgreSQL).
```

### 7. Memória

```
No Pollo OS, construa Memória:
- Fatos que a empresa e as pessoas ensinam ("nosso cliente principal é…") valem para todos os
  Bots; fatos que um Bot descobre trabalhando ficam só com ele.
- Busca por similaridade com pgvector e embeddings do provedor configurado; sem embeddings, busca
  por palavras-chave.
- Antes de responder, o Bot busca as memórias relevantes.
- A pessoa vê, edita e apaga o que cada Bot lembra.
```

### 8. Habilidades

```
No Pollo OS, construa Habilidades: um passo a passo com nome, chamado na conversa com "/"
(ex.: /relatorio-semanal).
- Uma habilidade tem: nome, quando usar, passos em Markdown e as ferramentas que precisa.
- Três formas de criar: escrever; pedir na conversa ("transforme o que fizemos numa habilidade");
  ou o sistema sugerir a partir de conversas repetidas (o admin revisa antes de publicar).
- Uma habilidade nunca libera ferramentas que o Bot não tem permissão de usar.
```

### 9. Cofre

```
No Pollo OS, crie o Cofre (Configurações → Cofre): senhas de sites e chaves de API da pessoa e da
empresa. Tudo criptografado. O Bot pede um item pelo nome e o sistema o usa por ele; o valor
nunca vai para a conversa, para a memória nem para a atividade. Uma tela única para ver, trocar
e apagar segredos.
```

---

## Apps da Pollo

### Modelo para qualquer app virar ferramenta dos Bots

Complete os `[colchetes]` com o que cada app faz.

```
Crie um servidor MCP em TypeScript para o app "[NOME]", com o SDK @modelcontextprotocol/sdk e
transporte HTTP streamable na rota /mcp.
O app faz: [2 ou 3 frases].
Ferramentas (descrição clara + parâmetros em JSON Schema):
- [ferramenta 1: o que faz, parâmetros, o que devolve]
- [ferramenta 2]
Regras: autenticação OAuth 2.0 ou chave no cabeçalho Authorization: Bearer; respostas em JSON
curto; ferramentas que alteram dados com "destructiveHint": true; erros numa frase clara;
testes e Dockerfile.
```

### Flipform

```
Use o modelo de servidor MCP para "Flipform".
O app faz: [ex.: cria formulários e coleta respostas].
Ferramentas: listar_formularios; criar_formulario(titulo, perguntas) — destrutiva, devolve o link;
respostas_do_formulario(id, periodo); resumo_do_formulario(id).
```

### Flip Intelligence

```
Use o modelo de servidor MCP para "Flip Intelligence".
O app faz: [descreva].
Ferramentas: [ex.: consultar_indicadores(indicador, periodo); gerar_relatorio(tema);
alertas_ativos()].
```

### Inteligência de Mercado

```
Crie o painel "Inteligência de Mercado" dentro do Pollo OS (nova página no menu Apps) e um
servidor MCP com os mesmos dados para os Bots.
Painel: concorrentes monitorados (preço, produtos, novidades), tendências do setor [setor],
indicadores (faixa de preço, sazonalidade), filtros por região/período/categoria, exportar PDF e
planilha. Fontes: [ex.: Google Trends, sites de concorrentes, APIs de notícias].
Ferramentas MCP: comparar_concorrentes(categoria, regiao); tendencias(setor, periodo);
resumo_de_mercado(setor).
```

### CRM de Vendas + ERP

```
Crie o "CRM de Vendas" dentro do Pollo OS e um servidor MCP para os Bots.
CRM: funil em colunas (lead, contato, proposta, negociação, ganho, perdido) com arrastar e soltar;
ficha do cliente com contatos, histórico de compras (do ERP), propostas, tarefas e notas; metas por
vendedor, previsão de vendas e ticket médio.
ERP: camada de conectores com interface comum (clientes, produtos, pedidos, notas fiscais,
estoque, contas a receber). Primeiros conectores: [ex.: Bling, Tiny, Omie]. Sincronização a cada
15 min e por webhook quando o ERP oferecer.
Ferramentas MCP: buscar_cliente; historico_de_compras; criar_oportunidade (destrutiva);
mover_oportunidade (destrutiva); previsao_de_vendas; estoque_do_produto.
```

### Agenda

```
Crie um servidor MCP "Agenda" para o Pollo OS com Google Agenda e Microsoft Outlook via OAuth.
Ferramentas: listar_eventos; horarios_livres(participantes, duracao, periodo);
criar_evento (destrutiva); remarcar_evento (destrutiva); cancelar_evento (destrutiva).
```

### Pagamentos

```
Crie um servidor MCP "Pagamentos" para o Pollo OS com conectores [ex.: Mercado Pago, Asaas,
Stripe], usando a chave da empresa.
Ferramentas: consultar_recebimentos; cobrancas_em_aberto; status_do_pagamento;
gerar_cobranca(cliente, valor, vencimento, forma: pix | boleto | cartao) — destrutiva e sempre
com aprovação humana. Estorno e transferência nunca sem aprovação registrada.
```

---

## Fase 3 — Escala

### 10. Computador do Bot

```
No Pollo OS, dê a cada Bot um computador: um contêiner com Chromium (Playwright), pasta de
arquivos e perfil de navegador que persistem entre tarefas.
- O Bot navega, clica, preenche e baixa arquivos; cada ação passa pela portaria.
- A pessoa vê a tela ao vivo e pode "assumir o controle" (ex.: digitar um código do celular) e
  devolver.
- Logins vêm do Cofre e são preenchidos pelo sistema, sem o Bot ver a senha.
- Bloquear endereços internos da nuvem e da rede local.
```

### 11. Equipes e empresas maiores

```
No Pollo OS, adicione: equipes dentro da empresa (cada uma com seus Bots, apps e regras); login
SSO da empresa (SAML e OpenID Connect) por domínio de e-mail; provisionamento automático de
pessoas (SCIM 2.0); um escopo "toda a empresa" em que o admin define o que pessoas e Bots podem
usar.
```

### 12. WhatsApp como canal

```
No Pollo OS, permita conversar com os Bots pelo WhatsApp (API oficial do WhatsApp Business):
cada número de WhatsApp é ligado a uma pessoa cadastrada; aprovações chegam como mensagem com
botões Aprovar / Recusar; áudios são transcritos.
```

---

## Identidade

### Logo

```
Crie o logo do "Pollo OS", um sistema onde empresas trabalham com agentes de IA. Símbolo simples
e geométrico, legível em 16 px e em 1024 px, em fundo claro e escuro. Entregue: símbolo em SVG,
versão com o nome ao lado, e PNG 1024×1024 com fundo transparente.
```

### Cores

```
Gere a paleta do Pollo OS como variáveis CSS para Tailwind/shadcn (background, foreground,
primary, secondary, accent, muted, border, destructive), em versões clara e escura, com cor
principal [#F2552C] e apoio [#FFB547], contraste AA.
```

### Personalidade dos Bots

```
Escreva as instruções de sistema (até 300 palavras cada) para os Bots de fábrica do Pollo OS:
Assistente Pollo, Vendas, Mercado e Financeiro. Para cada um: tom (português do Brasil, direto e
cordial), o que faz, quais apps usa, o que nunca faz sem aprovação, e como responde quando não
sabe.
```
