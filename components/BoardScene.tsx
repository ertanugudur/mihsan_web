"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  /** 0 → kapalı pano, 1 → katmanlar ayrılmış */
  progress: React.MutableRefObject<number>;
};

const W = 6.4; // panel genişliği (dalga yönü)
const D = 4.2; // panel derinliği
const PERIOD = 0.58;
const AMP = 0.3;
const SHEET = 0.05;
const LINER = 0.07;

function fluteGeometry() {
  const shape = new THREE.Shape();
  const steps = 360;
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

export default function BoardScene({ progress }: Props) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.6, 15);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6ba, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c0, 0.9);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    const kraft = (hex: number, rough = 0.85) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 });

    const board = new THREE.Group();
    const flute = new THREE.Mesh(fluteGeometry(), kraft(0xb07d46));
    const linerGeo = new THREE.BoxGeometry(W, LINER, D);
    const topLiner = new THREE.Mesh(linerGeo, kraft(0xc99a63, 0.9));
    const bottomLiner = new THREE.Mesh(linerGeo, kraft(0x9c6c3a, 0.9));
    const restY = AMP + SHEET / 2 + LINER / 2;
    topLiner.position.y = restY;
    bottomLiner.position.y = -restY;
    board.add(flute, topLiner, bottomLiner);
    scene.add(board);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // dar ekranlarda paneli sığdırmak için kamerayı geri çek
      camera.position.z = w / h < 0.9 ? 22 : w / h < 1.3 ? 17 : 15;
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
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      flute.geometry.dispose();
      linerGeo.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [progress]);

  return <div ref={mount} className="board-scene" aria-hidden="true" />;
}
