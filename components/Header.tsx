"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/site";

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
          <svg className="drawer__wave" viewBox="0 0 400 60" aria-hidden="true" preserveAspectRatio="none">
            <path d="M0 4 H400 M0 56 H400" />
            <path d="M0 30 q25 -26 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
          </svg>
        </div>
      </div>
    </>
  );
}
