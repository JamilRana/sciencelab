export type Role = "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: Role;
  active: boolean;
}

export interface School {
  id: number;
  name: string;
  students?: Student[];
}

export interface Batch {
  id: number;
  classId: string;
  name: string;
  code: number;
  students?: Student[];
}

export interface Student {
  id: number;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile: string;
  image: string;
  active: boolean;
  schoolId: number;
  batchId: number;
  roll: number;
  address: string;
  gender: string;
  email: string;
  dob: Date | null;
  class: string;
  userId?: number | null;
  school?: School;
  batch?: Batch;
  receipts?: Receipt[];
  marks?: Mark[];
}

export interface Teacher {
  id: number;
  name: string;
  mobile: string;
  image: string;
  gender: string;
  email: string;
  perClass: number;
  due: number;
  userId?: number | null;
  examSubjects?: ExamSubject[];
}

export interface Exam {
  id: number;
  type: string;
  month: string;
  class: string;
  subjects?: ExamSubject[];
}

export interface ExamSubject {
  id: number;
  examId: number;
  subject: string;
  teacherId: number;
  totalMark: number;
  examDate: Date;
  status: number;
  topics: string;
  teacher?: Teacher;
  exam?: Exam;
  marks?: Mark[];
}

export interface Mark {
  id: number;
  examSubjectId: number;
  studentId: number;
  written: number;
  objective: number;
  student?: Student;
  examSubject?: ExamSubject;
}

export interface Receipt {
  id: number;
  studentId: number;
  month: string;
  amount: number;
  date: Date;
  student?: Student;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: Date;
}

export interface BatchWithCount extends Batch {
  _count?: {
    students: number;
  };
}

export interface StudentWithRelations extends Student {
  school?: School;
  batch?: Batch;
}

export interface TeacherWithSubjects extends Teacher {
  examSubjects: ExamSubjectWithExam[];
}

export interface ExamSubjectWithExam extends ExamSubject {
  exam: Exam;
  marks?: MarkWithStudent[];
}

export interface MarkWithStudent extends Mark {
  student: Student;
}

export interface ExamWithSubjects extends Exam {
  subjects: ExamSubjectWithTeacher[];
}

export interface ExamSubjectWithTeacher extends ExamSubject {
  teacher?: Teacher;
  marks?: MarkWithStudent[];
}

export interface StudentFilterParams {
  search?: string;
  class?: string;
  batchId?: number;
  page?: number;
}

export interface ExamFilterParams {
  search?: string;
  class?: string;
  type?: string;
  month?: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Form types
export interface StudentFormValues {
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile?: string;
  address: string;
  gender: string;
  email?: string;
  dob?: string;
  class: string;
  schoolId: string;
  batchId: string;
}

export interface TeacherFormValues {
  name: string;
  mobile: string;
  gender: string;
  email?: string;
  perClass?: string;
}

export interface ExamFormValues {
  type: string;
  month: string;
  class: string;
}

export interface BatchFormValues {
  classId: string;
  name: string;
}

export interface SubjectFormValues {
  subject: string;
  teacherId: string;
  totalMark: string;
  examDate: string;
  topics?: string;
}

export interface ReceiptFormValues {
  studentId: string;
  month: string;
  amount: string;
  date: string;
}

export interface ExpenseFormValues {
  description: string;
  amount: string;
  date: string;
}

export interface MarkFormValues {
  examSubjectId: number;
  studentId: number;
  written?: number;
  objective?: number;
}

// Service result type
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Prisma where input types
export interface PrismaStudentWhereInput {
  AND?: PrismaStudentWhereInput[];
  OR?: PrismaStudentWhereInput[];
  NOT?: PrismaStudentWhereInput[];
  id?: number;
  name?: string;
  fatherName?: string;
  motherName?: string;
  mobile?: string;
  active?: boolean;
  class?: string;
  batchId?: number;
  schoolId?: number;
  roll?: number;
}

export interface PrismaExamWhereInput {
  AND?: PrismaExamWhereInput[];
  OR?: PrismaExamWhereInput[];
  NOT?: PrismaExamWhereInput[];
  id?: number;
  type?: string;
  month?: string;
  class?: string;
}
