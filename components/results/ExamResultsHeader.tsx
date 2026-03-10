import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function ExamResultsHeader({ exam, year, role }) {
  return (
    <div className="mb-6 no-print">
      {(role === "ADMIN" || role === "STAFF") && (
        <Link
          href="/admin-route/exams"
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>
      )}
      {role === "STUDENT" && (
        <Link
          href="/student-route/results"
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        Back to Results
      </Link>
      )}
      {role === "TEACHER" && (
        <Link
          href="/teacher-route/results"
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        Back to Results
      </Link>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Exam Results</h1>
            <p className="text-gray-500">
              {exam.type} - {exam.month} {year} (Class {exam.class})
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Print
        </button>
      </div>

    </div>
  );
}