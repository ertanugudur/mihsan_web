// İzometrik ürün çizimleri: hepsi aynı bakış açısı ve çizgi diliyle üretilir.
type V3 = [number, number, number];

const S = 92; // ölçek
const CX = 120;
const CY = 112;
const C30 = Math.cos(Math.PI / 6);

const p = ([x, y, z]: V3) => [CX + (x - z) * C30 * S, CY + (x + z) * 0.5 * S - y * S] as const;
const d = (pts: V3[], close = true) =>
  pts.map((pt, i) => `${i ? "L" : "M"}${p(pt)[0].toFixed(1)} ${p(pt)[1].toFixed(1)}`).join(" ") + (close ? " Z" : "");

const TOP = "var(--art-top)";
const SIDE_A = "var(--art-a)";
const SIDE_B = "var(--art-b)";

function Face({ pts, fill }: { pts: V3[]; fill: string }) {
  return <path d={d(pts)} fill={fill} />;
}
function Line({ pts, accent, close = false }: { pts: V3[]; accent?: boolean; close?: boolean }) {
  return <path d={d(pts, close)} fill="none" className={accent ? "art-accent" : undefined} />;
}

/** Kapalı kutu (merkezleme için ox, oz ofsetleri) */
function BoxShape({ L, W, H, y0 = 0, ox = 0, oz = 0 }: { L: number; W: number; H: number; y0?: number; ox?: number; oz?: number }) {
  const P = (x: number, y: number, z: number): V3 => [x + ox, y + y0, z + oz];
  return (
    <>
      <Face pts={[P(L, 0, 0), P(L, H, 0), P(L, H, W), P(L, 0, W)]} fill={SIDE_A} />
      <Face pts={[P(0, 0, W), P(L, 0, W), P(L, H, W), P(0, H, W)]} fill={SIDE_B} />
      <Face pts={[P(0, H, 0), P(L, H, 0), P(L, H, W), P(0, H, W)]} fill={TOP} />
    </>
  );
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 200" className="art" strokeLinejoin="round" strokeLinecap="round">
      {children}
    </svg>
  );
}

// ---------- ürünler

export const RscArt = () => {
  const L = 1.15, W = 0.8, H = 0.8, ox = -0.55, oz = -0.4;
  return (
    <Svg>
      <BoxShape L={L} W={W} H={H} ox={ox} oz={oz} y0={-0.35} />
      {/* kapak birleşim çizgisi ve bant */}
      <Line pts={[[ox, H - 0.35, oz + W / 2], [ox + L, H - 0.35, oz + W / 2]]} />
      <Face pts={[[ox, H - 0.35, oz + W / 2 - 0.08], [ox + L, H - 0.35, oz + W / 2 - 0.08], [ox + L, H - 0.35, oz + W / 2 + 0.08], [ox, H - 0.35, oz + W / 2 + 0.08]]} fill="var(--kraft)" />
      <Face pts={[[ox + L, H - 0.35, oz + W / 2 - 0.08], [ox + L, H - 0.6, oz + W / 2 - 0.08], [ox + L, H - 0.6, oz + W / 2 + 0.08], [ox + L, H - 0.35, oz + W / 2 + 0.08]]} fill="var(--kraft)" />
    </Svg>
  );
};

export const OffsetArt = () => {
  const L = 0.55, W = 0.42, H = 1.0, ox = -0.27, oz = -0.21, y0 = -0.5;
  return (
    <Svg>
      {/* geri açılmış dil kapak */}
      <Face pts={[[ox, H + y0, oz], [ox + L, H + y0, oz], [ox + L, H + y0 + 0.34, oz - 0.08], [ox, H + y0 + 0.34, oz - 0.08]]} fill={TOP} />
      <BoxShape L={L} W={W} H={H} ox={ox} oz={oz} y0={y0} />
      {/* ofset baskı alanı */}
      <Face pts={[[ox + 0.08, y0 + 0.28, oz + W], [ox + L - 0.08, y0 + 0.28, oz + W], [ox + L - 0.08, y0 + 0.72, oz + W], [ox + 0.08, y0 + 0.72, oz + W]]} fill="var(--kraft)" />
      <Line pts={[[ox + 0.14, y0 + 0.2, oz + W], [ox + L - 0.2, y0 + 0.2, oz + W]]} />
    </Svg>
  );
};

export const TrayArt = () => {
  const L = 1.3, W = 0.9, H = 0.3, t = 0.06, ox = -0.65, oz = -0.45, y0 = -0.1;
  const P = (x: number, y: number, z: number): V3 => [x + ox, y + y0, z + oz];
  return (
    <Svg>
      <Face pts={[P(t, 0.01, t), P(L - t, 0.01, t), P(L - t, 0.01, W - t), P(t, 0.01, W - t)]} fill={SIDE_B} />
      <Face pts={[P(t, 0, t), P(t, H, t), P(t, H, W - t), P(t, 0, W - t)]} fill={SIDE_A} />
      <Face pts={[P(t, 0, t), P(L - t, 0, t), P(L - t, H, t), P(t, H, t)]} fill={TOP} />
      <Face pts={[P(L, 0, 0), P(L, H, 0), P(L, H, W), P(L, 0, W)]} fill={SIDE_A} />
      <Face pts={[P(0, 0, W), P(L, 0, W), P(L, H, W), P(0, H, W)]} fill={SIDE_B} />
      <Line close pts={[P(0, H, 0), P(L, H, 0), P(L, H, W), P(0, H, W)]} />
      <Line close pts={[P(t, H, t), P(L - t, H, t), P(L - t, H, W - t), P(t, H, W - t)]} />
      {/* havalandırma delikleri */}
      <Line accent pts={[P(0.3, 0.1, W), P(0.3, 0.2, W)]} />
      <Line accent pts={[P(L - 0.3, 0.1, W), P(L - 0.3, 0.2, W)]} />
    </Svg>
  );
};

export const TelescopicArt = () => {
  const L = 1.0, W = 0.72, ox = -0.5, oz = -0.36;
  return (
    <Svg>
      <BoxShape L={L} W={W} H={0.62} ox={ox} oz={oz} y0={-0.55} />
      <BoxShape L={L + 0.08} W={W + 0.08} H={0.22} ox={ox - 0.04} oz={oz - 0.04} y0={0.32} />
      <Line accent pts={[[ox + L + 0.04, 0.32, oz + W + 0.04], [ox + L + 0.04, 0.12, oz + W + 0.04]]} />
      <Line accent pts={[[ox - 0.04, 0.32, oz + W + 0.04], [ox - 0.04, 0.12, oz + W + 0.04]]} />
    </Svg>
  );
};

export const ShoeArt = () => {
  const L = 1.25, W = 0.75, ox = -0.62, oz = -0.37;
  return (
    <Svg>
      <BoxShape L={L} W={W} H={0.5} ox={ox} oz={oz} y0={-0.38} />
      <BoxShape L={L + 0.06} W={W + 0.06} H={0.17} ox={ox - 0.03} oz={oz - 0.03} y0={-0.0} />
      {/* etiket alanı */}
      <Face pts={[[ox + L + 0.03, -0.3, oz + 0.2], [ox + L + 0.03, -0.12, oz + 0.2], [ox + L + 0.03, -0.12, oz + 0.55], [ox + L + 0.03, -0.3, oz + 0.55]]} fill="var(--kraft)" />
    </Svg>
  );
};

export const LockArt = () => {
  const L = 0.95, W = 0.75, H = 0.6, f = 0.32, ox = -0.47, oz = -0.37, y0 = -0.45;
  const P = (x: number, y: number, z: number): V3 => [x + ox, y + y0, z + oz];
  const c = P(L / 2, 0, W / 2);
  return (
    <Svg>
      <Face pts={[P(0, H, 0), P(L, H, 0), P(L, H + f, -0.12), P(0, H + f, -0.12)]} fill={TOP} />
      <Face pts={[P(0, H, 0), P(0, H, W), P(-0.12, H + f, W), P(-0.12, H + f, 0)]} fill={SIDE_A} />
      {/* kilitli dip: içten görünen dört kanat */}
      <Face pts={[P(0, 0, 0), P(L, 0, 0), P(L, 0, W), P(0, 0, W)]} fill={SIDE_B} />
      <Line accent pts={[P(0, 0, 0), c, P(L, 0, W)]} />
      <Line accent pts={[P(L, 0, 0), c, P(0, 0, W)]} />
      <Line accent pts={[P(L / 2, 0, 0), P(L / 2 + 0.12, 0, W / 2 - 0.08)]} />
      <Line accent pts={[P(L / 2, 0, W), P(L / 2 - 0.12, 0, W / 2 + 0.08)]} />
      <Face pts={[P(0, 0, 0), P(0, H, 0), P(0, H, W), P(0, 0, W)]} fill={SIDE_A} />
      <Face pts={[P(0, 0, 0), P(L, 0, 0), P(L, H, 0), P(0, H, 0)]} fill={TOP} />
      <Face pts={[P(L, 0, 0), P(L, H, 0), P(L, H, W), P(L, 0, W)]} fill={SIDE_A} />
      <Face pts={[P(0, 0, W), P(L, 0, W), P(L, H, W), P(0, H, W)]} fill={SIDE_B} />
      <Face pts={[P(L, H, 0), P(L, H, W), P(L + 0.12, H + f, W), P(L + 0.12, H + f, 0)]} fill={TOP} />
      <Face pts={[P(0, H, W), P(L, H, W), P(L, H + f, W + 0.12), P(0, H + f, W + 0.12)]} fill={TOP} />
    </Svg>
  );
};

export const PizzaArt = () => {
  const L = 1.2, W = 1.2, H = 0.16, ox = -0.6, oz = -0.6, y0 = -0.2, a = 0.95;
  const P = (x: number, y: number, z: number): V3 => [x + ox, y + y0, z + oz];
  const lid = (x: number, s: number): V3 => P(x, H + Math.sin(a) * s, Math.cos(a) * s);
  return (
    <Svg>
      <Face pts={[lid(0, 0), lid(L, 0), lid(L, W), lid(0, W)]} fill={TOP} />
      {[0.3, 0.6, 0.9].map((x) => (
        <Line key={x} accent pts={[lid(x, 0.55), lid(x + 0.06, 0.55)]} />
      ))}
      <Face pts={[P(0.04, 0.02, 0.04), P(L - 0.04, 0.02, 0.04), P(L - 0.04, 0.02, W - 0.04), P(0.04, 0.02, W - 0.04)]} fill={SIDE_B} />
      <Face pts={[P(L, 0, 0), P(L, H, 0), P(L, H, W), P(L, 0, W)]} fill={SIDE_A} />
      <Face pts={[P(0, 0, W), P(L, 0, W), P(L, H, W), P(0, H, W)]} fill={SIDE_B} />
      <Line close pts={[P(0, H, 0), P(L, H, 0), P(L, H, W), P(0, H, W)]} />
    </Svg>
  );
};

export const CornerArt = () => {
  const H = 1.25, a = 0.34, t = 0.05, y0 = -0.62;
  const P = (x: number, y: number, z: number): V3 => [x, y + y0, z];
  return (
    <Svg>
      <Face pts={[P(0, 0, 0), P(a, 0, 0), P(a, H, 0), P(0, H, 0)]} fill={SIDE_B} />
      <Face pts={[P(0, 0, 0), P(0, H, 0), P(0, H, a), P(0, 0, a)]} fill={SIDE_A} />
      <Face pts={[P(0, H, 0), P(a, H, 0), P(a, H, t), P(t, H, t), P(t, H, a), P(0, H, a)]} fill={TOP} />
      <Line accent pts={[P(0.1, 0.15, 0), P(0.1, H - 0.15, 0)]} />
      <Line accent pts={[P(0, 0.15, 0.1), P(0, H - 0.15, 0.1)]} />
    </Svg>
  );
};

export const SheetArt = () => {
  const L = 1.3, W = 0.8, ox = -0.65, oz = -0.4, y0 = -0.05, A = 0.07, n = 10;
  const P = (x: number, y: number, z: number): V3 => [x + ox, y + y0, z + oz];
  const crest: V3[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = (L * i) / 80;
    crest.push(P(x, A + A * Math.sin((x / L) * n * Math.PI * 2), W));
  }
  return (
    <Svg>
      <Face pts={[P(0, 0, 0), P(L, 0, 0), P(L, 0, W), P(0, 0, W)]} fill={SIDE_B} />
      {Array.from({ length: n }, (_, i) => {
        const x = (L * (i + 0.25)) / n;
        return <Line key={i} pts={[P(x, 2 * A, 0), P(x, 2 * A, W)]} />;
      })}
      <Line accent pts={crest} />
      <Line pts={[P(0, 0, W), P(L, 0, W)]} />
    </Svg>
  );
};
