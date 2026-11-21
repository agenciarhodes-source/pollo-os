'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { DecChip, Empty, Ep, SrcChip } from '@/components/ui';
import { KPI, PROFILES, Q, type SourceKey } from '@/demo/data';
import { useCompany, useSession } from '@/demo/session';

type Kind = 'main' | 'investigate' | 'conflict' | 'alt' | 'ind' | 'generic';
type Msg = { id: number; role: 'u' | 'a'; text: string; kind?: Kind };

// Respostas ROTEIRIZADAS do modo demonstração. Não há modelo de IA por trás.
function classify(t: string): Kind {
  const s = t.toLowerCase();
  if (/alternativ/.test(s)) return 'alt';
  if (/indica/.test(s)) return 'ind';
  if (/receb|fatur|receita|lucro|comiss/.test(s)) return 'conflict';
  if (/lent|demor|resposta|origem|canal|portal|atendimento/.test(s)) return 'investigate';
  if (/lead|contrat|venda|convers/.test(s)) return 'main';
  return 'generic';
}

export default function CeoPage() {
  const s = useSession();
  const c = useCompany();
  const [chat, setChat] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [legend, setLegend] = useState(false);
  const [why, setWhy] = useState<Record<number, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    const id = Date.now();
    setChat((m) => [...m, { id, role: 'u', text: t }]);
    setDraft('');
    setBriefOpen(false);
    setThinking(true);
    setTimeout(() => {
      setChat((m) => [...m, { id: id + 1, role: 'a', text: t, kind: classify(t) }]);
      setThinking(false);
    }, 900);
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat, thinking]);
  // "Perguntar ao Pollo CEO" vindo de outra tela chega como ?q=...
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) { asked.current = true; window.history.replaceState(null, '', '/ceo'); ask(q); }
  });
  if (!c || !s.profile) return null;

  const first = PROFILES[s.profile].n.split(' ')[0];
  const isAdmin = !!s.tenant()?.admin;
  const d14 = s.decisions.find((d) => d.id === 'D-014');

  const hello = (
    <div className="ceo-id">
      <span className="ceo-av">PC</span>
      <div>
        <h2>Olá, {first}. Vamos olhar o que importa hoje?</h2>
        <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
          Pollo CEO · {c.n} · 1 a 20/11 · <span className="ill" style={{ padding: '0 7px' }}>Dados demonstrativos</span>
        </div>
      </div>
    </div>
  );

  if (c.empty) {
    return (
      <div className="ceo">
        {hello}
        <Empty icon="building" title="Ainda não temos dados suficientes para concluir"
          text={`O Pollo CEO da ${c.n} começa a responder quando as fontes desta empresa estiverem conectadas. Nada da Horizonte Imóveis aparece aqui.`}
          action={<Link className="btn line" href="/integracoes"><Icon name="plug" size="sm" />Ver integrações</Link>} />
      </div>
    );
  }

  const recMain = (
    <div className="rec">
      <Ep k="rec" />
      <b>Testar triagem em metade dos leads de portais por duas semanas</b>
      <span className="muted" style={{ fontSize: 12.5 }}>Medir primeira resposta, visitas e propostas antes de mudar qualquer fluxo.</span>
      <div className="row wrap">
        <Link className="btn line xs" href="/visao-analitica"><Icon name="eye" size="xs" />Ver evidências</Link>
        {!d14 ? (
          <button className="btn primary xs" onClick={() => s.proposeD14()}><Icon name="flag" size="xs" />Criar proposta</button>
        ) : (
          <>
            <DecChip s={d14.s} />
            {d14.s === 'Aguardando aprovação' && (isAdmin
              ? <Link className="btn ok xs" href="/decisoes"><Icon name="check" size="xs" />Revisar e aprovar</Link>
              : <span className="chip"><Icon name="lock" size="xs" />Aprovação: só a proprietária</span>)}
            {d14.s !== 'Aguardando aprovação' && <Link className="btn line xs" href="/decisoes">Acompanhar decisão</Link>}
          </>
        )}
        <button className="btn ghost xs" onClick={() => ask(Q.alt)}>Discutir alternativa</button>
      </div>
    </div>
  );

  const A: Record<Kind, { t: string; src: SourceKey[]; c: React.ReactNode; w?: React.ReactNode; r?: React.ReactNode; ev?: string }> = {
    main: {
      t: 'Mais leads, menos vendas', src: ['ff', 'erp'],
      c: <><div className="badges"><Ep k="fato" /></div><div>Os leads cresceram 18% (120 → 142), mas as vendas não acompanharam: 4 vendas e conversão de 2,8%, contra 4,2% em outubro.</div><div className="badges"><Ep k="hip" /></div><div>Uma possibilidade é que a demora no primeiro atendimento esteja contribuindo. Precisamos verificar.</div></>,
      w: <ul><li><Ep k="fato" /> Primeira resposta subiu de 27 para 42 min.</li><li><Ep k="fato" /> Visitas caíram de 26 para 23 e propostas de 7 para 6.</li><li><Ep k="fato" /> Investimento em mídia subiu de R$ 3.100 para R$ 3.800.</li><li>A demora e a queda de visitas aconteceram juntas. Isso é correlação, não prova de causa.</li><li>O mês ainda não terminou e o ciclo de venda médio é de 38 dias.</li></ul>,
      r: recMain, ev: '7 fatos · 2 fontes',
    },
    investigate: {
      t: 'Tempo de resposta por origem', src: ['ff'],
      c: <><div className="badges"><Ep k="fato" /></div><div>Leads de portais esperam 96 min pelo primeiro contato e só 14% viram visita. Nas outras origens, a resposta leva de 22 a 31 min.</div><div className="badges"><Ep k="hip" /></div><div>Na Meta a resposta é rápida e mesmo assim não houve venda. A demora pode explicar os portais, mas não a Meta.</div></>,
      w: <><ul>{KPI.origem.map(([n, l, r, v, sv]) => <li key={n}><b>{n}:</b> {l} leads · {r} min · {v} visitas · {sv} vendas</li>)}</ul><span className="faint" style={{ fontSize: 12 }}>Análise do agente &quot;Analista comercial&quot; às 09:14 (demonstrativo).</span></>,
      r: recMain, ev: '4 origens · FlipForm',
    },
    conflict: {
      t: 'Receita das vendas do mês', src: ['ff', 'erp'],
      c: <><div className="badges"><Ep k="fato" /></div><div>O FlipForm mostra 4 negócios ganhos.</div><div className="blocked"><Icon name="lock" size="sm" /><span><b>Não posso concluir quanto foi recebido.</b> O sistema financeiro não está conectado, então não tenho faturamento, recebimentos ou lucro.</span></div></>,
      w: <ul><li>Contrato firmado não é dinheiro recebido.</li><li>Conecte seu sistema financeiro para analisar receitas.</li></ul>,
      r: <div className="rec"><Ep k="rec" /><b>Conectar o sistema financeiro</b><div className="row wrap"><Link className="btn line xs" href="/integracoes"><Icon name="plug" size="xs" />Ver integrações</Link></div></div>,
      ev: 'FlipForm · ERP sem conexão',
    },
    alt: {
      t: 'Alternativas ao teste', src: ['ff'],
      c: <div>Existem duas outras opções, mas o teste continua sendo o caminho mais barato e reversível.</div>,
      w: <ul><li><b>Plantão só para portais:</b> resolve rápido, mas custa cerca de R$ 2.400/mês sem evidência de retorno.</li><li><b>Reduzir a verba da Meta:</b> é outra decisão; a D-010 já está em execução.</li></ul>,
      r: recMain, ev: 'FlipForm · decisões anteriores',
    },
    ind: {
      t: 'Leads de indicação', src: ['ff'],
      c: <><div className="badges"><Ep k="fato" /></div><div>14 leads de indicação geraram 2 das 4 vendas, com a resposta mais rápida (22 min).</div><div><Ep k="hip" /> Ainda não temos dados suficientes para concluir: o volume é pequeno.</div></>,
      w: <ul><li>Clientes indicados chegam com confiança prévia.</li><li>Vale acompanhar por mais um mês antes de criar um programa de indicação.</li></ul>,
      r: <div className="rec"><Ep k="rec" /><b>Acompanhar indicação por mais 30 dias</b></div>, ev: 'FlipForm · 14 leads',
    },
    generic: {
      t: 'Resposta', src: [],
      c: <div>Nesta demonstração, eu respondo a perguntas roteirizadas sobre a Horizonte Imóveis. Pergunte sobre leads e vendas, tempo de resposta, indicação ou receita.</div>,
      r: <div className="qs">{[Q.main, Q.resp, Q.rev].map((q) => <button key={q} className="q" onClick={() => ask(q)}>{q}</button>)}</div>,
    },
  };

  const brief: [string, string, string, string, string | null][] = [
    ['Oportunidade', 'var(--ok)', 'Indicação: 14 leads geraram 2 das 4 vendas.', 'FlipForm · 01–20/11', Q.ind],
    ['Atenção', 'var(--warn)', 'Leads cresceram, mas a conversão merece atenção.', 'FlipForm · 2,8% contra 4,2%', Q.main],
    ['Decisão', 'var(--brand)', d14 ? `D-014 · ${d14.s.toLowerCase()}` : 'Ainda não há proposta para o tempo de resposta.', d14 ? 'Decisões & Aprovações' : 'Pollo CEO', d14 ? null : Q.resp],
  ];

  return (
    <div className="ceo">
      {hello}
      <section className="brief3" aria-label="Resumo do dia">
        <button className="brief3-h" onClick={() => setBriefOpen((v) => !v)} aria-expanded={briefOpen}>
          <Icon name="flag" size="sm" />Resumo do dia<span className="faint" style={{ fontWeight: 500, fontSize: 12 }}>· 3 prioridades</span><Icon name="chev" size="sm" />
        </button>
        {briefOpen && brief.map(([k, col, t, src, q]) => {
          const inner = (
            <>
              <span className="k" style={{ color: col }}><i style={{ background: col }} />{k}</span>
              <span><span className="t">{t}</span><span className="s">{src}</span></span>
              <span className="go">{q ? 'Discutir' : 'Abrir'} <Icon name="chevr" size="xs" /></span>
            </>
          );
          return q
            ? <button key={k} className="b3" onClick={() => ask(q)}>{inner}</button>
            : <Link key={k} className="b3" href="/decisoes" style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>;
        })}
      </section>

      <div className="row wrap between">
        <button className="legend-btn" onClick={() => setLegend((v) => !v)} aria-expanded={legend}><Icon name="info" size="xs" />Como ler as respostas</button>
        {legend && <div className="legend"><Ep k="fato" /><Ep k="hip" /><Ep k="rec" /><Ep k="prop" /><Ep k="dec" label="Aprovação" /><Ep k="exe" /></div>}
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {chat.length === 0 && !thinking ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <span className="lbl">Perguntas sugeridas</span>
            <div className="qs">{[Q.main, Q.resp, Q.rev].map((q) => <button key={q} className="q" onClick={() => ask(q)}>{q}</button>)}</div>
          </div>
        ) : chat.map((m) => m.role === 'u' ? (
          <div key={m.id} className="m-u fade">{m.text}</div>
        ) : (
          <div key={m.id} className="m-a fade">
            <span className="ceo-av">PC</span>
            <div className="ans">
              <div className="ans-top">
                <b>{A[m.kind!].t}</b><span className="faint" style={{ fontSize: 12 }}>01–20/11</span><span style={{ flex: 1 }} />
                {A[m.kind!].src.map((k) => <SrcChip key={k} k={k} />)}
              </div>
              <div className="concl"><span className="lbl">Conclusão</span>{A[m.kind!].c}</div>
              {A[m.kind!].w && (
                <>
                  <button className="evi-btn" onClick={() => setWhy((w) => ({ ...w, [m.id]: !w[m.id] }))} aria-expanded={!!why[m.id]}>
                    <Icon name="chev" size="sm" />Por quê
                  </button>
                  {why[m.id] && <div className="why-b fade">{A[m.kind!].w}</div>}
                </>
              )}
              {A[m.kind!].ev && (
                <Link className="evi-btn" href="/visao-analitica" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Icon name="eye" size="sm" />Evidências<span className="faint" style={{ fontWeight: 500 }}>· {A[m.kind!].ev}</span>
                  <span style={{ marginLeft: 'auto' }}><Icon name="chevr" size="xs" /></span>
                </Link>
              )}
              {A[m.kind!].r && <div className="recs"><span className="lbl">O que fazer</span>{A[m.kind!].r}</div>}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="m-a">
            <span className="ceo-av">PC</span>
            <div className="ans"><div className="ans-top"><b>Consultando fontes demonstrativas…</b></div><div className="thinking"><div className="sk" style={{ width: '78%' }} /><div className="sk" style={{ width: '60%' }} /></div></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="composer-wrap">
        <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
          <label htmlFor="chat-in" style={{ position: 'absolute', left: -9999 }}>Mensagem</label>
          <textarea id="chat-in" rows={2} placeholder="Pergunte ao Pollo CEO sobre sua empresa..." value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(draft); } }} />
          <div className="tools">
            <button type="button" className="icon-btn" aria-label="Anexar documento" title="Anexar (em breve)" disabled><Icon name="clip" /></button>
            <button type="button" className="icon-btn" aria-label="Gravar áudio" title="Gravar áudio (em breve)" disabled><Icon name="mic" /></button>
            <span className="sp" />
            <Link className="btn ghost sm" href="/reunioes"><Icon name="video" size="sm" /><span className="desk">Iniciar reunião</span></Link>
            <button type="submit" className="btn primary sm" aria-label="Enviar"><Icon name="send" size="sm" /><span className="desk">Enviar</span></button>
          </div>
        </form>
      </div>
    </div>
  );
}
