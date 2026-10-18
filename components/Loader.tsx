"use client";

import { useEffect, useRef, useState } from "react";

// Logo işaretinin ölçüleri (public/logo/mihsan-mark.png ile aynı oranlar)
const X0 = 15;
const X1 = 340;
const MID = 142;
const AMP = 70;
const PERIODS = 2.5;
const LINE = X1 - X0;

function wave(phase: number, amp = AMP) {
  const n = 90;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = X0 + (LINE * i) / n;
    const y = MID + amp * Math.sin((2 * Math.PI * PERIODS * i) / n - phase);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const MIN_MS = 1400; // çizgilerin gelip dalganın en az bir tur dönmesi için
const MAX_MS = 9000; // model hiç yüklenemezse bile site açılsın

type Stage = "start" | "load" | "out" | "done";

/**
 * Açılış ekranı: üst çizgi sağdan, alt çizgi soldan gelir; ortadaki ondüle "m"
 * 3B koli modeli hazır olana kadar dalgalanır. Çıkışta çizgiler geldikleri yöne
 * çekilir, m yavaşça kaybolur.
 */
export default function Loader() {
  const [stage, setStage] = useState<Stage>("start");
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-loading");
    const t0 = performance.now();
    let raf = 0;
    let finished = false;

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      // dalga sağa doğru akar, genliği hafifçe nefes alır
      const amp = AMP * (0.93 + 0.07 * Math.cos(t * 2.4));
      pathRef.current?.setAttribute("d", wave(t * 4.2, amp));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // ilk boyamadan sonra çizgileri çizmeye başla
    const startRaf = requestAnimationFrame(() => requestAnimationFrame(() => setStage((s) => (s === "start" ? "load" : s))));

    let outTimer = 0;
    let doneTimer = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - t0));
      outTimer = window.setTimeout(() => {
        setStage("out");
        root.classList.remove("is-loading");
        doneTimer = window.setTimeout(() => {
          cancelAnimationFrame(raf);
          setStage("done");
        }, 1100);
      }, wait);
    };

    if (window.__mihsanReady) finish();
    window.addEventListener("mihsan:ready", finish);
    const fallback = window.setTimeout(finish, MAX_MS);

    return () => {
      window.removeEventListener("mihsan:ready", finish);
      clearTimeout(fallback);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(startRaf);
      root.classList.remove("is-loading");
    };
  }, []);

  if (stage === "done") return null;

  return (
    <div className="loader" data-stage={stage} role="status" aria-live="polite">
      <span className="visually-hidden">Yükleniyor</span>
      <svg className="loader__mark" viewBox="0 0 355 304" aria-hidden="true">
        <path className="loader__line loader__line--top" d={`M${X1} 15 H${X0}`} pathLength={1} />
        <path className="loader__line loader__line--bottom" d={`M${X0} 289 H${X1}`} pathLength={1} />
        <g className="loader__wave">
          <path ref={pathRef} d={wave(0)} />
        </g>
      </svg>
    </div>
  );
}
