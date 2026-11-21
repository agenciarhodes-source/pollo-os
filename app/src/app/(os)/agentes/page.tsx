'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { NoData } from '@/components/NoData';
import { Ill, PageHead, St3, brl2 } from '@/components/ui';
import { AGENTS, TAG, type Agent } from '@/demo/data';
import { useSession } from '@/demo/session';

const LEVELS: Agent['lv'][] = ['Estratégico', 'Analítico', 'Operacional'];

export default function AgentsPage() {
  const s = useSession();
  const [open, setOpen] = useState<Agent | null>(null);
  const d14 = s.decisions.find((d) => d.id === 'D-014');
  // O estado de dois agentes acompanha a decisão D-014 (igual ao protótipo).
  const agents = AGENTS.map((a) => {
    if (!d14) return a;
    if (a.id === 'ceo' && d14.s === 'Aguardando aprovação') return { ...a, st: 'wappr' as const, task: 'Proposta D-014: teste de triagem', next: 'Aguardar a sua aprovação' };
    if (a.id === 'tri' && d14.s === 'Aguardando aprovação') return { ...a, st: 'wappr' as const, task: 'Aguardando a decisão D-014' };
    if (a.id === 'tri' && d14.s === 'Aprovada') return { ...a, st: 'wdata' as const, task: 'Aguardando configuração pela equipe', next: 'Início previsto em 23/11 · ainda não executado' };
    return a;
  });
  const total = agents.reduce((n, a) => n + a.cost, 0);

  return (
    <NoData>
      <div className="stack">
        <PageHead title="Agentes & Operações" sub={`O trabalho dos agentes hoje, por nível · custo do dia ${brl2(total)}`} right={<Ill />} />
        {LEVELS.map((lv) => (
          <section key={lv} className="card">
            <div className="card-h"><div><h3>{lv === 'Analítico' ? 'Tático-analítico' : lv}</h3></div></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Agente</th><th>Estado</th><th>Tarefa atual</th><th>Última ação</th><th className="r">Custo hoje</th><th /></tr></thead>
                <tbody>{agents.filter((a) => a.lv === lv).map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.n}</b> <span className={`chip ${TAG[a.tag][1]}`}>{TAG[a.tag][0]}</span><div className="faint" style={{ fontSize: 12 }}>{a.f}</div></td>
                    <td><St3 k={a.st} /></td>
                    <td style={{ whiteSpace: 'normal', minWidth: 200 }}>{a.task}</td>
                    <td>{a.last}</td>
                    <td className="r num">{brl2(a.cost)}</td>
                    <td className="r"><button className="btn line xs" onClick={() => setOpen(a)}>Detalhes</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(null)} />
          <aside className="drawer" role="dialog" aria-label={open.n}>
            <div className="drawer-h row between"><h3>{open.n}</h3><button className="icon-btn" onClick={() => setOpen(null)} aria-label="Fechar"><Icon name="x" /></button></div>
            <div className="drawer-b stack">
              <div className="row wrap"><St3 k={open.st} /><span className={`chip ${TAG[open.tag][1]}`}>{TAG[open.tag][0]}</span><span className="chip line">{open.lv}</span></div>
              <p>{open.f}</p>
              <div><div className="lbl">Próximo passo</div><p>{open.next}</p></div>
              <div><div className="lbl">Última entrega</div><p>{open.res}</p></div>
              <div><div className="lbl">Dados que usa</div><div className="row wrap" style={{ marginTop: 6 }}>{open.data.map((d) => <span key={d} className="chip line">{d}</span>)}</div></div>
              <div className="caveat"><Icon name="shield" size="sm" /><span>{open.lim}</span></div>
              <div><div className="lbl">Histórico</div>
                {open.hist.length ? <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{open.hist.map(([t, h]) => <li key={t + h}><span className="faint">{t}</span> · {h}</li>)}</ul> : <p className="faint">Sem atividade.</p>}
              </div>
            </div>
          </aside>
        </>
      )}
    </NoData>
  );
}
