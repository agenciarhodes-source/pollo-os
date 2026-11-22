"use client";

import { useState } from "react";
import {
  COLORS,
  FACES,
  Pollo,
  SHAPES,
  type ColorId,
  type FaceId,
  type ShapeId,
} from "./pollo";

function Option({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={label}
      className={`flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        selected
          ? "border-brand bg-brand/10 text-foreground"
          : "border-black/10 text-muted hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
      }`}
    >
      {children}
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <div className="grid grid-cols-5 gap-2">{children}</div>
    </section>
  );
}

export function PolloStudio() {
  const [shape, setShape] = useState<ShapeId>("bola");
  const [color, setColor] = useState<ColorId>("laranja");
  const [face, setFace] = useState<FaceId>("olhos");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-brand">Pollo OS</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">As criaturas Pollo</h1>
        <p className="max-w-xl text-muted">
          Cada Bot é um Pollo: um formato, uma cor e um rosto. Monte o seu e veja ele respirar.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex min-h-80 flex-col items-center justify-center gap-6 rounded-[28px] bg-white/70 p-8 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
          <Pollo shape={shape} color={color} face={face} size={168} />
          <p className="text-sm text-muted">Passe o mouse e clique nele.</p>
        </div>

        <div className="flex flex-col gap-7">
          <Row title="Formato">
            {SHAPES.map((s) => (
              <Option key={s.id} selected={shape === s.id} onClick={() => setShape(s.id)} label={s.label}>
                <Pollo shape={s.id} color={color} face={face} size={44} alive={false} />
              </Option>
            ))}
          </Row>
          <Row title="Cor">
            {COLORS.map((c) => (
              <Option key={c.id} selected={color === c.id} onClick={() => setColor(c.id)} label={c.label}>
                <Pollo shape={shape} color={c.id} face={face} size={44} alive={false} />
              </Option>
            ))}
          </Row>
          <Row title="Rosto">
            {FACES.map((f) => (
              <Option key={f.id} selected={face === f.id} onClick={() => setFace(f.id)} label={f.label}>
                <Pollo shape={shape} color={color} face={f.id} size={44} alive={false} />
              </Option>
            ))}
          </Row>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Todas as combinações</h2>
          <p className="text-sm text-muted">
            {SHAPES.length * COLORS.length * FACES.length} Pollos diferentes
          </p>
        </div>
        <div className="grid grid-cols-5 gap-3 sm:gap-4">
          {COLORS.flatMap((c, ci) =>
            SHAPES.map((s, si) => {
              const f = FACES[(ci + si) % FACES.length].id;
              return (
                <button
                  key={`${c.id}-${s.id}`}
                  type="button"
                  onClick={() => {
                    setShape(s.id);
                    setColor(c.id);
                    setFace(f);
                  }}
                  className="flex aspect-square items-center justify-center rounded-2xl ring-1 ring-black/5 transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-brand dark:ring-white/10 dark:hover:bg-white/5"
                  aria-label={`Escolher ${s.label} ${c.label}`}
                >
                  <Pollo shape={s.id} color={c.id} face={f} size={56} />
                </button>
              );
            }),
          )}
        </div>
      </section>
    </div>
  );
}
