"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Anchor } from "./BoardScene";
import { TIMELINE } from "./BoardScene";

const BoardScene = dynamic(() => import("./BoardScene"), { ssr: false });

const layers = [
  { id: "top", title: "Dış yüzey", text: "Baskıyı taşıyan, nemi ve sürtünmeyi karşılayan kâğıt.", short: "Baskıyı taşır, nemi karşılar." },
  { id: "mid", title: "Oluk", text: "Dalga formu darbeyi emer, kolinin istif gücünü verir.", short: "Darbeyi emer, istif gücü verir." },
  { id: "bot", title: "İç yüzey", text: "Ürüne temas eden, oluğu yerinde tutan kâğıt.", short: "Ürüne temas eder, oluğu tutar." },
] as const;

// Mobil etiketlerin katmana göre yerleşimi
const placement = ["above", "side", "below"] as const;
const GAP = 16; // ok ucu ile katman arası
const EDGE = 14; // ekran kenarı boşluğu

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const pins = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(0);
  const mobile = useRef(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const sync = () => (mobile.current = mq.matches);
    sync();
    mq.addEventListener("change", sync);

    const onScroll = () => {
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const v = Math.min(1, Math.max(0, -r.top / Math.max(travel, 1)));
      progress.current = v;
      setPhase(v < TIMELINE.zoom[0] - 0.02 ? 0 : v < TIMELINE.split[0] + 0.1 ? 1 : 2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // 3D katman konumlarını ekrandaki etiketlere aktar (yalnızca mobil)
  const onFrame = useCallback((anchors: Anchor[], canvas: HTMLCanvasElement) => {
    if (!mobile.current || !sticky.current) return;
    const box = sticky.current.getBoundingClientRect();
    const cv = canvas.getBoundingClientRect();
    const ox = cv.left - box.left;
    const oy = cv.top - box.top;
    const W = box.width;

    const Hh = box.height;
    const topLimit = 84; // header altı
    const botLimit = Hh - 12;

    anchors.forEach((a, i) => {
      const el = pins.current[i];
      if (!el) return;
      const ax = a.x + ox;
      const ay = a.y + oy;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let place: string = placement[i];
      // dikeyde sığmıyorsa yana geç
      if (place === "above" && ay - h - GAP < topLimit) place = "side";
      if (place === "below" && ay + GAP + h > botLimit) place = "side";
      let x: number;
      let y: number;
      let dir: string;
      if (place === "side") {
        const leftFits = ax - w - GAP >= EDGE;
        x = leftFits ? ax - w - GAP : Math.min(W - w - EDGE, ax + GAP);
        dir = leftFits ? "right" : "left";
        y = Math.min(botLimit - h, Math.max(topLimit, ay - h / 2));
        el.style.setProperty("--ay", `${Math.min(h - 14, Math.max(14, ay - y))}px`);
      } else {
        x = Math.min(W - w - EDGE, Math.max(EDGE, ax - w / 2));
        y = place === "above" ? ay - h - GAP : ay + GAP;
        dir = place === "above" ? "down" : "up";
        el.style.setProperty("--ax", `${Math.min(w - 18, Math.max(18, ax - x))}px`);
      }
      el.dataset.dir = dir;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }, []);

  return (
    <section ref={section} className="hero" data-phase={phase}>
      <div ref={sticky} className="hero__sticky">
        <BoardScene progress={progress} onFrame={onFrame} />

        <div className="hero__intro">
          <h1 className="hero__title">Her ürün kendi ölçüsünde bir koliyi hak eder.</h1>
          <p className="hero__lead">
            Karton kutu, köşebent ve ondüle üretiyoruz. Ürününüzün ağırlığına, ölçüsüne ve
            yolculuğuna göre.
          </p>
          <div className="hero__actions">
            <a className="btn btn--solid" href="#teklif">Teklif iste</a>
            <a className="btn btn--ghost" href="#urunler">Ürünleri incele</a>
          </div>
        </div>

        {/* masaüstü: modelin solunda liste */}
        <ol className="hero__layers" aria-label="Oluklu kartonun katmanları">
          {layers.map((l) => (
            <li key={l.id} className={`hero__layer hero__layer--${l.id}`}>
              <span className="hero__layer-title">{l.title}</span>
              <span className="hero__layer-text">{l.text}</span>
            </li>
          ))}
        </ol>

        {/* mobil: her katmana okla işaret eden etiketler */}
        <div className="hero__pins" aria-hidden="true">
          {layers.map((l, i) => (
            <div
              key={l.id}
              ref={(el) => {
                pins.current[i] = el;
              }}
              className="pin"
              style={{ ["--i" as string]: i }}
            >
              <div className="pin__card">
                <span className="pin__title">{l.title}</span>
                <span className="pin__text">{l.short}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="hero__hint" aria-hidden="true">Kaydırın, koliyi açalım</p>
      </div>
    </section>
  );
}
