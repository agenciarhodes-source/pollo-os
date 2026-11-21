# Pollo OS — identidade visual e Bots

## O que já foi trocado

- O nome "Pollo OS" aparece em todo texto que a pessoa vê (telas, mensagens, desktop,
  extensão, documentação, testes).
- O logo do app web e o ícone da aba do navegador são o novo símbolo
  `app/src/assets/pollo-os-logo.svg` (provisório: um "P" branco num círculo laranja).
- O nome do executável do desktop virou `PolloOS` (`desktop/src-tauri/tauri.conf.json`).

## O que ainda falta

### 1. Logo definitivo

Prompt para o gerador de imagens ou para o designer:

```
Crie o logo do "Pollo OS", um sistema onde empresas trabalham com agentes de IA. Símbolo simples
e geométrico que funcione em 16 px (ícone de aba) e em 1024 px, legível em fundo claro e escuro.
Entregue: símbolo sozinho em SVG, versão com o nome "Pollo OS" ao lado, e um PNG quadrado de
1024×1024 px com fundo transparente.
```

Depois de ter o PNG de 1024 px:
- Substitua `app/src/assets/pollo-os-logo.svg` pelo SVG final.
- Gere os ícones do desktop (substitui tudo em `desktop/src-tauri/icons/`):
  `cd desktop` e depois `bunx tauri icon caminho/do/logo-1024.png`
- Troque os ícones da extensão em `extension/public/icons/` pelos mesmos tamanhos.
- Apague `app/src/assets/openbot-logo.png`, que não é mais usado.

### 2. Cores

As cores do app são variáveis CSS (tokens) centralizadas. Elas ficam em
`app/src/theme.css` (cores padrão) e nos temas alternativos em `app/src/skins/*/skin.css`. Prompt:

```
Tenho um app React com Tailwind cujas cores vêm de variáveis CSS em app/src/theme.css
(--background, --foreground, --primary, --accent, --muted, --border etc., com versão clara e
escura). Gere um novo conjunto dessas variáveis para a marca Pollo OS, com cor principal
[#F2552C] e cor de apoio [#FFB547], mantendo contraste AA em claro e escuro.
```

### 3. Nomes e personalidade dos Bots

Os Bots que vêm de fábrica chamam-se "General Assistant", "Knowledge", "Personal Assistant" e
"Risk Analyst". Procure esses nomes no código (`git grep "General Assistant"`) e troque pelos
nomes da Pollo. Prompt para criar as personalidades:

```
Crie 4 Bots para o Pollo OS, um espaço de trabalho com agentes de IA para empresas brasileiras.
Para cada um: nome em português, uma frase de descrição, e as instruções de sistema (até 300
palavras) com tom, o que ele faz, o que ele nunca faz sem aprovação, e quais ferramentas usa.
Bots: 1) assistente geral do dia a dia; 2) especialista nos documentos da empresa, que sempre
cita a fonte; 3) vendas (usa o CRM e o ERP); 4) inteligência de mercado.
```

### 4. Textos legais

- `LICENSE`: **mantenha** o aviso de copyright que já está no arquivo (exigência da licença MIT). Acrescente abaixo o
  copyright da Pollo para o que vocês criarem.
- As telas de aceite de licença e login do desktop ainda mencionam a conta CopilotKit, porque esse
  fluxo usa o serviço deles. Troque quando o servidor próprio estiver pronto.
