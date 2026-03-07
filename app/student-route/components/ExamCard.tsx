"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface ExamCardProps {
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
    percentage: number;
    position: number | null;
    totalStudents: number;
    subjectCount: number;
  };
  onViewDetails: () => void;
}

export function ExamCard({ exam, onViewDetails }: ExamCardProps) {

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 hover:border-primary/30"
      onClick={onViewDetails}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">{exam.type}</Badge>
            <h3 className="font-semibold text-lg">{exam.month} Examination</h3>
            <p className="text-sm text-muted-foreground">Class {exam.class}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Percentage Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Score</span>
            <span className="font-bold">{exam.percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                exam.percentage >= 80 ? "bg-green-500" :
                exam.percentage >= 60 ? "bg-blue-500" :
                exam.percentage >= 40 ? "bg-yellow-500" :
                "bg-red-500"
              }`}
              style={{ width: `${Math.min(exam.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Position */}
        {exam.position && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Position:</span>
            <span className="font-semibold">
              {exam.position}<sup className="text-xs">th</sup> of {exam.totalStudents}
            </span>
            {exam.position === 1 && <span className="text-amber-500">🏆</span>}
            {exam.position <= 3 && exam.position > 1 && <span className="text-gray-400">🥈</span>}
          </div>
        )}

        {/* Subjects Count */}
        <div className="text-xs text-muted-foreground">
          {exam.subjectCount} subject{exam.subjectCount > 1 ? "s" : ""}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <button 
          className="w-full text-sm text-primary font-medium hover:underline text-left"
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
        >
          View Detailed Result →
        </button>
      </CardFooter>
    </Card>
  );
}