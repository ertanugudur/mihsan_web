"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Anchor = { x: number; y: number };

/** Scroll zaman çizelgesi (0–1) */
export const TIMELINE = {
  longFlaps: [0.04, 0.24],
  shortFlaps: [0.14, 0.34],
  focus: [0.38, 0.64], // ön kapak ortaya gelir, gerisi kaybolur
  split: [0.66, 0.88], // kapak 3 katmana ayrılır
  labels: 0.8,
} as const;

type Props = {
  progress: React.MutableRefObject<number>;
  /** Her karede katmanların ekran konumları (canvas'a göre px): dış, oluk, iç */
  onFrame?: (anchors: Anchor[], canvas: HTMLCanvasElement) => void;
};

// ---------- koli ölçüleri
const L = 4.2; // en (x)
const H = 2.7; // gövde yüksekliği (y)
const Wd = 3.0; // boy (z)
const T = 0.09; // mukavva kalınlığı
const FLAP = Wd / 2; // kapak boyu

// ---------- renkler (düz kraft)
const C = {
  outer: 0xb5824d,
  inner: 0xa97845,
  edge: 0xcaa275,
  flute: 0xbb8d5a,
  innerLiner: 0xa3733f,
};

// ---------- ön kapağın oluklu yapısı (detay ölçeğinde kurulur, kapağa ölçeklenir)
const BW = 6.4; // kapak eni
const BD = (BW * FLAP) / L; // kapak boyu, gerçek oranla
const PERIOD = 0.58;
const AMP = 0.3;
const SHEET = 0.045;
const LINER = 0.07;
const REST = AMP + SHEET / 2 + LINER / 2; // liner merkezlerinin kapalı konumu
const THICK = 2 * REST + LINER; // detay kalınlığı

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

/** Düz kraft zemine flekso baskı gibi logo */
function printTexture(aspect: number, logo: HTMLImageElement | null) {
  const w = 1024;
  const h = Math.round(w / aspect);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b5824d";
  g.fillRect(0, 0, w, h);
  if (logo && logo.naturalWidth) {
    const lw = w * 0.6;
    const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    const ink = document.createElement("canvas");
    ink.width = Math.round(lw);
    ink.height = Math.round(lh);
    const ig = ink.getContext("2d")!;
    ig.drawImage(logo, 0, 0, lw, lh);
    ig.globalCompositeOperation = "source-in";
    ig.fillStyle = "rgb(36,25,15)";
    ig.fillRect(0, 0, lw, lh);
    g.globalAlpha = 0.88;
    g.drawImage(ink, (w - lw) / 2, (h - lh) / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Yerel aralıklarla kutu geometrisi: x0..x1, y0..y1, z0..z1 */
function slab(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
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
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.3;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.4, 15);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc2, 0.75));
    const key = new THREE.DirectionalLight(0xfff6ea, 2.6);
    key.position.set(5, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -8;
    key.shadow.camera.right = key.shadow.camera.top = 8;
    key.shadow.radius = 5;
    key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c0, 0.8);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    // ---------- malzemeler
    const all: THREE.MeshStandardMaterial[] = [];
    const mat = (color: number, rough = 0.86) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
      all.push(m);
      return m;
    };
    const outer = mat(C.outer);
    const inner = mat(C.inner, 0.9);
    const edge = mat(C.edge, 0.9);
    const print = mat(0xffffff);
    print.map = printTexture(L / H, null);

    const logo = new Image();
    logo.src = "/logo/mihsan-logo-dark.png";
    logo.onload = () => {
      print.map?.dispose();
      print.map = printTexture(L / H, logo);
      print.needsUpdate = true;
    };

    // ---------- koli gövdesi (soluklaşacak parçalar)
    const box = new THREE.Group();
    scene.add(box);
    const fading: THREE.Mesh[] = [];
    const add = (geo: THREE.BufferGeometry, mats: THREE.Material | THREE.Material[], parent: THREE.Object3D) => {
      const m = new THREE.Mesh(geo, mats);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      fading.push(m);
      return m;
    };
    // BoxGeometry yüz sırası: +x, -x, +y, -y, +z, -z
    const top = H / 2 + T; // uzun kenar duvarları kısa kapakları da örter
    add(slab(-L / 2, L / 2, -H / 2, top, Wd / 2 - T, Wd / 2), [edge, edge, edge, edge, print, inner], box); // ön
    add(slab(-L / 2, L / 2, -H / 2, top, -Wd / 2, -Wd / 2 + T), [edge, edge, edge, edge, inner, outer], box); // arka
    add(slab(L / 2 - T, L / 2, -H / 2, H / 2, -Wd / 2 + T, Wd / 2 - T), [outer, inner, edge, edge, edge, edge], box); // sağ
    add(slab(-L / 2, -L / 2 + T, -H / 2, H / 2, -Wd / 2 + T, Wd / 2 - T), [inner, outer, edge, edge, edge, edge], box); // sol
    add(slab(-L / 2 + T, L / 2 - T, -H / 2, -H / 2 + T, -Wd / 2 + T, Wd / 2 - T), [edge, edge, inner, outer, edge, edge], box); // taban

    // kapaklar: menteşe = duvarın üst dış kenarı; kapalıyken dış yüz yukarıda
    const hinge = (pos: [number, number, number]) => {
      const g = new THREE.Group();
      g.position.set(...pos);
      box.add(g);
      return g;
    };
    const flapMats = [edge, edge, outer, inner, edge, edge];
    const SEAM = 0.012; // uzun kapakların ortada birleştiği ince çizgi
    const frontHinge = hinge([0, top, Wd / 2]);
    const backHinge = hinge([0, top, -Wd / 2]);
    add(slab(-L / 2, L / 2, -T, 0, 0, FLAP - SEAM), flapMats, backHinge);
    const rightHinge = hinge([L / 2, H / 2, 0]);
    add(slab(-FLAP, 0, -T, 0, -Wd / 2 + T, Wd / 2 - T), flapMats, rightHinge);
    const leftHinge = hinge([-L / 2, H / 2, 0]);
    add(slab(0, FLAP, -T, 0, -Wd / 2 + T, Wd / 2 - T), flapMats, leftHinge);

    // ön kapağın koli üzerindeki yeri (ölçek ve yön kaynağı)
    const frontSlot = new THREE.Object3D();
    frontSlot.position.set(0, -T / 2, -(FLAP - SEAM) / 2);
    frontHinge.add(frontSlot);

    // zemin gölgesi
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16, transparent: true });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), shadowMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -H / 2 - 0.001;
    ground.receiveShadow = true;
    box.add(ground);

    // ---------- ön kapak: dış kâğıt + oluk + iç kâğıt (hiç soluklaşmaz)
    const flap = new THREE.Group();
    flap.matrixAutoUpdate = false;
    scene.add(flap);
    const fluteMat = mat(C.flute);
    fluteMat.side = THREE.DoubleSide;
    const linerGeo = new THREE.BoxGeometry(BW, LINER, BD);
    const outerLiner = new THREE.Mesh(linerGeo, [edge, edge, outer, outer, edge, edge]);
    const fluteMesh = new THREE.Mesh(fluteGeometry(), fluteMat);
    const innerLiner = new THREE.Mesh(linerGeo, [edge, edge, mat(C.innerLiner), mat(C.innerLiner), edge, edge]);
    for (const m of [outerLiner, fluteMesh, innerLiner]) {
      m.castShadow = m.receiveShadow = true;
      flap.add(m);
    }

    const fadeMats = [outer, inner, edge, print];
    const setBoxOpacity = (o: number) => {
      const tr = o < 0.999;
      for (const m of fadeMats) {
        if (m.transparent !== tr) {
          m.transparent = tr;
          m.needsUpdate = true;
        }
        m.opacity = o;
        m.depthWrite = !tr;
      }
      shadowMat.opacity = 0.16 * o;
      for (const m of fading) m.visible = o > 0.01;
    };
    // kapağın kendi malzemeleri soluklaşmamalı: aynı malzemeyi paylaşanları ayır
    const flapOuter = outer.clone();
    const flapEdge = edge.clone();
    all.push(flapOuter, flapEdge);
    outerLiner.material = [flapEdge, flapEdge, flapOuter, flapOuter, flapEdge, flapEdge];
    (innerLiner.material as THREE.Material[]).splice(0, 2, flapEdge, flapEdge);
    (innerLiner.material as THREE.Material[]).splice(4, 2, flapEdge, flapEdge);

    // katmanlara işaret noktaları (kapak yerel koordinatı)
    const anchorLocal = [
      () => new THREE.Vector3(BW * 0.12, outerLiner.position.y + LINER / 2, BD * 0.1),
      () => new THREE.Vector3(-BW * 0.2, 0, BD / 2),
      () => new THREE.Vector3(BW * 0.18, innerLiner.position.y - LINER / 2, BD / 2),
    ];
    const anchors: Anchor[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const v = new THREE.Vector3();

    // ---------- ekran düzeni
    let aspect = 1;
    let boxX = 0;
    let boxY = 0;
    let boxScale = 1;
    let flapScale = 1;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      const narrow = aspect < 0.9;
      camera.position.z = narrow ? 21 : aspect < 1.3 ? 17 : 15;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      // kapalı koli: masaüstünde metnin sağında, dar ekranda metnin altında
      boxX = aspect > 1.3 ? 2.5 : aspect > 0.9 ? 1.6 : 0;
      boxY = narrow ? -2.0 : -0.2;
      boxScale = narrow ? Math.min(0.8, aspect * 1.25) : aspect > 1.3 ? 1 : 0.85;
      // ayrılmış kapak her ekranda ortada ve sığacak boyutta
      flapScale = Math.min(1, aspect * 1.45) * (aspect > 1.3 ? 0.95 : 1);
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

    // geçiş hesapları için geçici nesneler
    const sPos = new THREE.Vector3();
    const sQuat = new THREE.Quaternion();
    const sScl = new THREE.Vector3();
    const ePos = new THREE.Vector3();
    const eQuat = new THREE.Quaternion();
    const eScl = new THREE.Vector3();
    const euler = new THREE.Euler();
    const slotScale = new THREE.Vector3(L / BW, T / THICK, (FLAP - SEAM) / BD);
    const tmpM = new THREE.Matrix4();

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
      p += (progress.current - p) * (1 - Math.exp(-dt * 4.5));
      px += (pointer.x - px) * (1 - Math.exp(-dt * 3));
      py += (pointer.y - py) * (1 - Math.exp(-dt * 3));
      const idle = reduce ? 0 : Math.sin(t * 0.35);
      const bob = reduce ? 0 : Math.sin(t * 0.8) * 0.04;

      const a = smooth(seg(p, TIMELINE.longFlaps));
      const b = smooth(seg(p, TIMELINE.shortFlaps));
      const f = smooth(seg(p, TIMELINE.focus));
      const s = smooth(seg(p, TIMELINE.split));

      // --- koli: kapaklar menteşelerinden açılır
      frontHinge.rotation.x = a * 3.4;
      backHinge.rotation.x = -a * 3.4;
      rightHinge.rotation.z = -b * 3.3;
      leftHinge.rotation.z = b * 3.3;

      // koli odak sırasında hafifçe geri çekilir ve kaybolur
      box.scale.setScalar(boxScale * (1 - f * 0.12));
      box.rotation.set(0.42 + a * 0.12 + py * 0.05, -0.62 + idle * 0.1 + px * 0.1, 0);
      box.position.set(boxX * (1 - b * 0.55) * (1 - f * 0.3), boxY * (1 - b * 0.35) + bob - f * 0.6, -f * 1.5);
      box.updateMatrixWorld(true);
      setBoxOpacity(1 - smooth(clamp01((f - 0.05) / 0.6)));

      // --- ön kapak: koli üzerindeki yerinden ekranın ortasına
      frontSlot.updateWorldMatrix(true, false);
      frontSlot.matrixWorld.decompose(sPos, sQuat, sScl);
      sScl.multiply(slotScale);

      ePos.set(0, bob * 1.2, 0);
      euler.set(0.58 - s * 0.36 + py * 0.06, -0.62 + s * 0.42 + idle * 0.1 + px * 0.1, -0.04);
      eQuat.setFromEuler(euler);
      eScl.setScalar(flapScale);

      // kapak önce menteşeden kalkar, sonra ortaya süzülür
      const fe = smooth(f);
      const pos = sPos.clone().lerp(ePos, fe);
      pos.y += Math.sin(fe * Math.PI) * 0.8; // hafif yay çizerek gelsin
      const quat = sQuat.clone().slerp(eQuat, fe);
      const scl = sScl.clone().lerp(eScl, fe);
      tmpM.compose(pos, quat, scl);
      flap.matrix.copy(tmpM);
      flap.matrixWorldNeedsUpdate = true;

      // --- katmanlar ayrılır
      const gap = s * (aspect < 0.9 ? 2.1 : 1.25);
      outerLiner.position.y = REST + gap;
      innerLiner.position.y = -REST - gap;

      renderer.render(scene, camera);

      if (frameCb.current) {
        flap.updateMatrixWorld(true);
        const w = el.clientWidth;
        const h = el.clientHeight;
        anchorLocal.forEach((fn, i) => {
          v.copy(fn()).applyMatrix4(flap.matrixWorld).project(camera);
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
      fading.forEach((m) => m.geometry.dispose());
      ground.geometry.dispose();
      shadowMat.dispose();
      fluteMesh.geometry.dispose();
      linerGeo.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [progress]);

  return <div ref={mount} className="board-scene" aria-hidden="true" />;
}
