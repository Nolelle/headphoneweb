import { Metadata } from "next";
import { Arimo } from "next/font/google";
import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import "./globals.css";
import { CartProvider } from "./components/Cart/CartContext";
import { Toaster } from 'sonner';

// Configure the Arimo font
const arimo = Arimo({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arimo",
});

// Define metadata for the application
export const metadata: Metadata = {
  title: "Bone+",
  description: "Landing Page for Bone+ Headphones",
};

// Root layout component that wraps the entire application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arimo.variable}`}>
        {/* CartProvider wraps the app to provide cart functionality everywhere */}
        <CartProvider>
          <Header />
          {children}
          <Footer />
          {/* Toaster component for showing notifications */}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}