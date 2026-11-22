import { useId } from "react";

/*
 * O Pollo: a criatura que representa um Bot no Pollo OS.
 * Um corpo (formato + cor), um rosto feito de sinais, como um emoticon, e um
 * jeito de se mexer. Tudo em SVG num quadro de 100 x 100; os cantos são
 * arredondados com traço de junção redonda na mesma cor do corpo.
 */

export const SHAPES = [
  { id: "bola", label: "Bola" },
  { id: "triangulo", label: "Triângulo" },
  { id: "estrela", label: "Estrela" },
  { id: "quadrado", label: "Quadrado" },
  { id: "flor", label: "Flor" },
  { id: "gota", label: "Gota" },
  { id: "coracao", label: "Coração" },
  { id: "hexagono", label: "Hexágono" },
  { id: "nuvem", label: "Nuvem" },
] as const;

/** light/base/dark: o degradê do corpo. ink: a cor do rosto, para ter contraste em cada cor. */
export const COLORS = [
  { id: "marrom", label: "Marrom", light: "#C08D69", base: "#7A4B2C", dark: "#43260F", ink: "#FFFFFF" },
  { id: "laranja", label: "Laranja Pollo", light: "#F7AE6B", base: "#CA6E23", dark: "#8F470F", ink: "#FFFFFF" },
  { id: "amarelo", label: "Amarelo", light: "#FFE58A", base: "#F2B620", dark: "#B07D06", ink: "#3A2A05" },
  { id: "vermelho", label: "Vermelho", light: "#FF9A8B", base: "#E0483A", dark: "#A3261B", ink: "#FFFFFF" },
  { id: "rosa", label: "Rosa", light: "#FFA6CF", base: "#E0468F", dark: "#A02160", ink: "#FFFFFF" },
  { id: "roxo", label: "Roxo", light: "#C6ADFF", base: "#8A5CE6", dark: "#5832AE", ink: "#FFFFFF" },
  { id: "azul", label: "Azul", light: "#8CC0FF", base: "#3478E0", dark: "#1D4A9E", ink: "#FFFFFF" },
  { id: "turquesa", label: "Turquesa", light: "#7FEBE6", base: "#1FA8B0", dark: "#0E6A70", ink: "#FFFFFF" },
  { id: "verde", label: "Verde", light: "#7FE3B9", base: "#22A774", dark: "#106E4B", ink: "#FFFFFF" },
  { id: "grafite", label: "Grafite", light: "#9A9AA8", base: "#4A4A56", dark: "#22222A", ink: "#FFFFFF" },
] as const;

export const FACES = [
  { id: "ponto", label: "Ponto" },
  { id: "olhos", label: "Dois pontos" },
  { id: "triangulo", label: "Triângulo" },
  { id: "piscada", label: "Ponto e vírgula" },
  { id: "feliz", label: "Feliz" },
  { id: "sorriso", label: "Sorriso" },
  { id: "apertado", label: "Apertado" },
  { id: "surpreso", label: "Surpreso" },
  { id: "timido", label: "Tímido" },
  { id: "dormindo", label: "Dormindo" },
] as const;

export const MOODS = [
  { id: "calmo", label: "Calmo" },
  { id: "animado", label: "Animado" },
  { id: "pulando", label: "Pulando" },
  { id: "balancando", label: "Balançando" },
  { id: "dormindo", label: "Dormindo" },
] as const;

export type ShapeId = (typeof SHAPES)[number]["id"];
export type ColorId = (typeof COLORS)[number]["id"];
export type FaceId = (typeof FACES)[number]["id"];
export type MoodId = (typeof MOODS)[number]["id"];

export type PolloProps = {
  shape?: ShapeId;
  color?: ColorId;
  face?: FaceId;
  mood?: MoodId;
  /** Lado em pixels. */
  size?: number;
  /** Se mexe. Desligado para miniaturas paradas. */
  alive?: boolean;
  className?: string;
  title?: string;
};

/** Centro do rosto em cada formato (alguns têm o centro visual mais baixo ou mais alto). */
const FACE_Y: Record<ShapeId, number> = {
  bola: 50,
  triangulo: 60,
  estrela: 55,
  quadrado: 50,
  flor: 50,
  gota: 62,
  coracao: 47,
  hexagono: 50,
  nuvem: 60,
};

/** Onde bate a luz: o reflexo no alto, à esquerda, dentro do corpo. */
const SHINE: Record<ShapeId, { x: number; y: number; r: number }> = {
  bola: { x: 34, y: 30, r: 9 },
  triangulo: { x: 44, y: 40, r: 6 },
  estrela: { x: 44, y: 38, r: 6 },
  quadrado: { x: 30, y: 28, r: 8 },
  flor: { x: 42, y: 22, r: 7 },
  gota: { x: 38, y: 50, r: 7 },
  coracao: { x: 28, y: 32, r: 7 },
  hexagono: { x: 34, y: 30, r: 8 },
  nuvem: { x: 42, y: 36, r: 7 },
};

function polygon(cx: number, cy: number, r: number, sides: number, start = -Math.PI / 2) {
  return Array.from({ length: sides }, (_, i) => {
    const a = start + (2 * Math.PI * i) / sides;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function Body({ shape, fill }: { shape: ShapeId; fill: string }) {
  const round = { fill, stroke: fill, strokeLinejoin: "round" as const };
  switch (shape) {
    case "bola":
      return <circle cx={50} cy={50} r={40} fill={fill} />;
    case "quadrado":
      return <rect x={12} y={12} width={76} height={76} rx={26} fill={fill} />;
    case "triangulo":
      return <polygon points="50,20 82,78 18,78" strokeWidth={18} {...round} />;
    case "estrela":
      return <polygon points={starPoints(50, 54, 36, 19)} strokeWidth={13} {...round} />;
    case "hexagono":
      return <polygon points={polygon(50, 50, 33, 6, 0)} strokeWidth={16} {...round} />;
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
    case "gota":
      return (
        <path
          d="M50 14 C58 28 82 46 82 62 A32 32 0 0 1 18 62 C18 46 42 28 50 14 Z"
          strokeWidth={6}
          {...round}
        />
      );
    case "coracao":
      return (
        <path
          d="M50 84 C24 68 12 52 12 36 A19 19 0 0 1 50 26 A19 19 0 0 1 88 36 C88 52 76 68 50 84 Z"
          strokeWidth={6}
          {...round}
        />
      );
    case "nuvem":
      return (
        <g fill={fill}>
          <circle cx={33} cy={56} r={20} />
          <circle cx={52} cy={42} r={25} />
          <circle cx={70} cy={58} r={18} />
          <rect x={14} y={54} width={74} height={28} rx={14} />
        </g>
      );
  }
}

function Face({ face, cy, ink }: { face: FaceId; cy: number; ink: string }) {
  const line = { stroke: ink, strokeWidth: 4.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
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
    case "sorriso":
      return (
        <g>
          <circle cx={41} cy={cy - 4} r={4.5} fill={ink} />
          <circle cx={59} cy={cy - 4} r={4.5} fill={ink} />
          <path d={`M40 ${cy + 6} Q50 ${cy + 14} 60 ${cy + 6}`} {...line} />
        </g>
      );
    case "apertado":
      return (
        <g>
          <path d={`M34 ${cy - 6} L43 ${cy} L34 ${cy + 6}`} {...line} />
          <path d={`M66 ${cy - 6} L57 ${cy} L66 ${cy + 6}`} {...line} />
        </g>
      );
    case "surpreso":
      return (
        <g>
          <circle cx={39} cy={cy} r={6} {...line} strokeWidth={4} />
          <circle cx={61} cy={cy} r={6} {...line} strokeWidth={4} />
        </g>
      );
    case "timido":
      return (
        <g>
          <circle cx={39} cy={cy - 2} r={4} fill={ink} />
          <circle cx={61} cy={cy - 2} r={4} fill={ink} />
          <path d={`M45 ${cy + 6} L55 ${cy + 6}`} {...line} strokeWidth={4} />
        </g>
      );
    case "dormindo":
      return (
        <g>
          <path d={`M33 ${cy} Q39 ${cy + 5} 45 ${cy}`} {...line} />
          <path d={`M55 ${cy} Q61 ${cy + 5} 67 ${cy}`} {...line} />
        </g>
      );
  }
}

export function Pollo({
  shape = "bola",
  color = "laranja",
  face = "olhos",
  mood = "animado",
  size = 96,
  alive = true,
  className = "",
  title,
}: PolloProps) {
  const id = useId().replace(/:/g, "");
  const c = COLORS.find((x) => x.id === color) ?? COLORS[0];
  const shine = SHINE[shape];
  const label =
    title ?? `Pollo ${SHAPES.find((s) => s.id === shape)?.label.toLowerCase()} ${c.label.toLowerCase()}`;

  return (
    <span
      className={`pollo ${alive ? `pollo--alive pollo--${mood}` : ""} ${className}`}
      style={{ width: size, height: size, ["--pollo-glow" as string]: c.base }}
      role="img"
      aria-label={label}
    >
      {alive && mood !== "dormindo" && <span className="pollo__halo" aria-hidden />}
      <span className="pollo__mover">
        <svg viewBox="0 0 100 100" width={size} height={size} className="pollo__body" aria-hidden>
          <defs>
            {/* Em coordenadas do quadro, para o brilho cobrir o corpo inteiro como uma peça só. */}
            <radialGradient id={`g${id}`} gradientUnits="userSpaceOnUse" cx={38} cy={30} r={72}>
              <stop offset="0%" stopColor={c.light} />
              <stop offset="55%" stopColor={c.base} />
              <stop offset="100%" stopColor={c.dark} />
            </radialGradient>
            <radialGradient id={`s${id}`}>
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          <Body shape={shape} fill={`url(#g${id})`} />
          <ellipse
            cx={shine.x}
            cy={shine.y}
            rx={shine.r * 1.3}
            ry={shine.r}
            fill={`url(#s${id})`}
            transform={`rotate(-30 ${shine.x} ${shine.y})`}
          />
          <g className="pollo__face">
            <Face face={face} cy={FACE_Y[shape]} ink={c.ink} />
          </g>
        </svg>
      </span>
      {alive && mood === "dormindo" && (
        <span className="pollo__zzz" aria-hidden>
          z
        </span>
      )}
    </span>
  );
}
