import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";
import ProductInfo from "./components/Product/ProductInfo";
import AboutUs from "./components/AboutUs/AboutUs";

export default function Home() {
  return (
    <div>
      <div id="hero">
        <MainPageHero />
      </div>
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
