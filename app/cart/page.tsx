import React from "react";
import Cart from "../components/Cart/Cart";

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Cart />
      </main>
    </div>
  );
}
