import React from "react";
import { render, screen } from "@testing-library/react";
import CartPage from "@/app/cart/page";
import Cart from "@/app/components/Cart/Cart";


// Mock the Cart component
jest.mock("@/app/components/Cart/Cart", () => () => <div data-testid="cart-component">Mocked Cart</div>);

describe("CartPage", () => {
  it("renders the Cart component", () => {
    render(<CartPage />);
    
    // Check if the mocked Cart component is rendered
    expect(screen.getByTestId("cart-component")).toBeInTheDocument();
  });
});
