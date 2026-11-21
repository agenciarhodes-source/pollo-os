'use client';

import { useState } from 'react';
import { NoData } from '@/components/NoData';
import { Icon } from '@/components/Icon';
import { Ill, PageHead } from '@/components/ui';
import { NOTES, type Note } from '@/demo/data';

const CATS = ['Todos', 'Processos', 'Aprendizados', 'Decisões', 'Fontes'] as const;
const CATC: Record<Note['cat'], string> = { Processos: 'var(--ff)', Aprendizados: 'var(--warn)', Decisões: 'var(--brand)', Fontes: 'var(--ink-3)' };
const STC: Record<Note['st'], string> = { Validado: 'ok', Pendente: 'warn', Obsoleto: 'err' };

export default function BrainPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>('Todos');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string>('n1');
  const list = NOTES.filter((n) => (cat === 'Todos' || n.cat === cat) && (n.t + n.sum).toLowerCase().includes(q.toLowerCase()));
  const note = NOTES.find((n) => n.id === sel) ?? NOTES[0];

  return (
    <NoData>
      <div className="stack">
        <PageHead title="Segundo Cérebro" sub="Processos, aprendizados, decisões e fontes da empresa. Só o que foi validado vira fato nas respostas." right={<Ill />} />
        <div className="row wrap between">
          <div className="seg">{CATS.map((c) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div>
          <input className="inp" style={{ maxWidth: 280 }} placeholder="Buscar no Segundo Cérebro" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', alignItems: 'start' }}>
          <section className="card" style={{ padding: 8 }}>
            {list.length === 0 && <p className="muted" style={{ padding: 12 }}>Nada encontrado.</p>}
            {list.map((n) => (
              <button key={n.id} onClick={() => setSel(n.id)} style={{ display: 'grid', gap: 4, width: '100%', padding: '10px 12px', borderRadius: 10, background: sel === n.id ? 'var(--sand)' : undefined }}>
                <span className="row between"><b style={{ fontSize: 13.5 }}>{n.t}</b><span className={`chip ${STC[n.st]}`}>{n.st}</span></span>
                <span className="row" style={{ fontSize: 12 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: CATC[n.cat], display: 'inline-block' }} /><span className="faint">{n.cat} · revisado {n.rev}</span></span>
              </button>
            ))}
          </section>
          <section className="card stack">
            <div className="row between wrap"><h3 style={{ fontSize: 17 }}>{note.t}</h3><span className={`chip ${STC[note.st]}`}>{note.st}</span></div>
            <p>{note.sum}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>{note.body.map((b) => <li key={b}>{b}</li>)}</ul>
            {note.st !== 'Validado' && <div className="caveat"><Icon name="alert" size="sm" /><span>Ainda não validada. O Pollo CEO usa como contexto, não como fato.</span></div>}
            <div className="faint" style={{ fontSize: 12.5 }}>Fonte: {note.src} · Responsável: {note.resp} · Revisão: {note.rev}</div>
            {note.links.length > 0 && (
              <div><div className="lbl">Ligações</div><div className="row wrap" style={{ marginTop: 6 }}>
                {note.links.map((l) => { const x = NOTES.find((n) => n.id === l); return x ? <button key={l} className="chip line" onClick={() => setSel(l)}><Icon name="link" size="xs" />{x.t}</button> : null; })}
              </div></div>
            )}
          </section>
        </div>
      </div>
    </NoData>
  );
}
