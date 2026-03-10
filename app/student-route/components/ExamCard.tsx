"use client";

import { ExamSummary } from "@/app/actions/student-results";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface ExamCardProps {
  exam: ExamSummary;
  studentId: number;
  onViewResults: () => void;
}

export function ExamCard({ exam, studentId, onViewResults }: ExamCardProps) {
  // Color coding by percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-blue-600 bg-blue-50";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 hover:border-primary/30"
      onClick={onViewResults}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              {exam.type}
            </Badge>
            <h3 className="font-semibold text-lg">{exam.month} Examination</h3>
            <p className="text-sm text-muted-foreground">Class {exam.class}</p>
          </div>
          <div className={`px-3 py-1 rounded-lg font-bold ${getPercentageColor(exam.percentage)}`}>
            {exam.percentage}%
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Percentage Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Score</span>
            <span className="font-bold">
              {exam.totalMarks}/{exam.maxMarks}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                exam.percentage >= 80
                  ? "bg-green-500"
                  : exam.percentage >= 60
                  ? "bg-blue-500"
                  : exam.percentage >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(exam.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Position */}
        {exam.position && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Position:</span>
            <span className="font-semibold flex items-center gap-1">
              {exam.position === 1 && <Trophy className="h-4 w-4 text-amber-500" />}
              #{exam.position} of {exam.totalStudents}
            </span>
          </div>
        )}

        {/* Subjects Count */}
        <div className="text-xs text-muted-foreground">
          {exam.subjectCount} subject{exam.subjectCount > 1 ? "s" : ""}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <button
          className="w-full text-sm text-primary font-medium hover:underline text-left flex items-center justify-between"
          onClick={(e) => {
            e.stopPropagation();
            onViewResults();
          }}
        >
          <span>View Class Results →</span>
          <span className="text-xs text-muted-foreground">
            {exam.totalStudents} students
          </span>
        </button>
      </CardFooter>
    </Card>
  );
}