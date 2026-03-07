import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

const teacherItems = [
  { label: "Dashboard", href: "/teacher-route/dashboard" },
  { label: "My Exams", href: "/teacher-route/exams" },
  { label: "Marks Entry", href: "/teacher-route/marks" },
  { label: "Results", href: "/teacher-route/results" },
  { label: "Class Log", href: "/teacher-route/class-log" },
  { label: "Payments", href: "/teacher-route/payments" },
  { label: "Profile", href: "/teacher-route/profile" },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={teacherItems} role="teacher" />
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
