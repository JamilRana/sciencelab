import { prisma } from "@/lib/prisma";
import { generateDisplayRoll } from "@/lib/roll";
import Link from "next/link";

export default async function StudentPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; batch?: string; gender?: string }>;
}) {
  const params = await searchParams;
  
  const where: Record<string, unknown> = {};
  if (params.class) where.class = params.class;
  if (params.batch) where.batchId = parseInt(params.batch);
  if (params.gender) where.gender = params.gender;

  const [students, batches] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { batch: true, school: true },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    }),
    prisma.batch.findMany({ orderBy: { classId: "asc" } }),
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
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Print
          </button>
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
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-center">Student List</h1>
            <p className="text-gray-500 text-center mt-1">
              {params.class ? `Class: ${params.class}` : ""}
              {params.batch ? ` | Batch: ${batches.find(b => b.id === parseInt(params.batch || "0"))?.name}` : ""}
              {params.gender ? ` | Gender: ${params.gender}` : ""}
              {!params.class && !params.batch && !params.gender && "All Students"}
            </p>
            <p className="text-sm text-gray-500 text-center mt-1">
              Total: {students.length} students
            </p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-bold">Roll</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Class</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Batch</th>
                <th className="px-4 py-3 text-left text-sm font-bold">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="px-4 py-3">{student.batch?.code ? generateDisplayRoll(student.batch.code, student.roll) : student.roll}</td>
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3">{student.gender}</td>
                  <td className="px-4 py-3">{student.class}</td>
                  <td className="px-4 py-3">{student.batch?.name}</td>
                  <td className="px-4 py-3">{student.mobile}</td>
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
