import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClassTenYearEndRosterAction } from "@/app/actions/archiving";
import { ClassTenLifecycleManager } from "@/components/promotion/ClassTenLifecycleManager";

export const metadata = {
  title: "Class 10 & SSC Lifecycle | Science Lab",
  description: "Manage November SSC transition, year-end Class 10 archiving, and SSC program completion.",
};

export default async function ClassTenLifecyclePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!role || (role !== "ADMIN" && role !== "STAFF")) {
    redirect("/admin-route/dashboard");
  }

  const res = await getClassTenYearEndRosterAction();

  if (!res.success || !res.data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 font-semibold mb-2">Error Loading Class 10 Lifecycle</p>
        <p className="text-xs text-zinc-500">{res.error || "Failed to load Class 10 data."}</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <ClassTenLifecycleManager initialData={res.data} />
    </div>
  );
}
