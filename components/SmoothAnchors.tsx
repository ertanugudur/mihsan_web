"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __autoScroll?: boolean;
  }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Sayfa içi bağlantılarda yavaş, yumuşak kaydırma.
 * Kaydırma sırasında window.__autoScroll true olur; koli animasyonu bu sırada
 * ara karelere takılmaz, kendi yerinde kalır.
 */
export default function SmoothAnchors() {
  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cancel = (interrupted = false) => {
      cancelAnimationFrame(raf);
      window.__autoScroll = false;
      window.dispatchEvent(new CustomEvent("autoscrollend", { detail: { interrupted } }));
    };

    const scrollTo = (targetY: number) => {
      cancelAnimationFrame(raf);
      const startY = window.scrollY;
      const dist = targetY - startY;
      if (Math.abs(dist) < 2) return;
      if (reduce) {
        window.scrollTo(0, targetY);
        return;
      }
      // mesafeye göre süre: kısa yollar ~0.9 sn, uzun yollar en fazla ~1.8 sn
      const duration = Math.min(1800, 900 + Math.abs(dist) * 0.12);
      const t0 = performance.now();
      window.__autoScroll = true;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, startY + dist * ease(t));
        if (t < 1) raf = requestAnimationFrame(step);
        else cancel();
      };
      raf = requestAnimationFrame(step);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target && id !== "top" && id !== "") return;
      e.preventDefault();
      const y = target && id !== "top" ? target.getBoundingClientRect().top + window.scrollY : 0;
      // menü kapanırken kaydırma kilidinin kalkmasını bekle
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(Math.max(0, y))));
      history.replaceState(null, "", id ? `#${id}` : location.pathname);
    };

    // kullanıcı tekerlek ya da dokunmayla araya girerse otomatik kaydırmayı bırak
    const interrupt = () => window.__autoScroll && cancel(true);

    document.addEventListener("click", onClick);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
