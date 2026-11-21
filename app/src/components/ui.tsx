import { Icon } from './Icon';
import { SOURCES, ST3, type AgentStatus, type DecisionStatus, type SourceKey } from '@/demo/data';

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const brl2 = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export function Ill({ label = 'Dados ilustrativos' }: { label?: string }) {
  return <span className="ill">{label}</span>;
}

export function SrcChip({ k }: { k: SourceKey }) {
  const s = SOURCES[k];
  return (
    <span className={`src ${s.st === 'off' ? 'off' : ''}`} title={s.lim}>
      <i style={{ background: s.c }} />
      {s.n}
    </span>
  );
}

const EP: Record<string, string> = { fato: 'Fato', hip: 'Hipótese', rec: 'Recomendação', dec: 'Decisão', exe: 'Execução', prop: 'Proposta' };
export function Ep({ k, label }: { k: keyof typeof EP; label?: string }) {
  return <span className={`ep ${k}`}>{label ?? EP[k]}</span>;
}

export function St3({ k }: { k: AgentStatus }) {
  const [t, c, i] = ST3[k];
  return <span className="st3" style={{ color: c }}><Icon name={i} size="xs" />{t}</span>;
}

const DEC_CHIP: Record<DecisionStatus, string> = {
  Proposta: '', 'Aguardando aprovação': 'warn', Aprovada: 'ok', 'Em execução': 'ff', Concluída: 'ok', Rejeitada: 'err',
};
export function DecChip({ s }: { s: DecisionStatus }) {
  return <span className={`chip ${DEC_CHIP[s]}`}>{s}</span>;
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="row between wrap" style={{ marginBottom: 4 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{title}</h2>
        {sub && <p className="muted" style={{ marginTop: 4 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <span className="tile"><Icon name={icon} size="lg" /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Kpi({ label, value, prev, note, good }: { label: string; value: string; prev?: string; note?: string; good?: boolean }) {
  return (
    <section className="card">
      <div className="lbl">{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
      {prev && (
        <div style={{ fontSize: 12.5, marginTop: 4, color: good === undefined ? 'var(--ink-2)' : good ? 'var(--ok)' : 'var(--err)' }}>
          {prev}
        </div>
      )}
      {note && <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>{note}</div>}
    </section>
  );
}

export function Bars({ rows, max }: { rows: [string, number, string?][]; max?: number }) {
  const m = max ?? Math.max(...rows.map((r) => r[1]));
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map(([n, v, c]) => (
        <div key={n} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,160px) 1fr 56px', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13 }}>{n}</span>
          <span style={{ height: 10, background: 'var(--sand)', borderRadius: 6, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${(v / m) * 100}%`, background: c ?? 'var(--brand)', borderRadius: 6 }} />
          </span>
          <span className="num" style={{ fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{v.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}
