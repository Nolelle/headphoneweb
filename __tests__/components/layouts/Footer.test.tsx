import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "@/app/components/layouts/Footer";

describe("Footer Component", () => {
  it("renders company information correctly", () => {
    render(<Footer />);

    expect(screen.getByText("Bone+ LTD.")).toBeInTheDocument();
    expect(
      screen.getByText(/The best headphones since 2024/i)
    ).toBeInTheDocument();
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(
        new RegExp(`Copyright © ${currentYear} - All rights reserved`, "i")
      )
    ).toBeInTheDocument();
  });

  it("renders navigation links correctly", () => {
    render(<Footer />);

    // Check section headings
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getByText("Follow Us")).toBeInTheDocument();

    // Check important links
    const aboutLink = screen.getByRole("link", { name: "About us" });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/#about");

    const contactLink = screen.getByRole("link", { name: "Contact" });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/#contact");

    const adminLink = screen.getByRole("link", { name: "Admin View" });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin/login");

    // Check social media links with aria-labels
    const twitterLink = screen.getByRole("link", { name: /twitter/i });
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink).toHaveAttribute("href", "#twitter");

    const youtubeLink = screen.getByRole("link", { name: /youtube/i });
    expect(youtubeLink).toBeInTheDocument();
    expect(youtubeLink).toHaveAttribute("href", "#youtube");

    const facebookLink = screen.getByRole("link", { name: /facebook/i });
    expect(facebookLink).toBeInTheDocument();
    expect(facebookLink).toHaveAttribute("href", "#facebook");
  });
});
