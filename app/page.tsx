import ContactForm from "./components/Contact/ContactForm";
import MainPageHero from "./components/Hero/MainPageHero";

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
