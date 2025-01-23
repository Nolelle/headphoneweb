import AboutUs from "./components/features/AboutUs";
import ContactForm from "./components/features/ContactForm";
import Hero from "./components/features/Hero";
import ProductInfo from "./components/features/ProductInfo";

export default function Home() {
  return (
    <div>
      <Hero />
      <div id="about">
        <AboutUs/>
      </div>
      <div id="headphone">
        <ProductInfo/>
      </div>
      <div id="contact">
        <ContactForm />
      </div>
    </div>
  );
}
