const steps = [
  { title: "İhtiyacı konuşuruz", text: "Ürün, ölçü, ağırlık, adet ve sevkiyat şekli. Bir telefon ya da kısa bir form yeterli." },
  { title: "Kartonu seçeriz", text: "Oluk tipi ve kâğıt gramajını yüke göre belirler, gerekirse numune hazırlarız." },
  { title: "Üretiriz", text: "Kesim, baskı ve yapıştırma. Her partiyi ölçü ve dayanım için kontrol ederiz." },
  { title: "Teslim ederiz", text: "Paletli, sarılı ve planlanan tarihte. Tekrar siparişlerde ölçüleriniz hazır bekler." },
];

export default function Process() {
  return (
    <section id="surec" className="process">
      <div className="wrap">
        <header className="section-head section-head--dark">
          <h2 className="section-title">Siparişten teslimata</h2>
          <p className="section-lead">Dört adım, sürpriz yok.</p>
        </header>
        <ol className="process__steps">
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__text">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
