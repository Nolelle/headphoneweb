import { render, screen } from "@testing-library/react";
import AdminDashboardPage from "@/app/admin/dashboard/page";

// Mock the AdminDashboard component
jest.mock("@/app/components/Admin/AdminDashboard", () => () => <div>Mock AdminDashboard</div>);

describe("AdminDashboardPage", () => {
  it("renders the AdminDashboard component", () => {
    render(<AdminDashboardPage />);

    expect(screen.getByText("Mock AdminDashboard")).toBeInTheDocument();
  });
});