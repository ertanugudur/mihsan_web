import * as THREE from "three";

// Tarayıcıda üretilen kraft kâğıt dokusu: harici görsel gerekmez.
// Renk haritası + kabartma (bump) haritası birlikte üretilir.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Tone = { base: [number, number, number]; spread: number };

export function makeKraft(size = 1024, tone: Tone, seed = 7) {
  const rand = rng(seed);
  const color = document.createElement("canvas");
  const bump = document.createElement("canvas");
  color.width = color.height = bump.width = bump.height = size;
  const c = color.getContext("2d")!;
  const b = bump.getContext("2d")!;

  // 1) taban renk + yumuşak lekelenme (büyük ölçekli renk dalgalanması)
  const [r, g, bl] = tone.base;
  c.fillStyle = `rgb(${r},${g},${bl})`;
  c.fillRect(0, 0, size, size);
  b.fillStyle = "rgb(128,128,128)";
  b.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = size * (0.08 + rand() * 0.22);
    const d = (rand() - 0.5) * tone.spread;
    const grad = c.createRadialGradient(x, y, 0, x, y, rad);
    const col = `${Math.round(r + d)},${Math.round(g + d * 0.85)},${Math.round(bl + d * 0.6)}`;
    grad.addColorStop(0, `rgba(${col},0.22)`);
    grad.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = grad;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // 2) piksel gürültüsü (kâğıt hamuru)
  const img = c.getImageData(0, 0, size, size);
  const bimg = b.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n * 0.9;
    img.data[i + 2] += n * 0.7;
    const bn = 128 + (rand() - 0.5) * 40;
    bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = bn;
  }
  c.putImageData(img, 0, 0);
  b.putImageData(bimg, 0, 0);

  // 3) lifler: ince, kısa, hafif kavisli çizgiler (çoğu tek yönde: makine yönü)
  const fibers = Math.round(size * 9);
  for (let i = 0; i < fibers; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 4 + rand() * 22;
    const ang = (rand() - 0.5) * 0.9 + (rand() < 0.15 ? Math.PI / 2 : 0);
    const dark = rand() < 0.55;
    const a = 0.05 + rand() * 0.12;
    c.strokeStyle = dark ? `rgba(70,42,18,${a})` : `rgba(255,236,205,${a})`;
    c.lineWidth = 0.6 + rand() * 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (rand() - 0.5) * 3,
      y + Math.sin(ang) * len * 0.5 + (rand() - 0.5) * 3,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len
    );
    c.stroke();
    b.strokeStyle = dark ? "rgba(90,90,90,0.5)" : "rgba(170,170,170,0.5)";
    b.lineWidth = c.lineWidth;
    b.beginPath();
    b.moveTo(x, y);
    b.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    b.stroke();
  }

  // 4) benekler: geri dönüşüm kâğıdındaki koyu noktalar
  for (let i = 0; i < size * 0.35; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 0.5 + rand() * 1.6;
    c.fillStyle = `rgba(45,28,12,${0.25 + rand() * 0.45})`;
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.fill();
  }

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump);
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
  }
  return { map, bumpMap };
}

/** Aynı dokuyu farklı tekrar oranıyla kullanmak için klonlar. */
export function withRepeat<T extends { map: THREE.Texture; bumpMap: THREE.Texture }>(tex: T, rx: number, ry: number, aniso: number) {
  const map = tex.map.clone();
  const bumpMap = tex.bumpMap.clone();
  for (const t of [map, bumpMap]) {
    t.repeat.set(rx, ry);
    t.anisotropy = aniso;
    t.needsUpdate = true;
  }
  return { map, bumpMap };
}
