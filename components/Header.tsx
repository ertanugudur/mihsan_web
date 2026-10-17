"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}${open ? " header--open" : ""}`}>
      <div className="header__inner">
        <a href="#top" className="header__logo" aria-label="Mihsan Ambalaj ana sayfa">
          <Image src="/logo/mihsan-logo-dark.png" alt="Mihsan Ambalaj" width={1400} height={401} priority />
        </a>
        <nav className="header__nav" aria-label="Ana menü">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <a href="#teklif" className="btn btn--solid header__cta" onClick={() => setOpen(false)}>
            Teklif iste
          </a>
        </nav>
        <button
          className="header__toggle"
          aria-expanded={open}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
