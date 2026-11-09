import { faq } from "@/lib/faq";

export default function Faq() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="sss" className="faq">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-title">Sık sorulan sorular</h2>
          <p className="section-lead">
            Koli ölçüsünden oluk tipine, karton köşebentten ondüle kartona en çok sorulanlar.
          </p>
        </header>
        <div className="faq__list">
          {faq.map((f) => (
            <details key={f.q} className="faq__item">
              <summary className="faq__q">
                <span>{f.q}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
              </summary>
              <p className="faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}
