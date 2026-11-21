'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { NoData } from '@/components/NoData';
import { Ill, PageHead } from '@/components/ui';
import { MEETINGS } from '@/demo/data';

export default function MeetingsPage() {
  const [prep, setPrep] = useState(false);
  return (
    <NoData>
      <div className="stack">
        <PageHead title="Reuniões" sub="Reuniões executivas com o Pollo CEO: pauta, evidências, ata e decisões."
          right={<div className="row wrap"><button className="btn primary sm" onClick={() => setPrep(true)}><Icon name="video" size="sm" />Preparar reunião</button><Ill /></div>} />
        {prep && (
          <section className="card stack">
            <div className="card-h"><div><h3>Briefing preparado pelo Pollo CEO</h3><div className="sub">Revisão comercial semanal · Sex, 21/11 · 09:00</div></div></div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Leads +18% (120 → 142), vendas 5 → 4, conversão 4,2% → 2,8% (FlipForm).</li>
              <li>Primeira resposta 27 → 42 min; portais em 96 min.</li>
              <li>Pendente: D-012 (verba da Meta) acima do teto; D-014 (teste de triagem), se criada.</li>
            </ul>
            <div className="caveat"><Icon name="info" size="sm" /><span>Voz em tempo real é uma etapa futura. Nesta demonstração, a reunião é por texto.</span></div>
          </section>
        )}
        {MEETINGS.map((m) => (
          <section key={m.t} className="card">
            <div className="row between wrap"><span className="row"><Icon name="cal" size="sm" /><b>{m.t}</b></span><span className={`chip ${m.st.startsWith('Concluída') ? 'ok' : 'brand'}`}>{m.st}</span></div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{m.d}</div>
            <div className="lbl" style={{ marginTop: 12 }}>Pauta</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{m.pauta.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
        ))}
      </div>
    </NoData>
  );
}
