import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPromotionWizardDataAction } from "@/app/actions/promotion";
import { AnnualPromotionWizard } from "@/components/promotion/AnnualPromotionWizard";

export default async function PromotionPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!role || (role !== "ADMIN" && role !== "STAFF")) {
    redirect("/admin-route/dashboard");
  }

  const res = await getPromotionWizardDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-red-600 font-semibold mb-2">Error Loading Promotion Wizard</p>
        <p className="text-xs text-zinc-500">{res.error || "Failed to load promotion data."}</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <AnnualPromotionWizard initialData={res.data} />
    </div>
  );
}
