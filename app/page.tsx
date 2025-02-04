import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";
// import AboutUs from "./components/Admin/AboutUs";  
import ProductInfo from "./components/Admin/ProductInfo";

export default function Home() {
  return (
    <div>
      <MainPageHero />
      {/* <div id="about">
        <AboutUs/>
      </div> */}
      <div id="headphone">        
        <ProductInfo/>
      </div>
      <div id="contact">
        <ContactForm />
      </div>
    </div>
  );
}
