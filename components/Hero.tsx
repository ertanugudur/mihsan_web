"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const BoardScene = dynamic(() => import("./BoardScene"), { ssr: false });

const layers = [
  { id: "top", title: "Dış yüzey", text: "Baskıyı taşıyan, nemi ve sürtünmeyi karşılayan kâğıt." },
  { id: "mid", title: "Oluk", text: "Dalga formu darbeyi emer, kolinin istif gücünü verir." },
  { id: "bot", title: "İç yüzey", text: "Ürüne temas eden, oluğu yerinde tutan kâğıt." },
];

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const v = Math.min(1, Math.max(0, -r.top / Math.max(travel, 1)));
      progress.current = v;
      setStage(v > 0.35 ? 1 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={section} className="hero" data-stage={stage}>
      <div className="hero__sticky">
        <BoardScene progress={progress} />

        <div className="hero__intro">
          <h1 className="hero__title">
            Her ürün kendi ölçüsünde bir koliyi hak eder.
          </h1>
          <p className="hero__lead">
            Karton kutu, köşebent ve ondüle üretiyoruz. Ürününüzün ağırlığına, ölçüsüne ve
            yolculuğuna göre.
          </p>
          <div className="hero__actions">
            <a className="btn btn--solid" href="#teklif">Teklif iste</a>
            <a className="btn btn--ghost" href="#urunler">Ürünleri incele</a>
          </div>
        </div>

        <ol className="hero__layers" aria-label="Oluklu kartonun katmanları">
          {layers.map((l) => (
            <li key={l.id} className={`hero__layer hero__layer--${l.id}`}>
              <span className="hero__layer-title">{l.title}</span>
              <span className="hero__layer-text">{l.text}</span>
            </li>
          ))}
        </ol>

        <p className="hero__hint" aria-hidden="true">Kaydırın, kolinin içine bakın</p>
      </div>
    </section>
  );
}
