// app/admin/dashboard/page.tsx
import AdminDashboard from "@/app/components/Admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <AdminDashboard />
      </div>
    </div>
  );
}
