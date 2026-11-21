# Pollo OS — prompt do front e do visual (com Astryx)

Prompt para o Emergent construir **toda a parte visual** do Pollo OS: telas, navegação, experiência
de uso e responsividade. O design system usado é o **Astryx**, da Meta
([github.com/meta/astryx](https://github.com/meta/astryx), licença MIT, versão 0.7, em beta).

## Por que Astryx

- **150+ componentes prontos e acessíveis** (React 19), com modo escuro e temas por variáveis CSS.
- **Modelos de tela prontos** que casam com o Pollo OS: chat com IA, menu lateral, login,
  configurações, caixa de entrada, painéis, kanban e formulários em etapas.
- **Feito para ser usado por agentes de IA**: o comando `astryx init` grava um guia no projeto
  (`AGENTS.md`) e o comando `astryx component <Nome>` mostra como usar cada componente. Assim o
  Emergent consulta a documentação em vez de chutar.
- **Funciona junto com Tailwind** e com Next.js, sem configuração extra.

Não é preciso copiar arquivos do repositório da Meta para cá: tudo entra por `npm install`, e os
modelos de tela são copiados para o projeto com o próprio comando do Astryx.

## Como usar no Emergent

1. Projeto novo, aba **Web App**, com o repositório `pollo-os` anexado (como no seu print).
2. Cole o **Prompt do front** abaixo. Ele pede telas com **dados de exemplo**: nada de banco ou IA
   ainda. Assim você vê e ajusta o visual primeiro.
3. Depois que o visual estiver aprovado, cole as Etapas 1 a 6 de
   [04-emergent-prompt.md](04-emergent-prompt.md) para ligar o banco, a IA e a cobrança. Nas
   etapas, ignore o bloco "IDENTIDADE VISUAL" e a linha do shadcn/ui: o visual já estará pronto.

**Se o Emergent não conseguir instalar ou usar o Astryx** (é beta, e o ambiente dele pode
bloquear): peça para seguir com **shadcn/ui + Tailwind**, mantendo exatamente as mesmas cores,
fontes, telas e regras deste prompt. O resultado fica muito parecido.

---

## Prompt do front

```
Construa o FRONT completo do "Pollo OS", um SaaS em que empresas conversam com agentes de IA
chamados "Bots", e os Bots executam tarefas pedindo aprovação de uma pessoa antes de qualquer
ação importante. Nesta etapa é SÓ o front: todas as telas, navegação e estados, com dados de
exemplo. Nada de banco de dados, autenticação real ou chamada de IA ainda.

O repositório anexado (pollo-os) tem a estrutura de referência. Leia antes de começar:
- docs/pollo-os/06-mapa-da-estrutura.md  → pastas, telas e rotas (siga exatamente)
- docs/pollo-os/04-emergent-prompt.md    → o que cada tela faz
Toda a interface em português do Brasil.

=== STACK ===
- Next.js 15 (App Router) + TypeScript + React 19.
- Design system: Astryx (da Meta). Instale:
    npm install @astryxdesign/core @astryxdesign/theme-stone @stylexjs/stylex
    npm install -D @astryxdesign/cli
    npm install tailwindcss @tailwindcss/postcss @heroicons/react
  e rode UMA VEZ antes de escrever telas:
    npx @astryxdesign/cli init
  Isso grava o guia do Astryx em AGENTS.md. LEIA esse guia. Antes de usar um componente, consulte
  "npx astryx component <Nome>" em vez de adivinhar props.
- Comece cada tela pelo modelo pronto do Astryx indicado mais abaixo:
    npx astryx template <modelo> <pasta-de-destino>
  e adapte o modelo ao Pollo OS. Ver a lista: npx astryx template --list --type page
- Use componentes do Astryx (Button, Card, Item, List, Table, Dialog, Drawer, SideNav, Chat,
  Markdown, EmptyState, Skeleton, Toast, Badge, StatusDot, Avatar, TabList, Selector, TextInput,
  TextArea, Switch, CommandPalette, Banner, Timestamp etc.). Tailwind só para ajustes de layout,
  usando a ponte de tokens do Astryx (tailwind-theme.css). NÃO use shadcn/ui nem outra biblioteca
  de componentes.
- Ícones: Heroicons (@heroicons/react, contorno 24px; sólidos de 20px dentro de botões
  pequenos). Um ícone por significado, sempre o mesmo em todo o app.
- Dados de exemplo em lib/mock/ (um arquivo por área: orgs, bots, conversas, aprovações,
  rotinas, habilidades, memória, conexões, times, auditoria, plano). As telas leem os dados
  através de funções em lib/data/*.ts (ex.: getBots(), getApprovals()) que hoje devolvem o mock.
  Depois essas funções passam a chamar a API, sem mexer nas telas.

=== globals.css (ordem obrigatória) ===
@layer reset, theme, base, astryx-base, astryx-theme, pollo, components, utilities;
@import '@astryxdesign/theme-stone/fonts.css';
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import '@astryxdesign/core/reset.css';
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-stone/theme.css';
@import '@astryxdesign/core/tailwind-theme.css';
@import 'tailwindcss/utilities.css' layer(utilities);
E um app/providers.tsx com <Theme theme={stoneTheme}> e <LinkProvider component={Link}> (ver o
guia do Astryx), mais a alternância claro / escuro / sistema.

=== IDENTIDADE POLLO (sobrescreve o tema Stone) ===
Crie styles/pollo-theme.css em @layer pollo, trocando só as variáveis do Astryx:

Claro:
  --color-background-body: #FAF9F6;      (página)
  --color-background-surface: #FFFFFF;   (cartões, painéis)
  --color-background-card: #FFFFFF;
  --color-background-popover: #FFFFFF;
  --color-background-muted: #F4F0E9;     (menu lateral, áreas de apoio)
  --color-text-primary: #2B201B;
  --color-text-secondary: #5F534C;
  --color-border: #E8E2D8;
  --color-border-emphasized: #D8CFC2;
  --color-accent: #CA6E23;               (cor da marca)
  --color-accent-muted: #F9EDE1;         (item selecionado)
  --color-text-accent: #94500F;
  --color-icon-accent: #CA6E23;
  --color-on-accent: #FFFFFF;
  --color-success: #2C7A57;   --color-error: #B53A30;
  --color-warning: #9C640A;   --color-info: #2F6FB8;
Escuro (dentro de :root[data-theme="dark"] e de prefers-color-scheme: dark):
  body #1C1613, surface/card #241C18, muted #2E2420, texto #F3ECE4, secundário #B3A69C,
  borda #3A2F29, accent #E08A45, accent-muted #3A2A1E, text-accent #F0A66A, on-accent #1C1613,
  success #6CC49B, error #E8857C.
Cantos: --radius-element 10px, --radius-container 14px, --radius-page 20px, --radius-chat 18px.
Sombras suaves e quentes (tom marrom, baixa opacidade), nunca cinza duro.

Tipografia: títulos em Manrope (600/700), texto em Inter (400/500), números e código em
JetBrains Mono. Carregue pelo next/font (Google). Escala: 32 / 24 / 20 / 16 / 14 / 12.
Texto do corpo 14–15px, altura de linha generosa.

Logo: quadrado de cantos arredondados com um ponto no centro, cor #CA6E23. Use o arquivo
branding/pollo-os-icon.svg do repositório anexado. Ao lado, "Pollo OS" em Manrope 700.

=== DIREÇÃO VISUAL ===
Contemporâneo, calmo e confiável — um escritório bem iluminado, não um painel de controle.
- Muito respiro: espaçamento em múltiplos de 4px, seções separadas por 32–48px.
- Superfícies em camadas: menu lateral em areia (#F4F0E9), página off-white, cartões brancos.
  Profundidade por cor e borda fina, quase sem sombra.
- A cor da marca aparece pouco: botão principal, foco, item selecionado, selo de pendência.
  Nunca em fundos grandes.
- Listas em LINHAS (ícone ou avatar, título, uma linha de descrição, metadado à direita, seta),
  não grades de cartões. Cartões só para destaques (Início) e para os cartões de aprovação.
- Telas de configuração com largura de leitura (máx. 720px). Tabelas e chat usam a largura toda.
- Movimento discreto: 150–200ms, ease-out; painéis entram deslizando; respeite
  prefers-reduced-motion.
- Cada Bot tem uma cor de avatar própria (das cores categóricas do Astryx: blue, teal, green,
  purple, pink, orange) e um emoji ou foto. É a "personalidade" visual dele em todo o app.

=== ESTRUTURA DA APLICAÇÃO (modelo: shell-side-nav) ===
Desktop (≥1024px):
- Menu lateral de 264px (SideNav), recolhível para 72px só com ícones:
  topo: logo + seletor de organização (DropdownMenu com as empresas e "Criar empresa");
  botão principal "Nova conversa" (largura total);
  Início, Bots, Rotinas, Memória, Habilidades, Conexões;
  bloco "Conversas" com as recentes (avatar do Bot + título + horário), rolagem própria;
  rodapé: Times, Admin (só admin), Configurações, e o avatar da pessoa (menu: perfil, tema, sair).
- Barra superior fina: breadcrumbs à esquerda; à direita busca (abre CommandPalette com Ctrl/⌘ K),
  selo "Precisa de você" (número de aprovações pendentes, cor da marca) e sino de notificações
  (Popover com a lista).
Tablet (768–1023px): menu recolhido em ícones; abre por cima ao tocar.
Celular (<768px): menu vira gaveta (Drawer) pelo botão ☰; barra inferior fixa (MobileNav) com
Início, Bots, Aprovações (com o número), Conversas e Mais. Botão "Nova conversa" flutuante.
Alvos de toque de no mínimo 44px. Nada de rolagem horizontal da página.

=== TELAS (com o modelo Astryx de partida) ===

1. Entrar / Criar conta / Esqueci a senha — modelo login-split.
   Esquerda: formulário (e-mail, senha, "Entrar com Google", link para criar conta).
   Direita (some no celular): fundo areia com a frase "Agentes de IA que trabalham para a sua
   empresa" e uma prévia ilustrada de um cartão de aprovação.

2. Onboarding — modelo form-wizard.
   3 passos com Stepper: (1) nome e logo da empresa; (2) criar o primeiro Bot — nome, cargo,
   avatar (emoji ou foto) e "o que ele faz", com 4 sugestões prontas em cartões selecionáveis
   (Assistente Comercial, Atendimento, Analista de Dados, Secretária Executiva); (3) "Diga oi
   para o seu Bot": abre a primeira conversa.

3. Início — modelo dashboard (simplificado).
   - Saudação ("Boa tarde, Ana") e a caixa grande "Peça algo a um Bot…" com seletor de Bot e
     sugestões em chips ("Resuma meus e-mails de hoje", "Monte a pauta da reunião").
   - "Precisa de você": até 3 cartões de aprovação pendente (resumo, Bot, há quanto tempo,
     Aprovar / Recusar direto no cartão) e "Ver todas".
   - "Conversas recentes" em linhas. "Rotinas de hoje" com horário e status (StatusDot).
   - Primeira vez (sem nada): EmptyState com o primeiro passo.

4. Bots — lista (modelo table-page, em linhas).
   Linha: avatar colorido, nome, cargo, status (Ativo / Pausado), quantas aprovações pendentes,
   última atividade. Busca e filtro (Todos / Meus / Da empresa). Botão "Novo Bot" abre um Drawer
   à direita com nome, cargo, avatar, instruções (TextArea grande com dica de exemplo) e modelo.

5. Página do Bot — cabeçalho com avatar grande, nome, cargo, StatusDot e ações (Conversar,
   Pausar, ⋯). Abas (TabList, roláveis no celular): Conversa, Configuração, Habilidades,
   Memória, Rotinas, Aplicativos, Aprovações, Atividade, Acesso.
   - Configuração: formulário em seções (modelo form-two-column) com salvar fixo no rodapé.
   - Aplicativos: lista de conexões; cada ferramenta com Switch "Pode usar" e Selector
     "Pedir aprovação: Sempre / Nunca / Só para ações que mudam algo".
   - Atividade: linha do tempo (data, ícone da ação, frase legível).

6. Conversa — modelo ai-chat (com messaging-shell para grupos e canais).
   - Mensagens com Markdown, blocos de código com copiar, anexos (imagem em miniatura, PDF como
     cartão). Mensagens do Bot com o avatar colorido dele; da pessoa, alinhadas à direita em
     superfície muted.
   - Uso de ferramenta: linha recolhível discreta ("🔍 Consultou a agenda · 2 eventos"), abre os
     detalhes.
   - CARTÃO DE APROVAÇÃO (o componente mais importante do app): borda na cor da marca, ícone de
     escudo, título "Ana quer enviar um e-mail", detalhes em lista legível (Para, Assunto,
     prévia do texto — nunca JSON), botões "Aprovar" (principal), "Recusar" (secundário) e
     "Sempre permitir para Ana" (link). Estados: pendente, aprovado (verde, "Aprovado por você
     às 14:32"), recusado, expirado.
   - Caixa de texto fixa embaixo: anexar, mencionar (@Bot em grupos), enviar; Shift+Enter quebra
     linha; botão "Parar" enquanto o Bot escreve; indicador "Ana está escrevendo…".
   - Painel lateral redimensionável (Resizable) para ver um arquivo ou resultado gerado; no
     celular vira BottomSheet.

7. Aprovações — modelo table-inbox.
   Abas Pendentes / Decididas / Regras. Lista à esquerda (Bot, resumo, tempo), detalhe à direita
   com o mesmo cartão de aprovação e o link "Abrir na conversa". Seleção múltipla para aprovar ou
   recusar várias. No celular, lista e detalhe em telas separadas.

8. Rotinas — lista + criar (modelo form-wizard-dialog).
   Criar: escolher Bot → o que fazer → quando. "Quando" com opções em linguagem natural
   ("Todo dia às 8h", "Toda segunda às 9h", "A cada hora") e "Avançado" com cron. Detalhe com
   histórico de execuções (tabela com status e duração) e "Rodar agora". Aba Metas em quadro
   kanban (modelo kanban-board): A fazer / Em andamento / Concluída.

9. Habilidades — lista em linhas + editor (modelo editor).
   Editor de Markdown com pré-visualização lado a lado (empilhado no celular), e a lista de
   Bots que usam aquela habilidade.

10. Memória — modelo table-filter.
    Busca, filtro por Bot e por pessoa, cada memória como linha com texto, origem e data;
    editar em Dialog; apagar com AlertDialog.

11. Conexões — catálogo (modelo classic-gallery, em grade só aqui).
    Cartões com logo, nome, uma frase e botão "Conectar"; Gmail, Google Agenda, Google Drive,
    Slack, WhatsApp, Notion, HubSpot, "Servidor MCP personalizado"; os ainda não disponíveis com
    o selo "Em breve". Página da conexão: status, conta ligada, ferramentas, quais Bots usam.

12. Times e Pessoas — listas em linhas, convidar por e-mail em Dialog, papéis com Selector.

13. Admin — modelo settings-sidebar (menu próprio à esquerda):
    Visão geral (modelo dashboard-scorecard: pessoas, Bots, conversas, tokens do mês, gráfico
    simples de uso), Pessoas, Modelos de IA, Aprovações (regras), Limites, Auditoria (modelo
    table-filter, com detalhe antes/depois e "Exportar CSV"), Empresa, Plano.
    Plano: plano atual em destaque, barras de uso (ProgressBar) de Bots, pessoas e mensagens,
    comparação de planos e faturas.

14. Configurações pessoais — modelo settings-sidebar:
    Perfil, Notificações (Switch por tipo), Aparência (claro / escuro / sistema com prévia),
    Cofre, Chaves de API (mostrar uma vez, copiar, revogar), Atividade.

15. Site público de vendas — modelo centered-hero + gallery-hero.
    Hero "Agentes de IA que trabalham para a sua empresa" com print do app, "Como funciona" em 3
    passos (Crie seu Bot → Conecte seus apps → Aprove o que importa), benefícios, planos
    (Essencial R$ 197, Profissional R$ 497, Empresa sob consulta), perguntas frequentes
    (Collapsible) e rodapé. Também /precos, /termos e /privacidade.

=== ESTADOS EM TODA TELA ===
- Carregando: Skeleton no formato do conteúdo (nunca só um spinner no meio da tela).
- Vazio: EmptyState com ilustração leve, uma frase útil e o botão da ação certa
  ("Você ainda não tem rotinas. Que tal um resumo diário às 8h?" → "Criar rotina").
- Erro: Banner com o que aconteceu e o que fazer, e "Tentar de novo".
- Sucesso de ação: Toast curto ("Aprovado. A Ana já está enviando.").
- Limite do plano: Banner na cor da marca com "Ver planos".
- Ações destrutivas sempre com AlertDialog dizendo o que vai ser apagado.

=== TEXTO (microcopy) ===
- Português do Brasil, direto e caloroso, sem jargão técnico: "Bot", "aprovação", "rotina",
  "habilidade", "conexão". Nunca "agent", "prompt", "token" ou "workflow" na tela.
- Botões com verbo: "Criar Bot", "Aprovar", "Conectar Gmail". Nada de "OK" ou "Enviar" solto.
- Datas relativas ("há 5 min", "ontem às 14:32") com Timestamp; formato brasileiro.

=== ACESSIBILIDADE ===
Contraste AA nos dois temas, foco visível na cor da marca, navegação completa por teclado,
rótulos em todos os botões de ícone, atalhos: Ctrl/⌘ K (busca), Ctrl/⌘ Enter (enviar),
A / R para aprovar / recusar na tela de Aprovações.

=== DADOS DE EXEMPLO ===
Empresa "Padaria Pollo" (slug padaria-pollo), pessoa logada "Ana Souza" (admin).
Bots: "Léo — Assistente Comercial" (laranja, 🧑‍💼), "Bia — Atendimento" (teal, 💬),
"Rafa — Analista de Dados" (azul, 📊), "Duda — Secretária Executiva" (roxo, 📅).
3 aprovações pendentes realistas (enviar e-mail de proposta, criar evento na agenda, publicar
post), 8 conversas, 5 rotinas, 6 habilidades, 20 memórias, 4 conexões (2 ativas), 2 times,
30 eventos de auditoria. Tudo em português e com nomes brasileiros.

=== ENTREGA ===
- Todas as rotas do mapa (docs/pollo-os/06-mapa-da-estrutura.md, seção 2) navegáveis.
- Tema claro e escuro funcionando em todas as telas.
- Testado em 375px, 768px e 1440px de largura.
- README em português com como rodar e a lista de telas.
```

---

## Mapa: tela do Pollo OS → modelo do Astryx

| Tela | Modelo para começar | Componentes-chave |
| --- | --- | --- |
| Estrutura (menu + topo) | `shell-side-nav` | AppShell, SideNav, NavItem, MobileNav, CommandPalette |
| Entrar / criar conta | `login-split` | TextInput, Button, Divider |
| Onboarding | `form-wizard` | Stepper, SelectableCard, FileInput |
| Início | `dashboard` | Card, Item, StatusDot, Token |
| Bots | `table-page` | Table/List, Avatar, Badge, Drawer |
| Conversa | `ai-chat`, `messaging-shell` | Chat, Markdown, CodeBlock, Collapsible, Resizable |
| Aprovações | `table-inbox` | List, Card, ButtonGroup, TabList |
| Rotinas / Metas | `form-wizard-dialog`, `kanban-board` | Dialog, Selector, TimeInput, Table |
| Habilidades | `editor` | TextArea, Markdown, Resizable |
| Memória / Auditoria | `table-filter` | Table, PowerSearch, Dialog, AlertDialog |
| Conexões | `classic-gallery` | ClickableCard, Badge, Switch |
| Admin / Configurações | `settings-sidebar` | SideNav, FormLayout, Switch, Selector |
| Visão geral do Admin | `dashboard-scorecard` | Card, ProgressBar, MetadataList |
| Site de vendas | `centered-hero`, `gallery-hero` | Heading, Button, Collapsible |

Todos os modelos estão em `packages/cli/assets/templates/pages/` no repositório do Astryx e
podem ser vistos funcionando em [astryx.atmeta.com](https://astryx.atmeta.com).
