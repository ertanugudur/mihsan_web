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

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = t.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0: yazının üstü ekranın altında, 1: yazı tamamen görünür
      const p = reduce ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (r.height + 40)));
      letters.current.forEach((el, i) => {
        if (!el) return;
        const local = Math.min(1, Math.max(0, (p * 1.55 - i * 0.11) / 0.55));
        const e = 1 - Math.pow(1 - local, 3);
        el.style.transform = `translate3d(0, ${((1 - e) * 105).toFixed(2)}%, 0) rotate(${((1 - e) * 9).toFixed(2)}deg)`;
        el.style.opacity = String(0.15 + e * 0.85);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
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
