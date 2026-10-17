"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/site";

// ince, sık dalgalı ondüle şeridi (iki kâğıt arasında oluk)
const STRIP = (() => {
  const period = 13;
  let d = "";
  for (let x = 2; x <= 418; x += 0.5) {
    const y = 20 - 14 * Math.sin((2 * Math.PI * (x - 2)) / period - Math.PI / 2);
    d += `${x === 2 ? "M" : "L"}${x} ${y.toFixed(2)}`;
  }
  return d;
})();

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // geniş ekrana geçilirse menüyü kapat
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        <div className="header__inner">
          <a href="#top" className="header__logo" aria-label="Mihsan Ambalaj ana sayfa">
            <Image src="/logo/mihsan-logo-dark.png" alt="Mihsan Ambalaj" width={1400} height={401} priority />
          </a>
          <nav className="header__nav" aria-label="Ana menü">
            {nav.map((n) => (
              <a key={n.href} href={n.href}>{n.label}</a>
            ))}
            <a href="#teklif" className="btn btn--solid header__cta">Teklif iste</a>
          </nav>
          <button
            ref={toggleRef}
            className={`burger${open ? " burger--open" : ""}`}
            aria-expanded={open}
            aria-controls="mobil-menu"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`drawer${open ? " drawer--open" : ""}`} aria-hidden={!open}>
        <button className="drawer__scrim" tabIndex={-1} aria-label="Menüyü kapat" onClick={close} />
        <div
          ref={panelRef}
          id="mobil-menu"
          className="drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menü"
        >
          <nav className="drawer__nav" aria-label="Mobil menü">
            {nav.map((n, i) => (
              <a key={n.href} href={n.href} onClick={close} style={{ transitionDelay: open ? `${120 + i * 50}ms` : "0ms" }}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="drawer__foot">
            <a href="#teklif" className="btn btn--solid" onClick={close}>Teklif iste</a>
            {site.phone && <a className="drawer__contact" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>}
            {site.email && <a className="drawer__contact" href={`mailto:${site.email}`}>{site.email}</a>}
          </div>
          <svg className="drawer__wave" viewBox="0 0 420 40" aria-hidden="true" preserveAspectRatio="none">
            <path d="M0 2 H420 M0 38 H420" />
            <path d={STRIP} />
          </svg>
        </div>
      </div>
    </>
  );
}
