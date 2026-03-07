import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { getNavItemsForRole } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  const role = session?.user?.role;
  
  if (!role || !["ADMIN", "STAFF"].includes(role)) {
    redirect("/login");
  }

  const items = getNavItemsForRole(role);
  const roleLabel = role === "ADMIN" ? "admin" : "staff";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={items} role={roleLabel} />
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
