import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock all child components
jest.mock("@/app/components/Hero/MainPageHero", () => () => <div>Mock MainPageHero</div>);
jest.mock("@/app/components/AboutUs/AboutUs", () => () => <div>Mock AboutUs</div>);
jest.mock("@/app/components/Product/ProductInfo", () => () => <div>Mock ProductInfo</div>);
jest.mock("@/app/components/Contact/ContactForm", () => () => <div>Mock ContactForm</div>);

describe("Home Page", () => {
  it("renders all main sections", () => {
    render(<Home />);

    expect(screen.getByText("Mock MainPageHero")).toBeInTheDocument();
    expect(screen.getByText("Mock AboutUs")).toBeInTheDocument();
    expect(screen.getByText("Mock ProductInfo")).toBeInTheDocument();
    expect(screen.getByText("Mock ContactForm")).toBeInTheDocument();
  });
});