-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'STUDENT', 'TEACHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" SERIAL NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "smsMobile" TEXT NOT NULL,
    "homeMobile" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "dob" TIMESTAMP(3),
    "class" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "perClass" INTEGER NOT NULL DEFAULT 0,
    "due" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "class" TEXT NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_subjects" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "totalMark" INTEGER NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "topics" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "exam_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" SERIAL NOT NULL,
    "examSubjectId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "written" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "objective" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabuses" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "month" TEXT NOT NULL,

    CONSTRAINT "syllabuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_class_logs" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "classes" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT NOT NULL,
    "notebook" INTEGER NOT NULL DEFAULT 0,
    "other" INTEGER NOT NULL DEFAULT 0,
    "paid" INTEGER NOT NULL DEFAULT 0,
    "perClass" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "teacher_class_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_mobile_key" ON "teachers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "marks_examSubjectId_studentId_key" ON "marks"("examSubjectId", "studentId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "exam_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_class_logs" ADD CONSTRAINT "teacher_class_logs_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
