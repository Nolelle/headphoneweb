import React from "react";
import Cart from "../components/Cart/Cart";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] pt-16">
      <main className="flex-grow">
        <Cart />
      </main>
    </div>
  );
}
