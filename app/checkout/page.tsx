
import { Metadata } from "next";
import Checkout from "../components/Checkout/Checkout";

export const metadata: Metadata = {
  title: "Checkout - Bone+",
  description: "Complete your purchase"
};

export default function CheckoutPage() {
  return <Checkout />;
}