import { Arimo } from "next/font/google";
import "./globals.css";
import Footer from "./layouts/Footer";
import Header from "./layouts/Header";

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
