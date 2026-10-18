// Oluk tipleri. Kalınlıklar sektördeki tipik değerlerdir; üretimde kâğıda göre küçük farklar olur.
const flutes = [
  { code: "E", mm: 1.5, name: "İnce oluk", use: "Kozmetik, gıda ve raf ambalajı. Pürüzsüz yüzeyi baskıyı net taşır.", double: false },
  { code: "B", mm: 3, name: "Orta oluk", use: "Konserve, cam şişe ve yoğun ürünler. Ezilmeye karşı dayanıklı.", double: false },
  { code: "C", mm: 4, name: "Yüksek oluk", use: "Genel sevkiyat kolileri. Yüksek istif gücü ve darbe emilimi.", double: false },
  { code: "EB", mm: 4.5, name: "Mikro çift oluk", use: "Hem baskı kalitesi hem dayanım isteyen ürünler.", double: true },
  { code: "BC", mm: 7, name: "Çift oluk", use: "Ağır, hassas ve uzun yola çıkan yükler, ihracat.", double: true },
];

function Profile({ mm, double }: { mm: number; double: boolean }) {
  // 1 mm = 8 birim; görsel gerçek oranlara yakın
  const s = 8;
  const w = 220;
  const h = mm * s;
  const pad = 6;
  const wave = (y0: number, amp: number, approxStep: number) => {
    const n = Math.max(2, Math.round(w / approxStep));
    const step = w / n;
    let d = `M0 ${y0}`;
    for (let i = 0; i < n; i++) d += ` q ${step / 2} ${i % 2 === 0 ? -amp * 2 : amp * 2} ${step} 0`;
    return d;
  };
  const lines: React.ReactNode[] = [];
  if (!double) {
    lines.push(<path key="w" d={wave(pad + h / 2, h / 2 - 1.5, Math.max(9, h / 1.6))} />);
  } else {
    const a = h * 0.4;
    const b = h - a;
    lines.push(<path key="w1" d={wave(pad + a / 2, a / 2 - 1.5, 9)} />);
    lines.push(<line key="m" x1="0" x2={w} y1={pad + a} y2={pad + a} className="liner" />);
    lines.push(<path key="w2" d={wave(pad + a + b / 2, b / 2 - 1.5, Math.max(12, b / 1.6))} />);
  }
  return (
    <svg className="flute__profile" viewBox={`0 0 ${w} ${h + pad * 2}`} preserveAspectRatio="xMinYMid meet">
      <line x1="0" x2={w} y1={pad} y2={pad} className="liner" />
      <line x1="0" x2={w} y1={pad + h} y2={pad + h} className="liner" />
      {lines}
    </svg>
  );
}

export default function Flutes() {
  return (
    <section id="oluk" className="flutes">
      <div className="wrap">
        <header className="section-head section-head--line">
          <h2 className="section-title">Doğru oluk, doğru koli</h2>
          <p className="section-lead">
            Hangi oluk tipinin size uyduğunu bilmiyorsanız sorun yok: ürününüzü anlatın, birlikte
            seçelim.
          </p>
        </header>

        <div className="flutes__table" role="table" aria-label="Oluk tipleri">
          {flutes.map((f) => (
            <div key={f.code} className="flute" role="row">
              <span className="flute__code" role="cell">{f.code}</span>
              <span className="flute__meta" role="cell">
                <span className="flute__name">{f.name}</span>
                <span className="flute__mm">yaklaşık {f.mm.toLocaleString("tr-TR")} mm</span>
              </span>
              <span className="flute__visual" role="cell">
                <Profile mm={f.mm} double={f.double} />
              </span>
              <span className="flute__use" role="cell">{f.use}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
