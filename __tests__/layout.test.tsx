import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

jest.mock("next/font/google", () => ({
    Arimo: () => ({ variable: "--font-arimo" })}));
jest.mock("@/app/components/layouts/Header", () => () => <div>Mock Header</div>);
jest.mock("@/app/components/layouts/Footer", () => () => <div>Mock Footer</div>);
jest.mock("@/app/components/Cart/CartContext", () => ({ CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock("sonner", () => ({ Toaster: () => <div>Mock Toaster</div> }));

describe("RootLayout", () => {
  it("renders the layout with header, footer, and toaster", () => {
    render(
      <RootLayout>
        <div>Mock Children</div>
      </RootLayout>
    );

    expect(screen.getByText("Mock Header")).toBeInTheDocument();
    expect(screen.getByText("Mock Footer")).toBeInTheDocument();
    expect(screen.getByText("Mock Toaster")).toBeInTheDocument();
    expect(screen.getByText("Mock Children")).toBeInTheDocument();
  });
});