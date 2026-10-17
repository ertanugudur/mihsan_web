"use client";

import { useEffect, useRef } from "react";

const WORD = "mihsan";

export default function FooterWord() {
  const wrap = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const box = wrap.current;
    const t = text.current;
    if (!box || !t) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // yazıyı kapsayıcının tam genişliğine sığdır
    const fit = () => {
      t.style.fontSize = "100px";
      const natural = t.scrollWidth;
      if (natural > 0) t.style.fontSize = `${(100 * box.clientWidth) / natural}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    // hedef ilerleme scroll'dan gelir, gösterilen değer ona yavaşça yaklaşır
    let target = 0;
    let shown = reduce ? 1 : 0;
    let raf = 0;
    const DUR = 0.42; // her harfin süresi (ilerleme biriminde)
    const STAG = (1 - DUR) / (WORD.length - 1); // harfler arası gecikme
    const measure = () => {
      const r = t.getBoundingClientRect();
      const vh = window.innerHeight;
      // yazının üstü ekranın altına girdiğinde başlar, sayfa sonuna gelince biter
      const absTop = r.top + window.scrollY;
      const travel = Math.max(1, document.documentElement.scrollHeight - absTop - 8);
      target = reduce ? 1 : Math.min(1, Math.max(0, (vh - r.top) / travel));
    };
    const paint = () => {
      letters.current.forEach((el, i) => {
        if (!el) return;
        const local = Math.min(1, Math.max(0, (shown - i * STAG) / DUR));
        const e = 1 - Math.pow(1 - local, 3);
        el.style.transform = `translate3d(0, ${((1 - e) * 150).toFixed(2)}%, 0) rotate(${((1 - e) * 9).toFixed(2)}deg)`;
        el.style.opacity = String(0.1 + e * 0.9);
      });
    };
    const loop = () => {
      shown += (target - shown) * 0.06;
      paint();
      raf = Math.abs(target - shown) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    const onScroll = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(loop);
    };
    measure();
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={wrap} className="footer__word" aria-hidden="true">
      <span ref={text} className="footer__word-text">
        {WORD.split("").map((ch, i) => (
          <span key={i} className="footer__letter-clip">
            <span
              ref={(el) => {
                letters.current[i] = el;
              }}
              className="footer__letter"
            >
              {ch}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
