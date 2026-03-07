import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);

  const student = await prisma.student.findFirst({
    where: { mobile: session?.user?.username || "" },
    include: { receipts: true },
  });

  if (!student) {
    return <div className="p-6">Student profile not found</div>;
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const paidMonths = student.receipts.map((r) => r.month);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Fees</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">{student.name} - Class {student.class}</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {months.map((month) => {
              const receipt = student.receipts.find((r) => r.month === month);
              return (
                <tr key={month}>
                  <td className="px-6 py-4">{month}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${receipt ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {receipt ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{receipt ? `$${receipt.amount}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


