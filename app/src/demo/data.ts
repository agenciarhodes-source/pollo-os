// MODO DEMONSTRAÇÃO — todos os dados abaixo são FICTÍCIOS (empresa exemplo "Horizonte Imóveis").
// Origem: protótipo Pollo CEO v3 (20/11/2026). Quando o back-end existir, este arquivo é
// substituído por chamadas à API; as telas não precisam mudar.

export type AppKey = 'os' | 'ff' | 'fi';
export type Entitlement = 'ok' | 'nao' | 'noperm';
export type CompanyKey = 'horizonte' | 'casanobre';
export type ProfileKey = 'marina' | 'bruno' | 'patricia';

export const COMPANIES: Record<CompanyKey, { n: string; s: string; in: string; c: string; empty?: boolean }> = {
  horizonte: { n: 'Horizonte Imóveis', s: 'Imobiliária · São Paulo', in: 'HI', c: '#8A5A3C' },
  casanobre: { n: 'Casa Nobre Interiores', s: 'Decoração · Campinas', in: 'CN', c: '#4E6B5A', empty: true },
};

export type Tenant = { co: CompanyKey; role: string; admin: boolean; apps: Record<AppKey, Entitlement> };
export const PROFILES: Record<ProfileKey, { n: string; in: string; mail: string; desc: string; tenants: Tenant[] }> = {
  marina: {
    n: 'Marina Andrade', in: 'MA', mail: 'marina@horizonte.exemplo',
    desc: 'Proprietária · Horizonte Imóveis · FlipForm + Flip Intelligence',
    tenants: [{ co: 'horizonte', role: 'Proprietária', admin: true, apps: { os: 'ok', ff: 'ok', fi: 'ok' } }],
  },
  bruno: {
    n: 'Bruno Lima', in: 'BL', mail: 'bruno@horizonte.exemplo',
    desc: 'Atendente · Horizonte Imóveis · só FlipForm',
    tenants: [{ co: 'horizonte', role: 'Atendente', admin: false, apps: { os: 'noperm', ff: 'ok', fi: 'noperm' } }],
  },
  patricia: {
    n: 'Patrícia Nunes', in: 'PN', mail: 'patricia@grupo-nunes.exemplo',
    desc: 'Responsável por duas empresas, com permissões diferentes',
    tenants: [
      { co: 'horizonte', role: 'Diretora comercial', admin: false, apps: { os: 'ok', ff: 'ok', fi: 'ok' } },
      { co: 'casanobre', role: 'Sócia', admin: true, apps: { os: 'ok', ff: 'ok', fi: 'nao' } },
    ],
  },
};

export const APPS: Record<AppKey, { n: string; p: string; c: string; i: string }> = {
  os: { n: 'Pollo OS', p: 'Seu segundo cérebro empresarial', c: 'var(--brand)', i: 'compass' },
  ff: { n: 'FlipForm', p: 'Operação comercial e relacionamento', c: 'var(--ff)', i: 'layers' },
  fi: { n: 'Flip Intelligence', p: 'Análise e inteligência de negócios', c: 'var(--fi)', i: 'trend' },
};
export const ENT: Record<Entitlement, [string, string]> = {
  ok: ['Disponível', 'ok'], nao: ['Não contratado', ''], noperm: ['Sem permissão', ''],
};

export type SourceKey = 'ff' | 'fi' | 'ads' | 'erp';
export const SOURCES: Record<SourceKey, { n: string; c: string; u: string; q: string; st: 'ok' | 'warn' | 'off'; per: string; lim: string }> = {
  ff: { n: 'FlipForm', c: 'var(--ff)', u: 'há 6 min', q: 'Alta', st: 'ok', per: '01–20/11/2026', lim: 'Registra leads, atendimento, visitas e negócios ganhos. Não registra pagamentos nem receita recebida.' },
  fi: { n: 'Flip Intelligence', c: 'var(--fi)', u: 'há 1 h', q: 'Alta', st: 'ok', per: '01–20/11/2026', lim: 'Calcula indicadores a partir do FlipForm e de campanhas.' },
  ads: { n: 'Meta e Google (via Flip Ads)', c: 'var(--ink-2)', u: 'há 3 h · atrasado', q: 'Média', st: 'warn', per: '01–19/11/2026', lim: 'Investimento, cliques e leads de formulário. Não medem vendas.' },
  erp: { n: 'ERP', c: 'var(--ink-3)', u: 'não conectado', q: '—', st: 'off', per: '—', lim: 'Sem conexão: não há dados de faturamento, recebimentos, comissões ou lucro.' },
};

// Indicadores do período (atual, anterior)
export const KPI = {
  per: '1 a 20 de novembro de 2026', prev: 'outubro de 2026',
  leads: [142, 120], vendas: [4, 5], conv: ['2,8%', '4,2%'], resp: [42, 27], visitas: [23, 26], propostas: [6, 7], invest: [3800, 3100],
  funil: [['Leads', 142, 120], ['Contatados', 118, 109], ['Qualificados', 51, 49], ['Visitas', 23, 26], ['Propostas', 6, 7], ['Vendas', 4, 5]] as [string, number, number][],
  weeks: ['28/09', '05/10', '12/10', '19/10', '26/10', '02/11', '09/11', '16/11'],
  leadsW: [27, 29, 26, 31, 30, 34, 37, 41],
  respW: [25, 26, 28, 27, 30, 36, 44, 46],
  origem: [['Meta', 61, 31, 7, 0], ['Google', 38, 29, 7, 1], ['Portais imobiliários', 29, 96, 4, 1], ['Indicação', 14, 22, 5, 2]] as [string, number, number, number, number][],
};

export type AgentStatus = 'run' | 'wdata' | 'wappr' | 'done' | 'fail' | 'idle';
export const ST3: Record<AgentStatus, [string, string, string]> = {
  run: ['Executando', 'var(--ff)', 'play'], wdata: ['Aguardando dados', 'var(--ink-2)', 'clock'],
  wappr: ['Aguardando aprovação', 'var(--warn)', 'flag'], done: ['Concluído', 'var(--ok)', 'check'],
  fail: ['Com falha', 'var(--err)', 'alert'], idle: ['Inativo', 'var(--ink-3)', 'pause'],
};
export const TAG: Record<string, [string, string]> = { v1: ['Prévia V1', 'brand'], hoje: ['Existe hoje', 'ok'], v2: ['Visão V2+', 'dash'] };

export type Agent = { id: string; n: string; lv: 'Estratégico' | 'Analítico' | 'Operacional'; f: string; task: string; st: AgentStatus; last: string; next: string; res: string; cost: number; tag: string; data: string[]; lim: string; hist: [string, string][] };
export const AGENTS: Agent[] = [
  { id: 'ceo', n: 'Pollo CEO', lv: 'Estratégico', f: 'Conversa executiva, síntese e propostas', task: 'Responder às perguntas da direção', st: 'run', last: 'agora', next: 'Aguardar a próxima pergunta', res: 'Resumo do dia gerado às 08:00', cost: 4.2, tag: 'v1', data: ['FlipForm', 'Flip Intelligence', 'Segundo Cérebro'], lim: 'Não executa ações. Toda proposta precisa de aprovação humana.', hist: [['08:00', 'Gerou o resumo do dia']] },
  { id: 'fi', n: 'Analista comercial', lv: 'Analítico', f: 'Indicadores e hipóteses com evidência (Flip Intelligence)', task: 'Analisar tempo de resposta', st: 'done', last: '09:14', next: 'Acompanhar o teste por 2 semanas, se aprovado', res: 'Portais: 96 min de primeira resposta; demais origens, 22 a 31 min', cost: 2.8, tag: 'v1', data: ['FlipForm · leads e horários de contato'], lim: 'Somente leitura. Não acessa ERP.', hist: [['09:14', 'Concluiu a análise de tempo de resposta por origem'], ['09:12', 'Recebeu o pedido do Pollo CEO'], ['ontem 18:00', 'Atualizou o comparativo do funil']] },
  { id: 'mkt', n: 'Analista de mídia', lv: 'Analítico', f: 'Cruza mídia paga com resultado no CRM', task: 'Atualizar dados do Google Ads', st: 'fail', last: '06:10', next: 'Nova tentativa às 12:00', res: 'Falha de sincronização no Google Ads', cost: 0.6, tag: 'v2', data: ['Meta e Google (via Flip Ads)', 'FlipForm'], lim: 'Somente leitura. Não altera campanhas.', hist: [['06:10', 'Falha ao sincronizar o Google Ads'], ['ontem 06:10', 'Atualização concluída']] },
  { id: 'erp', n: 'Leitor financeiro', lv: 'Analítico', f: 'Lê receita e recebimentos do sistema financeiro', task: 'Ler receita de novembro', st: 'wdata', last: '—', next: 'Conectar um sistema financeiro', res: '—', cost: 0, tag: 'v2', data: ['Sistema financeiro (não conectado)'], lim: 'Sem conexão, não informa nada sobre receita.', hist: [] },
  { id: 'flip', n: 'Flip · Atendimento', lv: 'Operacional', f: 'Sugere respostas no FlipForm', task: 'Sugerir respostas a leads novos', st: 'run', last: 'agora', next: 'A equipe revisa e envia', res: '38 sugestões hoje; 29 usadas pela equipe', cost: 1.9, tag: 'hoje', data: ['FlipForm · Atendimento'], lim: 'Só sugere. A equipe decide e envia.', hist: [['09:40', 'Sugeriu resposta para Camila R.'], ['09:20', 'Sugeriu horário de visita para Diego M.']] },
  { id: 'tri', n: 'Triagem de leads', lv: 'Operacional', f: 'Prioriza leads de portais', task: 'Sem tarefa: depende de uma decisão', st: 'idle', last: '—', next: 'Só começa se a D-014 for aprovada', res: '—', cost: 0, tag: 'v2', data: ['FlipForm · leads de portais'], lim: 'Nunca muda fluxos do FlipForm sem aprovação.', hist: [] },
  { id: 'agenda', n: 'Agenda de visitas', lv: 'Operacional', f: 'Sugere horários de visita', task: '—', st: 'idle', last: '—', next: 'Conectar a agenda externa', res: '—', cost: 0, tag: 'v2', data: ['Agenda externa (não conectada)'], lim: 'Inativo até a agenda ser conectada.', hist: [] },
];

export type DecisionStatus = 'Proposta' | 'Aguardando aprovação' | 'Aprovada' | 'Em execução' | 'Concluída' | 'Rejeitada';
export const DECISION_COLUMNS: DecisionStatus[] = ['Proposta', 'Aguardando aprovação', 'Aprovada', 'Em execução', 'Concluída', 'Rejeitada'];
export type Decision = { id: string; t: string; s: DecisionStatus; hip: string; ev: string; custo: string; risco: 'Baixo' | 'Médio' | 'Alto'; resp: string; prazo: string; teto: string; met: string; crit?: string; aud: [string, string, string][] };
export const initialDecisions = (): Decision[] => [
  { id: 'D-009', t: 'Novo roteiro de qualificação no WhatsApp', s: 'Concluída', hip: 'Perguntas objetivas reduzem leads sem perfil.', ev: 'Qualificados: 41% → 43% em outubro (FlipForm).', custo: 'R$ 0', risco: 'Baixo', resp: 'Carla Souza', prazo: '20/10', teto: 'R$ 0', met: '% de leads qualificados', aud: [['20/10 10:02', 'Marina Andrade', 'Aprovou'], ['04/11 17:40', 'Carla Souza', 'Marcou como concluída']] },
  { id: 'D-010', t: 'Pausar anúncio "Lançamento Jardim Sul" na Meta', s: 'Em execução', hip: 'Anúncio atrai leads fora do perfil de renda.', ev: '61 leads da Meta no mês, 0 vendas (FlipForm).', custo: 'Economia de ~R$ 600/mês', risco: 'Médio', resp: 'Equipe de marketing', prazo: '22/11', teto: '—', met: 'Custo por visita', aud: [['18/11 09:15', 'Marina Andrade', 'Aprovou'], ['18/11 11:30', 'Equipe de marketing', 'Iniciou execução manual no gerenciador da Meta']] },
  { id: 'D-011', t: 'Revisar fotos dos 10 imóveis com mais visitas', s: 'Aprovada', hip: 'Fotos melhores aumentam o pedido de visita.', ev: 'Hipótese de equipe; sem teste anterior.', custo: 'R$ 1.200 (fotógrafo)', risco: 'Baixo', resp: 'Paulo Reis', prazo: '30/11', teto: 'R$ 1.500', met: 'Pedidos de visita por anúncio', aud: [['19/11 16:20', 'Marina Andrade', 'Aprovou']] },
  { id: 'D-012', t: 'Aumentar verba da Meta para R$ 8.000/mês', s: 'Aguardando aprovação', hip: 'Mais verba traria mais vendas.', ev: 'Leads da Meta não geraram vendas no período (FlipForm).', custo: '+R$ 5.700/mês', risco: 'Alto', resp: 'Equipe de marketing', prazo: '—', teto: 'R$ 5.000', met: 'Vendas atribuídas à Meta', crit: 'Valor acima do teto de R$ 5.000 definido para aprovações. Exige dois aprovadores.', aud: [['19/11 14:05', 'Equipe de marketing', 'Criou a proposta']] },
  { id: 'D-013', t: 'Plantão de corretores aos domingos', s: 'Rejeitada', hip: 'Atendimento no domingo aumenta visitas.', ev: 'Só 6% dos leads chegam aos domingos (FlipForm).', custo: 'R$ 3.200/mês', risco: 'Médio', resp: 'Diretoria', prazo: '—', teto: 'R$ 2.000', met: 'Visitas agendadas', aud: [['12/11 10:00', 'Marina Andrade', 'Rejeitou · custo alto para volume baixo']] },
];
export const D14: Omit<Decision, 's' | 'aud'> = {
  id: 'D-014', t: 'Teste de triagem para leads de portais (2 semanas)',
  hip: 'A demora no primeiro atendimento dos portais reduz visitas. Hipótese — precisa de validação.',
  ev: 'Portais: 96 min de primeira resposta e 14% de visita; demais origens: 22–31 min (FlipForm, 01–20/11).',
  custo: 'R$ 0 em mídia · ~6 h/semana da equipe', risco: 'Baixo', resp: 'Carla Souza', prazo: '23/11 a 06/12', teto: 'R$ 0',
  met: 'Primeira resposta ≤ 15 min e taxa de visita dos portais de 14% para 25%',
};

export type Note = { id: string; t: string; cat: 'Processos' | 'Aprendizados' | 'Decisões' | 'Fontes'; sum: string; src: string; resp: string; rev: string; st: 'Validado' | 'Pendente' | 'Obsoleto'; links: string[]; body: string[] };
export const NOTES: Note[] = [
  { id: 'n1', t: 'Como qualificamos leads', cat: 'Processos', sum: 'Lead qualificado tem renda compatível, prazo de compra de até 6 meses e região de interesse definida.', src: 'qualificacao_v3.pdf', resp: 'Carla Souza', rev: '02/11/2026', st: 'Validado', links: ['n2', 'n3'], body: ['Perguntamos renda, prazo e região já no primeiro contato.', 'Sem esses três dados, o lead fica em "Contato" e não vai para "Qualificado".'] },
  { id: 'n2', t: 'Critérios para agendar visitas', cat: 'Processos', sum: 'Só agendamos visita para lead qualificado e com imóvel compatível.', src: 'Reunião de equipe · 15/10', resp: 'Carla Souza', rev: '15/10/2026', st: 'Validado', links: ['n1'], body: ['Visita exige lead qualificado e imóvel na faixa de preço informada.', 'A confirmação acontece no dia anterior, por WhatsApp.'] },
  { id: 'n3', t: 'Objeções recorrentes', cat: 'Aprendizados', sum: 'Financiamento, condomínio alto e distância do metrô são as três objeções mais comuns.', src: '40 conversas do Inbox (outubro)', resp: 'Equipe comercial', rev: '30/10/2026', st: 'Validado', links: ['n1', 'n5'], body: ['Levantamento manual feito em 40 conversas de outubro.', 'Financiamento aparece em quase metade delas.'] },
  { id: 'n4', t: 'Aprendizado: tempo de resposta', cat: 'Aprendizados', sum: 'Uma possibilidade é que a demora no primeiro contato reduza as visitas dos portais. Precisamos verificar.', src: 'Análise do Flip Intelligence · 20/11', resp: 'Pollo CEO (rascunho)', rev: '20/11/2026', st: 'Pendente', links: ['n7', 'n1'], body: ['Portais: 96 min de primeira resposta e 14% de visita.', 'Outras origens: entre 22 e 31 min.', 'É uma correlação, não uma causa comprovada.'] },
  { id: 'n5', t: 'Política de desconto', cat: 'Processos', sum: 'Descontos acima de 3% exigem aprovação da diretoria.', src: 'politica_descontos_2025.pdf', resp: 'Financeiro', rev: '10/01/2026', st: 'Obsoleto', links: ['n3'], body: ['Versão de 2025. Precisa ser revisada para 2026 antes de ser usada nas respostas.'] },
  { id: 'n7', t: 'Fonte: FlipForm (funil e atendimento)', cat: 'Fontes', sum: 'Leads, horários de contato, visitas, propostas e negócios ganhos. Atualizado às 09:42.', src: 'Integração FlipForm (demo)', resp: 'Sistema', rev: '20/11/2026', st: 'Validado', links: [], body: ['Não registra pagamentos nem receita recebida.'] },
  { id: 'n8', t: 'Fonte: sistema financeiro', cat: 'Fontes', sum: 'Não conectado. Sem dados de receita, recebimentos ou lucro.', src: '—', resp: '—', rev: '—', st: 'Pendente', links: [], body: ['Conecte seu sistema financeiro para analisar receitas.'] },
];

export const Q = {
  main: 'Por que tivemos mais leads e menos vendas?',
  resp: 'Onde o atendimento está mais lento?',
  rev: 'Quanto recebemos das vendas do mês?',
  ind: 'Por que os leads de indicação vendem mais?',
  alt: 'Quais alternativas temos ao teste de triagem?',
};

export const INTEGRATIONS: { n: string; d: string; st: 'conectado' | 'erro' | 'requer configuração' | 'disponível' | 'indisponível'; sync: string }[] = [
  { n: 'FlipForm', d: 'Leads, atendimento, funil, tarefas e agenda', st: 'conectado', sync: 'há 6 min' },
  { n: 'Flip Intelligence', d: 'Indicadores e análises', st: 'conectado', sync: 'há 1 h' },
  { n: 'Meta Ads (via Flip Ads)', d: 'Investimento, alcance e leads de formulário', st: 'conectado', sync: 'há 3 h · atrasado' },
  { n: 'Google Ads (via Flip Ads)', d: 'Investimento, cliques e conversões', st: 'erro', sync: 'falha às 06:10' },
  { n: 'Sistema financeiro / ERP', d: 'Faturamento, recebimentos e comissões', st: 'requer configuração', sync: '—' },
  { n: 'Google Agenda', d: 'Agenda de visitas e reuniões', st: 'disponível', sync: '—' },
  { n: 'Pagamentos (Pix, boleto, cartão)', d: 'Cobranças e recebimentos', st: 'indisponível', sync: '—' },
];

export const USAGE = {
  month: 'Novembro de 2026', budget: 150, spent: 61.4,
  byAgent: [['Pollo CEO', 28.6], ['Analista comercial', 17.9], ['Flip · Atendimento', 11.3], ['Analista de mídia', 3.6]] as [string, number][],
  byKind: [['Texto (entrada e saída)', 44.2], ['Transcrição de áudio', 6.1], ['Busca no Segundo Cérebro', 4.8], ['Relatórios e documentos', 6.3]] as [string, number][],
};

export const MEETINGS = [
  { t: 'Revisão comercial semanal', d: 'Sex, 21/11 · 09:00', st: 'Agendada', pauta: ['Funil de novembro', 'Teste de triagem (D-014)', 'Verba da Meta (D-012)'] },
  { t: 'Fechamento de outubro', d: 'Seg, 03/11 · 10:00', st: 'Concluída · ata aprovada', pauta: ['Resultado de outubro', 'Roteiro de qualificação (D-009)'] },
];
