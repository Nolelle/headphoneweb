import { Arimo } from "next/font/google";
import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import "./globals.css";

const arimo = Arimo({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arimo"
});

export const metadata: Metadata = {
  title: "Headphone Plus",
  description: "Landing Page for Headphone Plus"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arimo.variable}`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
