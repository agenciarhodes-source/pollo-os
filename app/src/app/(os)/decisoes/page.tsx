'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { NoData } from '@/components/NoData';
import { DecChip, Ill, PageHead } from '@/components/ui';
import { PROFILES, type Decision } from '@/demo/data';
import { useSession } from '@/demo/session';

const TABS = ['Pendentes', 'Em andamento', 'Histórico'] as const;
const IN_TAB: Record<(typeof TABS)[number], Decision['s'][]> = {
  Pendentes: ['Proposta', 'Aguardando aprovação'],
  'Em andamento': ['Aprovada', 'Em execução'],
  Histórico: ['Concluída', 'Rejeitada'],
};

export default function DecisionsPage() {
  const s = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Pendentes');
  const [openId, setOpenId] = useState<string | null>(null);
  if (!s.profile) return null;
  const me = PROFILES[s.profile].n;
  const isAdmin = !!s.tenant()?.admin;
  const list = s.decisions.filter((d) => IN_TAB[tab].includes(d.s));
  const open = s.decisions.find((d) => d.id === openId) ?? null;

  return (
    <NoData>
      <div className="stack">
        <PageHead title="Decisões & Aprovações" sub="Propostas com hipótese, evidência, custo e risco. Nada é executado sem aprovação." right={<Ill />} />
        <div className="seg">{TABS.map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t} <span className="faint">({s.decisions.filter((d) => IN_TAB[t].includes(d.s)).length})</span>
          </button>
        ))}</div>
        {list.length === 0 && <p className="muted">Nada nesta lista.</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((d) => (
            <button key={d.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpenId(d.id)}>
              <div className="row between wrap">
                <span className="row"><span className="mono faint">{d.id}</span><b>{d.t}</b></span>
                <span className="row"><span className={`chip ${d.risco === 'Alto' ? 'err' : d.risco === 'Médio' ? 'warn' : 'ok'}`}>Risco {d.risco.toLowerCase()}</span><DecChip s={d.s} /></span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{d.hip}</div>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Custo: {d.custo} · Responsável: {d.resp} · Prazo: {d.prazo}</div>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <>
          <div className="scrim" onClick={() => setOpenId(null)} />
          <aside className="drawer" role="dialog" aria-label={open.t}>
            <div className="drawer-h row between"><h3><span className="mono faint">{open.id}</span> {open.t}</h3><button className="icon-btn" onClick={() => setOpenId(null)} aria-label="Fechar"><Icon name="x" /></button></div>
            <div className="drawer-b stack">
              <div className="row wrap"><DecChip s={open.s} /><span className="chip line">Risco {open.risco.toLowerCase()}</span></div>
              <div><div className="lbl">Hipótese</div><p>{open.hip}</p></div>
              <div><div className="lbl">Evidência</div><p>{open.ev}</p></div>
              <div><div className="lbl">Custo · teto</div><p>{open.custo} · teto {open.teto}</p></div>
              <div><div className="lbl">Como mediremos</div><p>{open.met}</p></div>
              {open.crit && <div className="caveat"><Icon name="alert" size="sm" /><span>{open.crit}</span></div>}
              {open.s === 'Aguardando aprovação' && (isAdmin && !open.crit ? (
                <div className="row wrap">
                  <button className="btn ok" onClick={() => s.setDecision(open.id, 'Aprovada', me, 'Aprovou')}><Icon name="check" size="sm" />Aprovar</button>
                  <button className="btn danger" onClick={() => s.setDecision(open.id, 'Rejeitada', me, 'Rejeitou')}><Icon name="x" size="sm" />Rejeitar</button>
                </div>
              ) : (
                <span className="chip"><Icon name="lock" size="xs" />{open.crit ? 'Exige dois aprovadores · fora desta demonstração' : 'Aprovação: só a proprietária'}</span>
              ))}
              <div><div className="lbl">Trilha de auditoria</div>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{open.aud.map(([t, w, a], i) => <li key={i}><span className="faint">{t}</span> · {w} · {a}</li>)}</ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </NoData>
  );
}
