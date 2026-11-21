'use client';

import { useState } from 'react';
import { NoData } from '@/components/NoData';
import { Bars, Ep, Ill, PageHead, SrcChip } from '@/components/ui';
import { KPI } from '@/demo/data';

const TABS = ['Funil', 'Origens', 'Tempo de resposta'] as const;

export default function IntelPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Funil');
  return (
    <NoData>
      <div className="stack">
        <PageHead title="Visão Analítica" sub="Indicadores com fonte e período. Hipóteses aparecem separadas dos fatos."
          right={<div className="row wrap"><SrcChip k="ff" /><SrcChip k="ads" /><Ill /></div>} />
        <div className="seg">
          {TABS.map((t) => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
        </div>

        {tab === 'Funil' && (
          <section className="card">
            <div className="card-h"><div><h3>Funil comercial</h3><div className="sub">{KPI.per} · entre parênteses, {KPI.prev}</div></div></div>
            <Bars rows={KPI.funil.map(([n, a, b]) => [`${n} (${b})`, a, 'var(--ff)'])} />
            <p className="muted" style={{ marginTop: 14, fontSize: 13 }}><Ep k="fato" /> Mais leads e contatos, mas menos visitas, propostas e vendas que no mês anterior.</p>
          </section>
        )}

        {tab === 'Origens' && (
          <section className="card">
            <div className="card-h"><div><h3>Resultado por origem</h3><div className="sub">FlipForm · 01–20/11</div></div></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Origem</th><th className="r">Leads</th><th className="r">1ª resposta</th><th className="r">Visitas</th><th className="r">Vendas</th></tr></thead>
                <tbody>{KPI.origem.map(([n, l, r, v, s]) => (
                  <tr key={n}><td>{n}</td><td className="r num">{l}</td><td className="r num" style={{ color: r > 60 ? 'var(--err)' : undefined }}>{r} min</td><td className="r num">{v}</td><td className="r num">{s}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'Tempo de resposta' && (
          <section className="card">
            <div className="card-h"><div><h3>Primeira resposta por semana (min)</h3><div className="sub">FlipForm · últimas 8 semanas</div></div></div>
            <Bars rows={KPI.weeks.map((w, i) => [w, KPI.respW[i], KPI.respW[i] > 35 ? 'var(--warn)' : 'var(--ok)'])} />
            <div style={{ display: 'grid', gap: 8, marginTop: 14, fontSize: 13 }}>
              <div><Ep k="fato" /> A primeira resposta passou de ~27 para 46 min nas últimas semanas.</div>
              <div><Ep k="hip" /> A demora pode estar reduzindo as visitas dos portais. É correlação, não causa comprovada.</div>
            </div>
          </section>
        )}
      </div>
    </NoData>
  );
}
