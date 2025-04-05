import { Metadata } from "next";
import { Arimo } from "next/font/google";
import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import "./globals.css";
import { SafeCartProvider } from "./components/Cart/CartContext";
import { Toaster } from "sonner";

// Configure the Arimo font
const arimo = Arimo({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arimo"
});

// Define metadata for the application
export const metadata: Metadata = {
  title: "Bone+",
  description: "Landing Page for Bone+ Headphones",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1"
};

// Root layout component that wraps the entire application
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arimo.variable}`}>
        {/* SafeCartProvider with error boundary for resilient cart functionality */}
        <SafeCartProvider>
          <Header />
          <main className="pt-16 flex flex-col overflow-hidden">
            {children}
          </main>
          <Footer />
          {/* Toaster component for showing notifications */}
          <Toaster />
        </SafeCartProvider>
      </body>
    </html>
  );
}
