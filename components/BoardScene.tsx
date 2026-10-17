"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeKraft, withRepeat } from "./kraftTexture";

export type Anchor = { x: number; y: number };

type Props = {
  /** 0 → kapalı pano, 1 → katmanlar ayrılmış */
  progress: React.MutableRefObject<number>;
  /** Her karede katmanların ekran konumlarını (canvas'a göre px) bildirir: üst, oluk, alt */
  onFrame?: (anchors: Anchor[], canvas: HTMLCanvasElement) => void;
};

const W = 6.4; // panel genişliği (dalga yönü)
const D = 4.2; // panel derinliği
const PERIOD = 0.58;
const AMP = 0.3;
const SHEET = 0.045;
const LINER = 0.07;

function fluteGeometry() {
  const shape = new THREE.Shape();
  const steps = 420;
  const top: THREE.Vector2[] = [];
  const bottom: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = -W / 2 + (W * i) / steps;
    const y = AMP * Math.sin((2 * Math.PI * x) / PERIOD);
    top.push(new THREE.Vector2(x, y + SHEET / 2));
    bottom.push(new THREE.Vector2(x, y - SHEET / 2));
  }
  shape.moveTo(top[0].x, top[0].y);
  top.forEach((p) => shape.lineTo(p.x, p.y));
  for (let i = bottom.length - 1; i >= 0; i--) shape.lineTo(bottom[i].x, bottom[i].y);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -D / 2);
  geo.computeVertexNormals();
  return geo;
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
    renderer.toneMappingExposure = 0.92;
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
    key.position.set(5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -6;
    key.shadow.camera.right = key.shadow.camera.top = 6;
    key.shadow.radius = 4;
    key.shadow.bias = -0.0008;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c0, 0.8);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    // --- dokular
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const topTex = makeKraft(1024, { base: [178, 128, 76], spread: 30 }, 11);
    const botTex = makeKraft(1024, { base: [150, 104, 60], spread: 26 }, 23);
    const fluteTex = makeKraft(512, { base: [168, 118, 68], spread: 24 }, 37);

    const paper = (t: { map: THREE.Texture; bumpMap: THREE.Texture }, rough: number) =>
      new THREE.MeshStandardMaterial({
        map: t.map,
        bumpMap: t.bumpMap,
        bumpScale: 1.2,
        roughness: rough,
        metalness: 0,
      });

    const topMat = paper(withRepeat(topTex, 1.6, 1.05, aniso), 0.93);
    const botMat = paper(withRepeat(botTex, 1.6, 1.05, aniso), 0.95);
    // ExtrudeGeometry UV'leri dünya biriminde: 1 doku ≈ 4 birim
    const fluteMat = paper(withRepeat(fluteTex, 0.25, 0.25, aniso), 0.9);
    fluteMat.side = THREE.DoubleSide;

    const board = new THREE.Group();
    const flute = new THREE.Mesh(fluteGeometry(), fluteMat);
    const linerGeo = new THREE.BoxGeometry(W, LINER, D);
    const topLiner = new THREE.Mesh(linerGeo, topMat);
    const bottomLiner = new THREE.Mesh(linerGeo, botMat);
    for (const m of [flute, topLiner, bottomLiner]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    const restY = AMP + SHEET / 2 + LINER / 2;
    topLiner.position.y = restY;
    bottomLiner.position.y = -restY;
    board.add(flute, topLiner, bottomLiner);
    scene.add(board);

    // katmanlara işaret noktaları (pano koordinatında)
    const anchorLocal = [
      () => new THREE.Vector3(0.6, topLiner.position.y + LINER / 2, 0.4),
      () => new THREE.Vector3(-W * 0.18, 0, D / 2),
      () => new THREE.Vector3(W * 0.2, bottomLiner.position.y - LINER / 2, D / 2),
    ];
    const anchors: Anchor[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    const v = new THREE.Vector3();

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // dar ekranlarda paneli sığdırmak için kamerayı geri çek
      camera.position.z = w / h < 0.9 ? 21 : w / h < 1.3 ? 17 : 15;
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
    let rx = 0.62;
    let ry = -0.7;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = (performance.now() - t0) / 1000;
      p += (progress.current - p) * 0.08;
      const e = p * p * (3 - 2 * p);

      const gap = e * 1.25;
      topLiner.position.y = restY + gap;
      bottomLiner.position.y = -restY - gap;

      const idle = reduce ? 0 : Math.sin(t * 0.35) * 0.12;
      const targetRx = 0.62 - e * 0.42 + pointer.y * 0.08;
      const targetRy = -0.7 + e * 0.48 + idle + pointer.x * 0.12;
      rx += (targetRx - rx) * 0.06;
      ry += (targetRy - ry) * 0.06;
      board.rotation.set(rx, ry, -0.04);
      board.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.05;

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
      [topMat, botMat, fluteMat].forEach((m) => {
        m.map?.dispose();
        m.bumpMap?.dispose();
        m.dispose();
      });
      [topTex, botTex, fluteTex].forEach((t) => {
        t.map.dispose();
        t.bumpMap.dispose();
      });
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
