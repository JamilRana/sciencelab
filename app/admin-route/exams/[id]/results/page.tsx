// app/admin-route/exams/[id]/results/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Award, Trophy } from "lucide-react";
import React from "react";

interface Props {
  searchParams: Promise<{ role?: string; studentId?: string }>;
}

export default function ExamResultsPage({ searchParams }: Props) {
  const params = useParams();
  const resolvedSearchParams = React.use(searchParams);
  const id = params?.id as string;
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  
  const role = resolvedSearchParams?.role;
  const studentId = resolvedSearchParams?.studentId ? parseInt(resolvedSearchParams.studentId) : null;
  const isStudent = role === "STUDENT";

  useEffect(() => {
    if (!id) return;
    
    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const data = await res.json();
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [id]);

  // Calculate student totals and merit positions with tie handling
  const resultsWithPosition = useMemo(() => {
    if (!exam || exam.subjects.length === 0 || exam.subjects[0].marks.length === 0) {
      return [];
    }

    // Filter marks for student if role is STUDENT
    let marksToProcess = exam.subjects[0].marks;
    if (isStudent && studentId) {
      marksToProcess = marksToProcess.filter((mark: any) => mark.studentId === studentId);
    }

    // Step 1: Calculate total marks for each student
    const studentTotals = marksToProcess.map((mark: any) => {
      const student = mark.student;
      const subjectMarks = exam.subjects.map((sub: any) => {
        const studentMark = isStudent && studentId 
          ? sub.marks.find((sm: any) => sm.studentId === studentId && sm.studentId === student.id)
          : sub.marks.find((sm: any) => sm.studentId === student.id);
        return {
          subject: sub.subject,
          totalMark: sub.totalMark,
          written: studentMark ? studentMark.written : 0,
          objective: studentMark ? studentMark.objective : 0,
          total: studentMark ? studentMark.written + studentMark.objective : 0,
        };
      });
      
      const total = subjectMarks.reduce((a: number, b: any) => a + b.total, 0);
      const maxTotal = exam.subjects.reduce((a: number, b: any) => a + b.totalMark, 0);
      
      return {
        student,
        total,
        maxTotal,
        subjectMarks,
      };
    });

    // Step 2: Sort by total descending, then by name for consistent ordering
    const sorted = [...studentTotals].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.student.name.localeCompare(b.student.name);
    });

    // Step 3: Assign positions with tie handling
    let position = 1;
    let previousTotal: number | null = null;
    let studentsAtSameRank = 0;

    const results = sorted.map((item, index) => {
      // If total is different from previous, update position
      if (previousTotal !== null && item.total !== previousTotal) {
        position = index + 1; // Standard competition ranking: skip ranks for ties
        studentsAtSameRank = 0;
      }
      
      previousTotal = item.total;
      studentsAtSameRank++;
      
      // Format position: if multiple students tied, show "1-a", "1-b", etc.
      const positionLabel = studentsAtSameRank > 1 
        ? `${position}-${String.fromCharCode(96 + studentsAtSameRank)}` // 1-a, 1-b, 1-c
        : position.toString();

      return {
        ...item,
        position: positionLabel,
        positionNumber: position,
      };
    });

    return results;
  }, [exam]);

  if (loading) {
    return (
      <div className="py-6 px-4 md:px-0">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!exam || exam.error) {
    return (
      <div className="py-6 px-4 md:px-0">
        <Link href="/admin-route/exams" className="text-blue-600">Back to Exams</Link>
        <div className="mt-4">Exam not found</div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-0">
      <div className="mb-6 no-print">
        <Link
          href="/admin-route/exams"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Exam Results</h1>
              <p className="text-gray-500">{exam.type} - {exam.month} {currentYear} (Class {exam.class})</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Science Lab Science Lab Coaching Center</h1>
        <h2 className="text-lg font-semibold mt-2">
          {exam.type} Examination - {exam.month} {currentYear}
        </h2>
        <p className="text-sm">Class: {exam.class}</p>
      </div>

      {exam.subjects.length === 0 || exam.subjects[0].marks.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No marks entered yet for this exam.</p>
          <Link
            href={`/admin-route/exams/${exam.id}/subjects`}
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Enter Marks
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th rowSpan={2} className="px-3 py-3 text-left font-medium text-gray-600 w-16 border-r border-gray-200">Pos</th>
                  <th rowSpan={2} className="px-3 py-3 text-left font-medium text-gray-600 border-r border-gray-200">Student</th>
                  {exam.subjects.map((sub: any) => (
                    <th 
                      key={sub.id} 
                      colSpan={3} 
                      className="px-2 py-2 text-center font-medium text-gray-600 border-r border-gray-200 bg-gray-100"
                    >
                      {sub.subject}
                    </th>
                  ))}
                  <th rowSpan={2} className="px-3 py-3 text-center font-medium text-gray-600 bg-gray-100">Total</th>
                </tr>
                <tr className="bg-gray-50">
                  {exam.subjects.map((sub: any) => (
                    <React.Fragment key={`sub-head-${sub.id}`}>
                      <th className="px-2 py-1 text-center font-normal text-gray-500 text-xs border-r border-gray-200 bg-gray-50">Wri</th>
                      <th className="px-2 py-1 text-center font-normal text-gray-500 text-xs border-r border-gray-200 bg-gray-50">Obj</th>
                      <th className="px-2 py-1 text-center font-normal text-gray-500 text-xs border-r border-gray-200 bg-gray-50">Tot</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {resultsWithPosition.map((result: any) => (
                  <tr 
                    key={result.student.id} 
                    className="hover:bg-gray-50 print:hover:bg-transparent"
                  >
                    <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-200">
                      {/* Trophy icon for top 3 */}
                      <span className="inline-flex items-center gap-1">
                        {result.positionNumber === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {result.positionNumber === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                        {result.positionNumber === 3 && <Trophy className="h-4 w-4 text-amber-600" />}
                        {result.position}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 border-r border-gray-200">
                      {result.student.name}
                    </td>
                    {result.subjectMarks.map((subjectData: any, idx: number) => (
                      <React.Fragment key={idx}>
                        <td className="px-2 py-2 text-center border-r border-gray-200">
                          {subjectData.written > 0 ? subjectData.written : '-'}
                        </td>
                        <td className="px-2 py-2 text-center border-r border-gray-200">
                          {subjectData.objective > 0 ? subjectData.objective : '-'}
                        </td>
                        <td className="px-2 py-2 text-center font-medium border-r border-gray-200">
                          {subjectData.total > 0 ? subjectData.total : '-'}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-gray-900 bg-gray-50">
                      {result.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Styles - Portrait */}
      <style jsx global>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 15mm;
          }
          
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important;
            color: black !important;
          }
          
          .no-print { 
            display: none !important; 
          }
          
          table { 
            font-size: 8.5pt;
            border-collapse: collapse;
            width: 100%;
          }
          
          th, td { 
            border: 1pt solid #000 !important;
            padding: 3px 4px !important;
          }
          
          th { 
            background-color: #f3f4f6 !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact;
          }
          
          thead { 
            display: table-header-group; 
          }
          
          tr { 
            page-break-inside: avoid; 
          }
          
          tbody tr:nth-child(even) {
            background-color: #fafafa !important;
          }
          
          /* Ensure borders show clearly */
          .border-r {
            border-right: 1pt solid #000 !important;
          }
          
          /* Hide shadows and rounded corners in print */
          .shadow, .shadow-sm, .rounded-xl {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}