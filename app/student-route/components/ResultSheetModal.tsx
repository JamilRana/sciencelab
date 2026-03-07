"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";


interface ResultSheetModalProps {
  data: any;
  onClose: () => void;
  onBack: () => void;
}

export function ResultSheetModal({ data, onClose, onBack }: ResultSheetModalProps) {
  if (!data) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>📄 {data.exam.type} - {data.exam.month} Result</span>
            <Button variant="ghost" size="sm" onClick={onBack} className="no-print">
              ← Back
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* 🔹 Print Header (Hidden on Screen) */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">Coaching Center</h1>
          <p className="text-sm">Official Result Sheet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.exam.type} Examination • {data.exam.month} • Class {data.exam.class}
          </p>
        </div>

        {/* 🔹 Student Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4 print:bg-transparent print:p-0 print:mb-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <strong>{data.student.name}</strong></div>
            <div><span className="text-muted-foreground">Class:</span> {data.student.class}</div>
            <div><span className="text-muted-foreground">Batch:</span> {data.student.batch.name}</div>
            <div><span className="text-muted-foreground">Roll:</span> {data.student.roll}</div>
          </div>
        </div>

        {/* 🔹 Marks Table */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-center font-medium">Written</th>
                <th className="px-4 py-3 text-center font-medium">Objective</th>
                <th className="px-4 py-3 text-center font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Max</th>
                <th className="px-4 py-3 text-center font-medium">Position</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((sub: any) => (
                <tr key={sub.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{sub.subject}</td>
                  <td className="px-4 py-3 text-center">{sub.written}</td>
                  <td className="px-4 py-3 text-center">{sub.objective}</td>
                  <td className="px-4 py-3 text-center font-bold">{sub.total}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{sub.totalMark}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {sub.position ? `${sub.position}/${sub.totalStudents}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Summary */}
        <div className="bg-primary/5 rounded-lg p-4 print:bg-transparent print:p-0">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Result</p>
              <p className="text-2xl font-bold">
                {data.overallPercentage}% 
                <span className="text-base font-normal text-muted-foreground ml-2">
                  ({data.overallTotal}/{data.overallMax})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 🔹 Print Footer */}
        <div className="hidden print:flex justify-between mt-8 pt-4 border-t text-xs text-muted-foreground">
          <div>
            <p>Generated on: {new Date().toLocaleDateString()}</p>
            <p>Student ID: {data.student.id}</p>
          </div>
          <div className="text-right">
            <p>_________________</p>
            <p>Authorized Signature</p>
          </div>
        </div>

        {/* 🔹 Actions (Hidden on Print) */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t no-print">
          <Button variant="outline" onClick={onBack}>Close</Button>
          <Button onClick={() => window.print()}>🖨️ Print Result</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
