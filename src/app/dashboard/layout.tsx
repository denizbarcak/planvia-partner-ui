import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="transition-all duration-300 ml-20 lg:ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
