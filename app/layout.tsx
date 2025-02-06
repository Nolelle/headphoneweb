import { Metadata } from "next";
import { Arimo } from "next/font/google";
import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import "./globals.css";
import { CartProvider } from "./components/Cart/CartContext";

const arimo = Arimo({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arimo",
});

export const metadata: Metadata = {
  title: "Bone+",
  description: "Landing Page for Bone+",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arimo.variable}`}>
        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
