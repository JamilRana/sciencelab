import { prisma } from "@/lib/prisma";
import { AdmissionFormManager } from "@/components/admission-forms/AdmissionFormManager";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ভর্তি ও প্রবেশপত্র ফরম | Science Lab Coaching",
  description: "ডাউনলোড ও প্রিন্টযোগ্য বিশেষ ব্যাচ এবং নিয়মিত শ্রেণি ভর্তি ও প্রবেশপত্র ফরম",
};

export default async function AdmissionFormsPage() {
  const [programs, batches, schools] = await Promise.all([
    prisma.program.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        year: true,
      },
      orderBy: { year: "desc" },
    }),
    prisma.batch.findMany({
      select: {
        id: true,
        name: true,
        classId: true,
        code: true,
      },
      orderBy: [{ code: "asc" }],
    }),
    prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">ফরম লোড হচ্ছে...</div>}>
      <AdmissionFormManager
        programs={programs}
        batches={batches}
        schools={schools}
      />
    </Suspense>
  );
}
