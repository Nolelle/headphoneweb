import ContactForm from "./components/features/ContactForm";
import Hero from "./components/features/Hero";

export default function Home() {
  return (
    <div>
      <Hero />
      <div id="contact">
        <ContactForm />
      </div>
    </div>
  );
}
