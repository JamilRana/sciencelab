//app/admin-route/components/dashboard/FinancialAnalyticsChart.tsx
"use client";

import { Role } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function TeacherAnalyticsTable({ data, role }: { data: any[]; role: Role }) {
  if (!data?.length) return <p className="text-muted-foreground text-sm">No teacher data</p>;

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Teacher</TableHead>
            <TableHead className="text-center">Subjects</TableHead>
            <TableHead className="text-center">Classes</TableHead>
            {(role === "ADMIN" || role === "STAFF") && (
              <>
                <TableHead className="text-center">Paid</TableHead>
                <TableHead className="text-center">Due</TableHead>
              </>
            )}
            <TableHead className="text-right">Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((teacher) => (
            <TableRow key={teacher.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{teacher.name}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{teacher.subjectsAssigned}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{teacher.classesTaken}</Badge>
              </TableCell>
              {(role === "ADMIN" || role === "STAFF") && (
                <>
                  <TableCell className="text-center text-green-600 font-medium">
                    ৳{teacher.totalPaid?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {teacher.due > 0 ? (
                      <Badge variant="destructive">৳{teacher.due.toLocaleString()}</Badge>
                    ) : (
                      <Badge variant="default">Paid</Badge>
                    )}
                  </TableCell>
                </>
              )}
              <TableCell className="text-right text-sm">
                <a href={`tel:${teacher.mobile}`} className="text-primary hover:underline">
                  📞 {teacher.mobile.slice(-4).padStart(11, '*')}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}