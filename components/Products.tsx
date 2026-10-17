const BoxArt = () => (
  <svg viewBox="0 0 240 200" fill="none" strokeLinejoin="round" strokeLinecap="round">
    <path d="M120 40 L200 80 V160 L120 196 L40 160 V80 Z" stroke="currentColor" strokeWidth="2.5" />
    <path d="M40 80 L120 120 L200 80" stroke="currentColor" strokeWidth="2.5" />
    <path d="M120 120 V196" stroke="currentColor" strokeWidth="2.5" />
    <path d="M40 80 L70 48 L150 88 L120 120" stroke="currentColor" strokeWidth="2.5" />
    <path d="M200 80 L224 54 L150 20 L120 40" stroke="currentColor" strokeWidth="2.5" />
    <path d="M80 140 L80 172 M92 146 V178" stroke="var(--kraft)" strokeWidth="3" />
  </svg>
);

const CornerArt = () => (
  <svg viewBox="0 0 240 200" fill="none" strokeLinejoin="round" strokeLinecap="round">
    <path d="M60 60 L100 40 V180 L60 196 Z" stroke="currentColor" strokeWidth="2.5" />
    <path d="M100 40 L196 88 V108 L100 60" stroke="currentColor" strokeWidth="2.5" />
    <path d="M60 60 L156 108 H196" stroke="currentColor" strokeWidth="2.5" />
    <path d="M100 60 V180" stroke="currentColor" strokeWidth="2.5" />
    <path d="M72 86 V170 M84 80 V164" stroke="var(--kraft)" strokeWidth="3" />
  </svg>
);

const SheetArt = () => (
  <svg viewBox="0 0 240 200" fill="none" strokeLinejoin="round" strokeLinecap="round">
    <path d="M24 64 H216" stroke="currentColor" strokeWidth="2.5" />
    <path d="M24 136 H216" stroke="currentColor" strokeWidth="2.5" />
    <path
      d="M24 100 q12 -36 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0"
      stroke="var(--kraft)"
      strokeWidth="3"
    />
    <path d="M200 150 c10 10 10 30 -6 34 c-14 2 -18 -14 -8 -18" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

const products = [
  {
    id: "kutu",
    name: "Karton kutu",
    art: <BoxArt />,
    text: "E-ticaret paketinden ağır sanayi yüküne kadar, ölçüye göre üretilen oluklu mukavva koliler.",
    specs: ["Tek ve çift oluklu", "Standart koli ve özel kesim", "Baskılı ya da sade kraft yüzey", "Küçük ve büyük adetler"],
  },
  {
    id: "kosebent",
    name: "Köşebent",
    art: <CornerArt />,
    text: "Palet ve kolilerin köşelerini çember baskısına, darbeye ve istif yüküne karşı koruyan karton profiller.",
    specs: ["İstenen boy ve kanat ölçüsü", "Farklı et kalınlıkları", "Plastiğe kâğıt bazlı alternatif", "Tamamen geri dönüştürülebilir"],
  },
  {
    id: "ondule",
    name: "Ondüle",
    art: <SheetArt />,
    text: "Sarma, ara katman ve dolgu için rulo ya da tabaka halinde esnek oluklu karton.",
    specs: ["Rulo ve tabaka", "Farklı dalga yükseklikleri", "Cam, mobilya ve hassas yüzeyler için", "Hattınıza uygun genişlik"],
  },
];

export default function Products() {
  return (
    <section id="urunler" className="products">
      <div className="wrap">
        <header className="section-head">
          <h2 className="section-title">Ne üretiyoruz</h2>
          <p className="section-lead">
            Üç ürün, tek iş: ürününüzün yoldan sağlam çıkması. Her siparişi ölçü, yük ve sevkiyat
            koşuluna göre birlikte netleştiriyoruz.
          </p>
        </header>

        <div className="products__list">
          {products.map((p) => (
            <article key={p.id} className="product" id={p.id}>
              <div className="product__art">{p.art}</div>
              <div className="product__body">
                <h3 className="product__name">{p.name}</h3>
                <p className="product__text">{p.text}</p>
              </div>
              <ul className="product__specs">
                {p.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
