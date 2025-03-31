import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";
import ProductInfo from "./components/Product/ProductInfo";
import AboutUs from "./components/AboutUs/AboutUs";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section
        id="hero"
        className="mb-8 md:mb-0"
      >
        <MainPageHero />
      </section>

      <section
        id="about"
        className="mb-8 md:mb-0"
      >
        <AboutUs />
      </section>

      <section
        id="headphone"
        className="mb-8 md:mb-0"
      >
        <ProductInfo />
      </section>

      <section id="contact">
        <ContactForm />
      </section>
    </div>
  );
}
