// Firma bilgileri: telefon, e-posta ve adres buradan değişir.
// Boş bırakılan alanlar sitede gösterilmez.
export const site = {
  name: "Mihsan Ambalaj",
  // Sitenin yayındaki adresi (sonunda / olmadan). Özel alan adı alınınca burayı değiştirin;
  // sitemap, robots.txt ve paylaşım önizlemeleri bu adresi kullanır.
  url: "https://mihsanambalaj.com",
  // Google Search Console > "HTML etiketi" doğrulamasındaki content="..." değeri
  googleVerification: "",
  description:
    "Koli ve karton kutu imalatı: özel ölçü ve baskılı koli, karton köşebent ve ondüle karton üretimi. Tek ve çift oluklu seçenekler için hemen teklif alın.",
  phone: "", // örn. "+90 532 000 00 00"
  whatsapp: "", // sadece rakam, ülke koduyla: "905320000000"
  email: "", // örn. "info@mihsanambalaj.com"
  address: "", // örn. "Organize Sanayi Bölgesi, Yalova"
  instagram: "", // örn. "https://instagram.com/mihsanambalaj"
};

export const nav = [
  { href: "#urunler", label: "Ürünler" },
  { href: "#oluk", label: "Oluk tipleri" },
  { href: "#surec", label: "Nasıl çalışıyoruz" },
  { href: "#sss", label: "SSS" },
  { href: "#teklif", label: "İletişim" },
];
