"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeKraft, withRepeat } from "./kraftTexture";

export type Anchor = { x: number; y: number };

/** Scroll zaman çizelgesi (0–1) */
export const TIMELINE = {
  longFlaps: [0.06, 0.3],
  shortFlaps: [0.18, 0.42],
  zoom: [0.44, 0.68],
  split: [0.68, 0.9],
} as const;

type Props = {
  progress: React.MutableRefObject<number>;
  /** Her karede ayrılan katmanların ekran konumları (canvas'a göre px): dış, oluk, iç */
  onFrame?: (anchors: Anchor[], canvas: HTMLCanvasElement) => void;
};

// ---------- koli ölçüleri
const L = 4.2; // en
const H = 2.7; // yükseklik
const Wd = 3.0; // boy
const T = 0.09; // mukavva kalınlığı

// ---------- detay panosu (kapak kesiti) ölçüleri
const BW = 6.4;
const BD = 4.2;
const PERIOD = 0.58;
const AMP = 0.3;
const SHEET = 0.045;
const LINER = 0.07;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (v: number, [a, b]: readonly [number, number]) => clamp01((v - a) / (b - a));
const smooth = (v: number) => v * v * (3 - 2 * v);

function fluteGeometry() {
  const shape = new THREE.Shape();
  const steps = 420;
  const top: THREE.Vector2[] = [];
  const bottom: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = -BW / 2 + (BW * i) / steps;
    const y = AMP * Math.sin((2 * Math.PI * x) / PERIOD);
    top.push(new THREE.Vector2(x, y + SHEET / 2));
    bottom.push(new THREE.Vector2(x, y - SHEET / 2));
  }
  shape.moveTo(top[0].x, top[0].y);
  top.forEach((p) => shape.lineTo(p.x, p.y));
  for (let i = bottom.length - 1; i >= 0; i--) shape.lineTo(bottom[i].x, bottom[i].y);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: BD, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -BD / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Kraft dokusunun üzerine flekso baskı gibi logo basar */
function printTexture(kraft: HTMLCanvasElement, aspect: number, logo: HTMLImageElement | null, logoWidth: number) {
  const w = 1024;
  const h = Math.round(w / aspect);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.drawImage(kraft, 0, 0, kraft.width, Math.min(kraft.height, kraft.width / aspect), 0, 0, w, h);
  if (logo && logo.naturalWidth) {
    const lw = w * logoWidth;
    const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    // logoyu tek renk mürekkebe çevir
    const ink = document.createElement("canvas");
    ink.width = Math.round(lw);
    ink.height = Math.round(lh);
    const ig = ink.getContext("2d")!;
    ig.drawImage(logo, 0, 0, lw, lh);
    ig.globalCompositeOperation = "source-in";
    ig.fillStyle = "rgb(34,24,15)";
    ig.fillRect(0, 0, lw, lh);
    g.globalAlpha = 0.86;
    g.globalCompositeOperation = "multiply";
    g.drawImage(ink, (w - lw) / 2, (h - lh) / 2 - h * 0.03);
    // mürekkebin kâğıda işlemesi: lif dokusunu biraz geri getir
    g.globalCompositeOperation = "soft-light";
    g.globalAlpha = 0.35;
    g.drawImage(kraft, 0, 0, w, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function BoardScene({ progress, onFrame }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const frameCb = useRef(onFrame);
  frameCb.current = onFrame;

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.3;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.6, 15);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc2, 0.7));
    const key = new THREE.DirectionalLight(0xfff6ea, 2.6);
    key.position.set(5, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -7;
    key.shadow.camera.right = key.shadow.camera.top = 7;
    key.shadow.radius = 5;
    key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c0, 0.8);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // ---------- dokular
    const outerTex = makeKraft(1024, { base: [176, 126, 74], spread: 28 }, 11);
    const innerTex = makeKraft(512, { base: [160, 114, 66], spread: 22 }, 23);
    const fluteTex = makeKraft(512, { base: [168, 118, 68], spread: 24 }, 37);
    const botTex = makeKraft(1024, { base: [150, 104, 60], spread: 26 }, 41);

    const all: THREE.MeshStandardMaterial[] = [];
    const mat = (t: { map: THREE.Texture; bumpMap: THREE.Texture } | null, rough: number, color?: number) => {
      const m = new THREE.MeshStandardMaterial({
        map: t?.map ?? null,
        bumpMap: t?.bumpMap ?? null,
        bumpScale: 1.2,
        roughness: rough,
        metalness: 0,
        color: color ?? 0xffffff,
      });
      all.push(m);
      return m;
    };

    // koli malzemeleri
    const wallOuter = mat(withRepeat(outerTex, L / 4, H / 4, aniso), 0.92);
    const sideOuter = mat(withRepeat(outerTex, Wd / 4, H / 4, aniso), 0.92);
    const inner = mat(withRepeat(innerTex, 1, 1, aniso), 0.95, 0xe6ddd2);
    const edge = mat(withRepeat(fluteTex, 0.2, 0.2, aniso), 0.95, 0xd8c8b4);
    const flapLongOuter = mat(withRepeat(outerTex, L / 4, Wd / 8, aniso), 0.92);
    const flapShortOuter = mat(withRepeat(outerTex, Wd / 8, Wd / 4, aniso), 0.92);
    const frontPrint = mat(null, 0.9);
    frontPrint.bumpMap = outerTex.bumpMap;
    frontPrint.bumpScale = 1.2;
    const sidePrint = mat(null, 0.9);
    sidePrint.bumpMap = outerTex.bumpMap;
    sidePrint.bumpScale = 1.2;
    frontPrint.map = printTexture(outerTex.map.image as HTMLCanvasElement, L / H, null, 0);
    sidePrint.map = printTexture(outerTex.map.image as HTMLCanvasElement, Wd / H, null, 0);

    const logo = new Image();
    logo.src = "/logo/mihsan-logo-dark.png";
    logo.onload = () => {
      frontPrint.map?.dispose();
      sidePrint.map?.dispose();
      frontPrint.map = printTexture(outerTex.map.image as HTMLCanvasElement, L / H, logo, 0.62);
      sidePrint.map = printTexture(outerTex.map.image as HTMLCanvasElement, Wd / H, logo, 0.5);
      frontPrint.needsUpdate = sidePrint.needsUpdate = true;
    };

    // ---------- koli
    const box = new THREE.Group();
    const boxMeshes: THREE.Mesh[] = [];
    const add = (geo: THREE.BufferGeometry, mats: THREE.Material | THREE.Material[], parent: THREE.Object3D, pos: [number, number, number]) => {
      const m = new THREE.Mesh(geo, mats);
      m.position.set(...pos);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      boxMeshes.push(m);
      return m;
    };
    // BoxGeometry yüz sırası: +x, -x, +y, -y, +z, -z
    add(new THREE.BoxGeometry(L, H, T), [edge, edge, edge, edge, frontPrint, inner], box, [0, 0, Wd / 2 - T / 2]);
    add(new THREE.BoxGeometry(L, H, T), [edge, edge, edge, edge, inner, wallOuter], box, [0, 0, -(Wd / 2 - T / 2)]);
    add(new THREE.BoxGeometry(T, H, Wd - 2 * T), [sidePrint, inner, edge, edge, edge, edge], box, [L / 2 - T / 2, 0, 0]);
    add(new THREE.BoxGeometry(T, H, Wd - 2 * T), [inner, sideOuter, edge, edge, edge, edge], box, [-(L / 2 - T / 2), 0, 0]);
    add(new THREE.BoxGeometry(L - 2 * T, T, Wd - 2 * T), [edge, edge, inner, wallOuter, edge, edge], box, [0, -H / 2 + T / 2, 0]);

    const pivot = (pos: [number, number, number]) => {
      const g = new THREE.Group();
      g.position.set(...pos);
      box.add(g);
      return g;
    };
    const flapMats = (outer: THREE.Material) => [edge, edge, outer, inner, edge, edge];
    const frontFlap = pivot([0, H / 2, Wd / 2 - T / 2]);
    add(new THREE.BoxGeometry(L, T, Wd / 2), flapMats(flapLongOuter), frontFlap, [0, T * 1.5, -Wd / 4]);
    const backFlap = pivot([0, H / 2, -(Wd / 2 - T / 2)]);
    add(new THREE.BoxGeometry(L, T, Wd / 2), flapMats(flapLongOuter), backFlap, [0, T * 1.5, Wd / 4]);
    const rightFlap = pivot([L / 2 - T / 2, H / 2, 0]);
    add(new THREE.BoxGeometry(Wd / 2, T, Wd - 2 * T), flapMats(flapShortOuter), rightFlap, [-Wd / 4, T / 2, 0]);
    const leftFlap = pivot([-(L / 2 - T / 2), H / 2, 0]);
    add(new THREE.BoxGeometry(Wd / 2, T, Wd - 2 * T), flapMats(flapShortOuter), leftFlap, [Wd / 4, T / 2, 0]);

    // zemindeki yumuşak gölge
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16, transparent: true });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), shadowMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -H / 2 - 0.001;
    ground.receiveShadow = true;
    box.add(ground);
    scene.add(box);

    // ---------- detay: kapağın oluklu kesiti
    const topMat = mat(withRepeat(outerTex, 1.6, 1.05, aniso), 0.93);
    const botMat = mat(withRepeat(botTex, 1.6, 1.05, aniso), 0.95);
    const fluteMat = mat(withRepeat(fluteTex, 0.25, 0.25, aniso), 0.9);
    fluteMat.side = THREE.DoubleSide;

    const board = new THREE.Group();
    const flute = new THREE.Mesh(fluteGeometry(), fluteMat);
    const linerGeo = new THREE.BoxGeometry(BW, LINER, BD);
    const topLiner = new THREE.Mesh(linerGeo, topMat);
    const bottomLiner = new THREE.Mesh(linerGeo, botMat);
    for (const m of [flute, topLiner, bottomLiner]) m.castShadow = m.receiveShadow = true;
    const restY = AMP + SHEET / 2 + LINER / 2;
    board.add(flute, topLiner, bottomLiner);
    board.visible = false;
    scene.add(board);

    const boxMats = [wallOuter, sideOuter, inner, edge, flapLongOuter, flapShortOuter, frontPrint, sidePrint];
    const boardMats = [topMat, botMat, fluteMat];
    const setOpacity = (mats: THREE.MeshStandardMaterial[], o: number) => {
      const tr = o < 0.999;
      for (const m of mats) {
        if (m.transparent !== tr) {
          m.transparent = tr;
          m.needsUpdate = true;
        }
        m.opacity = o;
        m.depthWrite = !tr || o > 0.6;
      }
    };

    // katmanlara işaret noktaları
    const anchorLocal = [
      () => new THREE.Vector3(0.6, topLiner.position.y + LINER / 2, 0.4),
      () => new THREE.Vector3(-BW * 0.18, 0, BD / 2),
      () => new THREE.Vector3(BW * 0.18, bottomLiner.position.y - LINER / 2, BD / 2),
    ];
    const anchors: Anchor[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const v = new THREE.Vector3();

    let narrow = false;
    let aspect = 1;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      aspect = w / h;
      narrow = aspect < 0.9;
      camera.position.z = narrow ? 21 : w / h < 1.3 ? 17 : 15;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    let raf = 0;
    let p = 0;
    let px = 0;
    let py = 0;
    const t0 = performance.now();
    let last = t0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      // kare hızından bağımsız yumuşak takip
      const k = 1 - Math.exp(-dt * 4.5);
      p += (progress.current - p) * k;
      px += (pointer.x - px) * (1 - Math.exp(-dt * 3));
      py += (pointer.y - py) * (1 - Math.exp(-dt * 3));
      const idle = reduce ? 0 : Math.sin(t * 0.35);

      const a = smooth(seg(p, TIMELINE.longFlaps));
      const b = smooth(seg(p, TIMELINE.shortFlaps));
      const z = smooth(seg(p, TIMELINE.zoom));
      const s = smooth(seg(p, TIMELINE.split));

      // --- koli: kapaklar açılır
      frontFlap.rotation.x = a * 3.35;
      backFlap.rotation.x = -a * 3.35;
      rightFlap.rotation.z = -b * 3.25;
      leftFlap.rotation.z = b * 3.25;

      const boxScale = narrow ? Math.min(0.82, aspect * 1.25) : 1;
      const restBoxY = narrow ? -1.7 : -0.15;
      box.scale.setScalar(boxScale * (1 + z * z * 2.4));
      box.rotation.set(0.42 + a * 0.18 + py * 0.06 - z * 0.25, -0.62 + idle * 0.1 + px * 0.12 + z * 0.35, 0);
      box.position.set(0, restBoxY * (1 - z) + (reduce ? 0 : Math.sin(t * 0.8) * 0.04) + z * 1.2, z * 6);
      const boxO = 1 - smooth(clamp01((z - 0.45) / 0.3));
      box.visible = boxO > 0.01;
      setOpacity(boxMats, boxO);
      shadowMat.opacity = 0.16 * boxO;

      // --- kapak kesiti: zoom sonunda belirir, sonra katmanlar ayrılır
      const boardO = smooth(clamp01((z - 0.6) / 0.4));
      board.visible = boardO > 0.01;
      setOpacity(boardMats, boardO);
      board.scale.setScalar((0.6 + 0.4 * z) * Math.min(1, aspect * 1.45));
      board.position.set(0, (reduce ? 0 : Math.sin(t * 0.8) * 0.05), (1 - z) * -3);
      const gap = s * 1.25;
      topLiner.position.y = restY + gap;
      bottomLiner.position.y = -restY - gap;
      board.rotation.set(0.62 - s * 0.42 + py * 0.08, -0.7 + s * 0.48 + idle * 0.12 + px * 0.12, -0.04);

      renderer.render(scene, camera);

      if (frameCb.current) {
        board.updateMatrixWorld();
        const w = el.clientWidth;
        const h = el.clientHeight;
        anchorLocal.forEach((fn, i) => {
          v.copy(fn()).applyMatrix4(board.matrixWorld).project(camera);
          anchors[i].x = ((v.x + 1) / 2) * w;
          anchors[i].y = ((1 - v.y) / 2) * h;
        });
        frameCb.current(anchors, renderer.domElement);
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      all.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      [outerTex, innerTex, fluteTex, botTex].forEach((tx) => {
        tx.map.dispose();
        tx.bumpMap.dispose();
      });
      boxMeshes.forEach((m) => m.geometry.dispose());
      ground.geometry.dispose();
      shadowMat.dispose();
      envTex.dispose();
      pmrem.dispose();
      flute.geometry.dispose();
      linerGeo.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [progress]);

  return <div ref={mount} className="board-scene" aria-hidden="true" />;
}
