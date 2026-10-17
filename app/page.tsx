import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Flutes from "@/components/Flutes";
import Process from "@/components/Process";
import Quote from "@/components/Quote";
import Footer from "@/components/Footer";
import SmoothAnchors from "@/components/SmoothAnchors";

export default function Home() {
  return (
    <>
      <a className="skip" href="#urunler">İçeriğe geç</a>
      <Header />
      <main id="top">
        <Hero />
        <Products />
        <Flutes />
        <Process />
        <Quote />
      </main>
      <Footer />
      <SmoothAnchors />
    </>
  );
}
