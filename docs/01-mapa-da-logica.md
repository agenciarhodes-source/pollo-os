# Mapa da lógica — o que aprendemos estudando o OpenBot

Este documento resume **as ideias** por trás do OpenBot, com as nossas palavras, para servir de
inspiração ao Pollo OS. Nenhum código ou texto deles é usado no produto. O código original fica
só para consulta na pasta `_estudo-openbot/` (fora do repositório do Pollo OS).

---

## 1. A ideia central

O usuário não "usa um software": ele **tem colegas de trabalho de IA** (os Bots). Conversa com
eles, eles fazem o trabalho e **param para perguntar** antes de qualquer coisa importante.

Tudo no sistema é organizado em torno do que um Bot **tem**. São 8 peças, em 4 pares:

| Par | Peça | Pergunta que ela responde |
| --- | --- | --- |
| **Trabalha** | Conversas | Como eu passo trabalho para ele? |
| | Rotinas | Quando ele trabalha sozinho, sem eu pedir? |
| **Aprende** | Memória | O que ele sabe sobre mim e minha empresa? |
| | Habilidades | O que ele sabe fazer, passo a passo? |
| **Usa** | Apps | Quais sistemas ele consegue acessar? |
| | Computador | Onde ele navega, roda comandos e guarda arquivos? |
| **Presta contas** | Aprovações | Quando ele para e me pergunta? |
| | Atividade | O que ele fez? |

E fora das 8, um **Cofre**: onde ficam senhas e chaves. O Bot usa sem nunca ver o conteúdo.

**Lição para o Pollo OS:** ter um vocabulário pequeno e fixo. Toda funcionalidade nova tem que ser
"um tipo de" uma dessas peças. Isso evita o sistema virar um monte de telas soltas.

---

## 2. Um pedido do começo ao fim

Exemplo: *"Toda segunda, mande para o meu time os números de vendas da semana."*

1. **Conversa:** a pessoa pede no chat (texto, voz ou arquivo).
2. **Rotina:** o Bot entende "toda segunda" e cria uma rotina com 4 partes:
   - **O quê:** a instrução.
   - **Quando começa:** horário, evento (chegou e-mail, venda nova) ou agora.
   - **O que faz:** age (dentro das regras de aprovação) ou só avisa.
   - **Até quando:** até alguém parar, ou até atingir um objetivo.
3. **Memória:** o Bot lembra quem é "o time", qual é "a planilha de vendas", como a pessoa gosta
   de ver números.
4. **Habilidade:** segue um passo a passo já aprovado (colunas, ordem, tom do e-mail).
5. **App:** lê a planilha pelo app conectado, usando a conta da pessoa.
6. **Computador:** se um número só existe num site sem integração, o Bot abre um navegador próprio,
   entra com o login do cofre (sem ver a senha) e pega o dado. Se o site pedir um código no
   celular, a pessoa assume o controle, faz esse passo e devolve.
7. **Aprovação:** antes de enviar o e-mail, mostra o que vai fazer e espera o "pode".
8. **Atividade:** tudo fica registrado: o que leu, mudou, enviou, o que foi negado e quem aprovou.

---

## 3. A "portaria" das ações (a peça mais importante)

Toda ação de um Bot (clicar num site, chamar um app, mexer num arquivo) passa por um ponto único
no servidor, sempre nesta ordem:

1. **Descobre o alvo** (qual site, qual app, qual arquivo).
2. **Confere a política** (as regras da empresa).
3. **Registra** a decisão na atividade.
4. **Só então executa**, se a decisão permitir.
5. Se a execução falhar, **registra de novo**.

Não existe caminho que execute sem o registro existir antes.

Regras de política podem olhar: qual ferramenta, qual Bot, qual pessoa, qual site, qual arquivo,
e **quem iniciou** (uma pessoa digitando ou uma rotina rodando sozinha).

Princípios que valem copiar como ideia:
- **Na dúvida, nega.** Política vazia ou quebrada não permite nada.
- **Negar vem antes de permitir.**
- **Modo de teste:** registra tudo o que seria bloqueado, mas deixa passar, para calibrar as
  regras antes de ligar de verdade.
- **Ações sensíveis sempre perguntam:** enviar, compartilhar, publicar e apagar. Pagamento é
  sempre feito pela pessoa.

---

## 4. Três escopos de configuração

- **Todos os meus Bots:** o padrão da pessoa.
- **Este Bot:** o que só um Bot tem ou não pode.
- **Toda a empresa:** o que o administrador define para todo mundo (o que pode usar, quais apps,
  quais regras).

Não existe uma "nona peça" para empresas: login, pessoas e políticas são só a forma do admin
configurar as mesmas 8 peças para todos.

---

## 5. Lições de engenharia que valem ouro

**Poucas ferramentas por vez.** Um modelo de IA escolhe bem a ferramenta certa entre ~10 e mal
entre ~30. Um único app pode trazer centenas de ferramentas. Solução deles:
- Antes de responder, descobrir quais habilidades a mensagem precisa e oferecer **só as
  ferramentas dessas habilidades**.
- Acima de ~50 ferramentas, esconder o resto atrás de uma ferramenta de **busca de ferramentas**.
- Isso é só para ajudar o modelo, **não é segurança**: a permissão continua sendo checada na
  portaria.

**Bot passando trabalho para outro Bot.** Um Bot pode chamar outro, mas:
- O pedido é estruturado (tarefa, limites, como é uma boa resposta), não um parágrafo solto.
- Quem pode falar com quem é uma permissão como qualquer outra.
- O sistema (não o modelo) decide quem foi chamado, onde a resposta aparece, quem pediu e a
  profundidade máxima da cadeia, para evitar loop A → B → C → A.

**Segredos.**
- Senhas e tokens criptografados no banco, nunca devolvidos pela API, apagados dos registros.
- O Bot usa o login sem ler a senha (o sistema preenche).

**Login e pessoas.**
- Login por Google, Microsoft e SSO da empresa.
- Remover uma pessoa encerra as sessões e bloqueia o e-mail (senão o próximo login recria a conta).
- Modo "uma pessoa só, sem login" só funciona em rede local; num endereço público o sistema se
  recusa a iniciar.

**Conversas ao vivo.** A resposta do Bot chega em tempo real e, se a pessoa recarregar a página
ou abrir outra aba, vê tudo desde o começo.

---

## 6. O que eles usam que é padrão aberto (podemos usar livremente)

| Padrão | Para quê |
| --- | --- |
| **MCP** (Model Context Protocol) | Conectar apps/ferramentas aos agentes. Padrão da indústria. |
| **AG-UI** | Protocolo aberto de conversa entre interface e agente (opcional). |
| **OpenAI / Anthropic / Google** | Os modelos de IA. |
| **PostgreSQL + pgvector** | Banco de dados e busca por similaridade para memória. |
| **Playwright + Chromium** | Navegador controlado pelo Bot. |
| **OAuth 2.0 / OIDC / SAML** | Login e conexão com contas. |

---

## 7. O que o OpenBot não tem e o Pollo OS terá

- **Apps próprios da Pollo** dentro do sistema: Flipform, Flip Intelligence, Painel de
  Inteligência de Mercado e CRM de Vendas.
- **Integração nativa com ERPs brasileiros** e meios de pagamento locais (Pix, boleto).
- **Português como idioma principal** e foco em empresas brasileiras.
- **Servidor 100% nosso**, sem depender de serviço pago de terceiros para funcionar.
