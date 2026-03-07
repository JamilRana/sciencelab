import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  const student = await prisma.student.findFirst({
    where: { mobile: session?.user?.username || "" },
    include: { receipts: true },
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = months[new Date().getMonth()];
  const paidMonths = student?.receipts.map((r) => r.month) || [];
  const isPaid = paidMonths.includes(currentMonth);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      
      {student ? (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold">Welcome, {student.name}</h2>
            <p className="text-gray-500">Class: {student.class}</p>
            <p className="text-gray-500">Father: {student.fatherName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500">Fee Status ({currentMonth})</p>
              <p className={`text-2xl font-bold ${isPaid ? "text-green-600" : "text-red-600"}`}>
                {isPaid ? "Paid" : "Unpaid"}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold">{student.receipts.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500">Mobile</p>
              <p className="text-2xl font-bold">{student.mobile}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Student profile not found</p>
        </div>
      )}
    </div>
  );
}


