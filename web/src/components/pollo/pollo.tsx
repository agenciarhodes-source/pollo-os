import { useId } from "react";

/*
 * O Pollo: a criatura que representa um Bot no Pollo OS.
 * Um corpo (formato + cor) e um rosto feito de sinais, como um emoticon.
 * Tudo em SVG num quadro de 100 x 100; os cantos são arredondados com traço
 * de junção redonda na mesma cor do corpo.
 */

export const SHAPES = [
  { id: "bola", label: "Bola" },
  { id: "triangulo", label: "Triângulo" },
  { id: "estrela", label: "Estrela" },
  { id: "quadrado", label: "Quadrado" },
  { id: "flor", label: "Flor" },
] as const;

export const COLORS = [
  { id: "laranja", label: "Laranja Pollo", light: "#F3A25E", base: "#CA6E23", dark: "#9A4E12" },
  { id: "azul", label: "Azul", light: "#7DB5FF", base: "#3478E0", dark: "#1F4FA8" },
  { id: "verde", label: "Verde", light: "#6FDDB0", base: "#22A774", dark: "#127550" },
  { id: "roxo", label: "Roxo", light: "#BFA3FF", base: "#8A5CE6", dark: "#5E35B8" },
  { id: "rosa", label: "Rosa", light: "#FF9CC9", base: "#E0468F", dark: "#A82466" },
] as const;

export const FACES = [
  { id: "ponto", label: "Ponto", glyph: "•" },
  { id: "olhos", label: "Dois pontos", glyph: "••" },
  { id: "triangulo", label: "Triângulo", glyph: "▴" },
  { id: "piscada", label: "Ponto e vírgula", glyph: "•," },
  { id: "feliz", label: "Feliz", glyph: "^^" },
] as const;

export type ShapeId = (typeof SHAPES)[number]["id"];
export type ColorId = (typeof COLORS)[number]["id"];
export type FaceId = (typeof FACES)[number]["id"];

export type PolloProps = {
  shape?: ShapeId;
  color?: ColorId;
  face?: FaceId;
  /** Lado em pixels. */
  size?: number;
  /** Respira, pulsa e pisca. Desligado para miniaturas paradas. */
  alive?: boolean;
  className?: string;
  title?: string;
};

/** Centro do rosto em cada formato (o triângulo e a estrela têm o centro visual mais baixo). */
const FACE_Y: Record<ShapeId, number> = {
  bola: 50,
  triangulo: 60,
  estrela: 55,
  quadrado: 50,
  flor: 50,
};

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(" ");
}

function Body({ shape, fill }: { shape: ShapeId; fill: string }) {
  const round = { fill, stroke: fill, strokeLinejoin: "round" as const };
  switch (shape) {
    case "bola":
      return <circle cx={50} cy={50} r={40} fill={fill} />;
    case "quadrado":
      return <rect x={12} y={12} width={76} height={76} rx={26} fill={fill} />;
    case "triangulo":
      return <polygon points="50,20 82,78 18,78" strokeWidth={16} {...round} />;
    case "estrela":
      return <polygon points={starPoints(50, 54, 36, 19)} strokeWidth={12} {...round} />;
    case "flor":
      return (
        <g fill={fill}>
          <circle cx={50} cy={30} r={21} />
          <circle cx={70} cy={50} r={21} />
          <circle cx={50} cy={70} r={21} />
          <circle cx={30} cy={50} r={21} />
          <circle cx={50} cy={50} r={22} />
        </g>
      );
  }
}

function Face({ face, cy }: { face: FaceId; cy: number }) {
  const ink = "#FFFFFF";
  const line = { stroke: ink, strokeWidth: 4.5, strokeLinecap: "round" as const, fill: "none" };
  switch (face) {
    case "ponto":
      return <circle cx={50} cy={cy} r={6.5} fill={ink} />;
    case "olhos":
      return (
        <g fill={ink}>
          <circle cx={40} cy={cy} r={5.5} />
          <circle cx={60} cy={cy} r={5.5} />
        </g>
      );
    case "triangulo":
      return (
        <polygon
          points={`50,${cy - 7} 57.5,${cy + 6} 42.5,${cy + 6}`}
          fill={ink}
          stroke={ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      );
    case "piscada":
      // Um ponto e vírgula deitado: o ponto de um lado, a vírgula do outro.
      return (
        <g>
          <circle cx={40} cy={cy} r={5.5} fill={ink} />
          <circle cx={60} cy={cy} r={5.5} fill={ink} />
          <path d={`M63.5 ${cy + 1.5} Q63 ${cy + 9} 57 ${cy + 12}`} {...line} />
        </g>
      );
    case "feliz":
      return (
        <g>
          <path d={`M33 ${cy + 3} Q39 ${cy - 7} 45 ${cy + 3}`} {...line} />
          <path d={`M55 ${cy + 3} Q61 ${cy - 7} 67 ${cy + 3}`} {...line} />
        </g>
      );
  }
}

export function Pollo({
  shape = "bola",
  color = "laranja",
  face = "olhos",
  size = 96,
  alive = true,
  className = "",
  title,
}: PolloProps) {
  const id = useId().replace(/:/g, "");
  const c = COLORS.find((x) => x.id === color) ?? COLORS[0];
  const label = title ?? `Pollo ${SHAPES.find((s) => s.id === shape)?.label.toLowerCase()} ${c.label.toLowerCase()}`;

  return (
    <span
      className={`pollo ${alive ? "pollo--alive" : ""} ${className}`}
      style={{ width: size, height: size, ["--pollo-glow" as string]: c.base }}
      role="img"
      aria-label={label}
    >
      {alive && <span className="pollo__halo" aria-hidden />}
      <svg viewBox="0 0 100 100" width={size} height={size} className="pollo__body" aria-hidden>
        <defs>
          {/* Em coordenadas do quadro, para o brilho cobrir o corpo inteiro como uma peça só. */}
          <radialGradient id={`g${id}`} gradientUnits="userSpaceOnUse" cx={38} cy={30} r={72}>
            <stop offset="0%" stopColor={c.light} />
            <stop offset="55%" stopColor={c.base} />
            <stop offset="100%" stopColor={c.dark} />
          </radialGradient>
        </defs>
        <Body shape={shape} fill={`url(#g${id})`} />
        <g className="pollo__face">
          <Face face={face} cy={FACE_Y[shape]} />
        </g>
      </svg>
    </span>
  );
}
