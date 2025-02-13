import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";
import ProductInfo from "./components/Admin/ProductInfo";
import AboutUs from "./components/Admin/AboutUs";

export default function Home() {
  return (
    <div>
      <MainPageHero />
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
