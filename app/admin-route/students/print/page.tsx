import { prisma } from "@/lib/prisma";
import { generateDisplayRoll } from "@/lib/roll";
import Link from "next/link";
import { PrintButton } from "@/components/ui/print-button";

export default async function StudentPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; batch?: string; gender?: string }>;
}) {
  const params = await searchParams;
  
  const where: Record<string, unknown> = {};
  if (params.class) where.class = params.class;
  if (params.batch) {
    where.batchId = parseInt(params.batch);
  } else {
    // Default roster print to regular batches to avoid duplicating students enrolled in both regular & special batches
    where.batch = { programId: null };
  }
  if (params.gender) where.gender = params.gender;

  const [students, batches] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { batch: true, school: true },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    }),
    prisma.batch.findMany({
      orderBy: [{ classId: "asc" }, { name: "asc" }],
    }),
  ]);

  const classes = ["Six", "Seven", "Eight", "Nine", "Ten"];
  const genders = ["Male", "Female"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 no-print">
          <Link
            href="/admin-route/students"
            className="text-blue-600 hover:underline"
          >
            ← Back to Students
          </Link>
          <PrintButton />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6 no-print">
          <h2 className="text-lg font-bold mb-4">Filter Students</h2>
          <form className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                name="class"
                defaultValue={params.class || ""}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select
                name="batch"
                defaultValue={params.batch || ""}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                defaultValue={params.gender || ""}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">All Genders</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden print:shadow-none print:border-0">
          <div className="p-6 border-b text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo2.png" alt="Science Lab Logo" className="h-10 w-auto object-contain" />
              <div className="text-left">
                <h2 className="text-xl font-bold uppercase tracking-wide text-zinc-900">Science Lab Coaching Center</h2>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Official Student Roster</p>
              </div>
            </div>
            <p className="text-gray-500 text-center mt-1 text-sm font-medium">
              {params.class ? `Class: ${params.class}` : ""}
              {params.batch ? ` | Batch: ${batches.find(b => b.id === parseInt(params.batch || "0"))?.name}` : ""}
              {params.gender ? ` | Gender: ${params.gender}` : ""}
              {!params.class && !params.batch && !params.gender && "All Students"}
            </p>
            <p className="text-xs text-gray-400 text-center mt-0.5">
              Total: {students.length} students · Printed: {new Date().toLocaleDateString()}
            </p>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-3 py-2 text-left font-bold w-16">Roll</th>
                <th className="px-3 py-2 text-left font-bold">Student Name</th>
                <th className="px-3 py-2 text-left font-bold w-16">Gender</th>
                <th className="px-3 py-2 text-left font-bold w-20">Class</th>
                <th className="px-3 py-2 text-left font-bold">Batch</th>
                <th className="px-3 py-2 text-left font-bold">Feeder School</th>
                <th className="px-3 py-2 text-left font-bold">Contact</th>
                <th className="px-3 py-2 text-center font-bold w-24">Signature</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-gray-200">
                  <td className="px-3 py-2 font-bold tabular-nums">
                    {student.batch?.code
                      ? generateDisplayRoll(student.batch.code, student.roll)
                      : student.roll}
                  </td>
                  <td className="px-3 py-2 font-semibold text-gray-900">{student.name}</td>
                  <td className="px-3 py-2 text-gray-600">{student.gender}</td>
                  <td className="px-3 py-2 text-gray-600">Class {student.class}</td>
                  <td className="px-3 py-2 text-gray-700 font-medium">{student.batch?.name}</td>
                  <td className="px-3 py-2 text-gray-600 truncate max-w-[150px]">{student.school?.name || "—"}</td>
                  <td className="px-3 py-2 text-gray-700 tabular-nums">
                    <div>{student.mobile}</div>
                    {student.homeMobile && (
                      <div className="text-[10px] text-gray-500">G: {student.homeMobile}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center border-l border-gray-200"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {students.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No students found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
