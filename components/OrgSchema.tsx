import { site } from "@/lib/site";

// Google için firma bilgisi (yapısal veri). lib/site.ts'deki boş alanlar eklenmez.
export default function OrgSchema() {
  const offers = [
    "Özel ölçü koli",
    "Baskılı ve logolu koli",
    "Ofset baskılı karton kutu",
    "Karton köşebent",
    "Ondüle karton",
  ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Product", name } }));

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo/mihsan-mark.png`,
    description: site.description,
    knowsAbout: ["koli imalatı", "karton kutu imalatı", "oluklu mukavva", "karton köşebent", "ondüle karton"],
    makesOffer: offers,
  };
  if (site.phone) ld.telephone = site.phone;
  if (site.email) ld.email = site.email;
  if (site.address) ld.address = { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "TR" };
  if (site.instagram) ld.sameAs = [site.instagram];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />;
}
