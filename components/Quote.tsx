"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const productOptions = ["Karton kutu", "Köşebent", "Ondüle", "Henüz emin değilim"];

export default function Quote() {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  const hasWhatsapp = Boolean(site.whatsapp);
  const hasEmail = Boolean(site.email);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const lines = [
      "Merhaba, teklif almak istiyorum.",
      `Ad soyad: ${get("name")}`,
      get("company") && `Firma: ${get("company")}`,
      get("phone") && `Telefon: ${get("phone")}`,
      `Ürün: ${get("product")}`,
      get("size") && `Ölçü: ${get("size")}`,
      get("qty") && `Adet: ${get("qty")}`,
      get("note") && `Not: ${get("note")}`,
    ].filter(Boolean);
    const text = lines.join("\n");

    if (hasWhatsapp) {
      window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    } else if (hasEmail) {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("Teklif talebi")}&body=${encodeURIComponent(text)}`;
    } else {
      navigator.clipboard?.writeText(text);
      setStatus("copied");
    }
  }

  const submitLabel = hasWhatsapp ? "WhatsApp ile gönder" : hasEmail ? "E-posta ile gönder" : "Talebi kopyala";

  return (
    <section id="teklif" className="quote">
      <div className="wrap quote__grid">
        <div className="quote__intro">
          <h2 className="section-title">Ölçüyü söyleyin, gerisini konuşalım</h2>
          <p className="section-lead">
            Formu doldurun, talebiniz doğrudan bize ulaşsın. Ölçüyü bilmiyorsanız ürünü anlatmanız
            yeterli.
          </p>
          <dl className="quote__contact">
            {site.phone && (
              <div>
                <dt>Telefon</dt>
                <dd><a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></dd>
              </div>
            )}
            {site.email && (
              <div>
                <dt>E-posta</dt>
                <dd><a href={`mailto:${site.email}`}>{site.email}</a></dd>
              </div>
            )}
            {site.address && (
              <div>
                <dt>Adres</dt>
                <dd>{site.address}</dd>
              </div>
            )}
          </dl>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Ad soyad</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label className="field">
            <span>Firma</span>
            <input name="company" autoComplete="organization" />
          </label>
          <label className="field">
            <span>Telefon</span>
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <fieldset className="field field--choices">
            <legend>Ürün</legend>
            <div className="choices">
              {productOptions.map((o, i) => (
                <label key={o} className="choice">
                  <input type="radio" name="product" value={o} defaultChecked={i === 0} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Ölçü (en × boy × yükseklik, mm)</span>
            <input name="size" placeholder="300 × 200 × 150" />
          </label>
          <label className="field">
            <span>Adet</span>
            <input name="qty" inputMode="numeric" placeholder="1000" />
          </label>
          <label className="field field--wide">
            <span>Not</span>
            <textarea name="note" rows={3} placeholder="Ürün ne, ne kadar ağır, nasıl taşınacak?" />
          </label>
          <div className="form__foot field--wide">
            <button type="submit" className="btn btn--solid">{submitLabel}</button>
            {status === "copied" && (
              <p className="form__status" role="status">
                Talebiniz panoya kopyalandı. Bize mesaj olarak yapıştırabilirsiniz.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
