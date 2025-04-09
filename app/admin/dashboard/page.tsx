// app/admin/dashboard/page.tsx
"use client";

import AdminDashboard from "@/app/components/Admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)]">
      {/* Add pt-20 to account for the fixed header height */}
      <main className="container mx-auto px-4 sm:px-6 py-6 pt-20">
        <AdminDashboard />
      </main>
    </div>
  );
}
