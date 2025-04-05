import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";
import ProductInfo from "./components/Product/ProductInfo";
import AboutUs from "./components/AboutUs/AboutUs";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section id="hero">
        <MainPageHero />
      </section>

      <section id="about">
        <AboutUs />
      </section>

      <section id="headphone">
        <ProductInfo />
      </section>

      <section id="contact">
        <ContactForm />
      </section>
    </div>
  );
}
