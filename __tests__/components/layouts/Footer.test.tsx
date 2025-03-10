// __tests__/components/layouts/Footer.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "@/app/components/layouts/Footer";

describe("Footer Component", () => {
  it("renders company information correctly", () => {
    render(<Footer />);
    
    // Check company name
    expect(screen.getByText("Bone+ LTD.")).toBeInTheDocument();
    
    // Check company tagline
    expect(screen.getByText(/The best headphones since 2024/i)).toBeInTheDocument();
    
    // Check copyright info with current year
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`Copyright © ${currentYear} - All rights reserved`, 'i'))).toBeInTheDocument();
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
    
    // Check admin link
    const adminLink = screen.getByRole("link", { name: "Admin View" });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin/login");
    
    // Check social media links
    expect(screen.getByRole("link", { name: /twitter/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /youtube/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /facebook/i })).toBeInTheDocument();
  });
});