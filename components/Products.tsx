"use client";

import { useEffect, useRef, useState } from "react";
import {
  CornerArt,
  LockArt,
  OffsetArt,
  PizzaArt,
  RscArt,
  SheetArt,
  ShoeArt,
  TelescopicArt,
  TrayArt,
} from "./ProductArt";

const products = [
  { id: "koli", name: "A box koli", art: <RscArt />, text: "Dört kapaklı standart koli. Sevkiyatın en yaygın ve en ekonomik ambalajı.", specs: ["Tek ve çift oluklu", "Ölçüye göre", "Baskılı ya da sade"] },
  { id: "ofset", name: "Ofset kutu", art: <OffsetArt />, text: "Çok renkli ofset baskılı, raf ve vitrinde markanızı taşıyan ürün kutusu.", specs: ["Ofset baskı", "Lak ve selefon", "Mikro oluk"] },
  { id: "tava", name: "Tava", art: <TrayArt />, text: "Üstü açık tepsi. Meyve sebze, ara katman ve mağaza sergilemesi için.", specs: ["İstiflenebilir köşe", "Havalandırma deliği", "Gıdaya uygun kâğıt"] },
  { id: "teleskopik", name: "Teleskopik kutu", art: <TelescopicArt />, text: "Taban ve kapağı ayrı iki parça. Ağır ve hacimli ürünler için sağlam yapı.", specs: ["Tam ya da yarım kapak", "Yüksek istif gücü", "Yeniden kullanılabilir"] },
  { id: "ayakkabi", name: "Ayakkabı kutusu", art: <ShoeArt />, text: "Kapaklı, köşeleri sağlam ayakkabı ve tekstil kutusu.", specs: ["Baskılı kapak", "Etiket alanı", "Seri üretim"] },
  { id: "kilitli", name: "Kilitli kutu", art: <LockArt />, text: "Dibi tek hareketle kilitlenen, bant gerektirmeden hızla kurulan kutu.", specs: ["Otomatik kilitli dip", "Hızlı kurulum", "Bantsız"] },
  { id: "pizza", name: "Pizza kutusu", art: <PizzaArt />, text: "Gıdayla temasa uygun kâğıttan, buhar delikli pizza kutusu.", specs: ["Gıdaya uygun", "Buhar delikleri", "Farklı çaplar"] },
  { id: "kosebent", name: "Köşebent", art: <CornerArt />, text: "Palet ve koli köşelerini çember baskısına ve darbeye karşı koruyan karton profil.", specs: ["İstenen boy", "Farklı kalınlıklar", "Geri dönüştürülebilir"] },
  { id: "ondule", name: "Ondüle", art: <SheetArt />, text: "Sarma, ara katman ve dolgu için rulo ya da tabaka oluklu karton.", specs: ["Rulo ve tabaka", "Farklı dalga tipleri", "Hassas yüzeyler için"] },
];

export default function Products() {
  const rail = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ p: 0, start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setPos({ p: max > 0 ? el.scrollLeft / max : 0, start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // fareyle sürükleyerek kaydırma (dokunmatikte tarayıcı zaten yapıyor)
    let down = false;
    let sx = 0;
    let sl = 0;
    let moved = false;
    const pd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      sx = e.clientX;
      sl = el.scrollLeft;
    };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4 && !moved) {
        moved = true;
        el.classList.add("rail--drag");
      }
      if (moved) el.scrollLeft = sl - dx;
    };
    const pu = () => {
      if (!down) return;
      down = false;
      el.classList.remove("rail--drag");
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      el.removeEventListener("click", click, true);
    };
  }, []);

  const step = (dir: number) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".pcard");
    const w = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * w * (el.clientWidth > 900 ? 2 : 1), behavior: "smooth" });
  };

  return (
    <section id="urunler" className="products">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-title">Ne üretiyoruz</h2>
          <p className="section-lead">
            Standart koliden ofset baskılı ürün kutusuna, köşebentten ondüleye. Her ürünü ölçü, yük ve
            sevkiyat koşuluna göre birlikte netleştiriyoruz.
          </p>
        </header>
      </div>

      <div className="rail" ref={rail} role="list" aria-label="Ürünler">
        {products.map((p) => (
          <article key={p.id} id={p.id} className="pcard" role="listitem">
            <div className="pcard__art">{p.art}</div>
            <div className="pcard__body">
              <h3 className="pcard__name">{p.name}</h3>
              <p className="pcard__text">{p.text}</p>
              <ul className="pcard__specs">
                {p.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="wrap rail-controls">
        <div className="rail-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${0.12 + pos.p * 0.88})` }} />
        </div>
        <span className="rail-count">{products.length} ürün</span>
        <div className="rail-buttons">
          <button className="rail-btn" onClick={() => step(-1)} disabled={pos.start} aria-label="Önceki ürünler">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
          </button>
          <button className="rail-btn" onClick={() => step(1)} disabled={pos.end} aria-label="Sonraki ürünler">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
