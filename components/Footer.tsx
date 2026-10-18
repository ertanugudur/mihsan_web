import Image from "next/image";
import { nav, site } from "@/lib/site";
import FooterWord from "./FooterWord";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <Image
            className="footer__logo"
            src="/logo/mihsan-logo-light.png"
            alt="Mihsan Ambalaj"
            width={1400}
            height={401}
          />
          <nav className="footer__nav" aria-label="Alt menü">
            {nav.map((n) => (
              <a key={n.href} href={n.href}>{n.label}</a>
            ))}
            {site.instagram && <a href={site.instagram} target="_blank" rel="noopener">Instagram</a>}
          </nav>
        </div>
        <FooterWord />
        <div className="footer__bottom">
          <span>© {year} Mihsan Ambalaj</span>
        </div>
      </div>
    </footer>
  );
}
