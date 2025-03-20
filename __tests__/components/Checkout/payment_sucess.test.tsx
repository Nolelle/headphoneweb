import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PaymentSuccessPage from "@/app/components/Checkout/payment_sucess";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }) => <a href={href}>{children}</a>,
}));

describe("PaymentSuccessPage Component", () => {
  it("renders the success message correctly", () => {
    render(<PaymentSuccessPage />);
    expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for your purchase./i)).toBeInTheDocument();
  });

  it("renders a link to return home", () => {
    render(<PaymentSuccessPage />);
    const homeLink = screen.getByRole("link", { name: /Return to Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
