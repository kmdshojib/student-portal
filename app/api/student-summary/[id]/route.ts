import { NextRequest, NextResponse } from "next/server";
import Student from "@/model/studentModel";
import Attendance from "@/model/attendanceModel";
import ExamMark from "@/model/examMarkModel";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await the params object to resolve the Promise

  // Fetch student info
  const student = await Student.findById(id).lean();
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Fetch attendance records
  const attendance = await Attendance.find({ studentId: id }).lean();
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendancePercentage =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Fetch exam marks
  const examMarks = await ExamMark.find({ studentId: id }).lean();
  const averageMarks =
    examMarks.length > 0
      ? Math.round(
          examMarks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0) / examMarks.length
        )
      : 0;

  // Helper for grade
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "D";
  };

  // Attach grade and percentage to each mark
  const examMarksWithGrades = examMarks.map((m) => {
    const percentage = Math.round((m.marks / m.totalMarks) * 100);
    return {
      id: m._id,
      subject: m.examName,
      marks: m.marks,
      totalMarks: m.totalMarks,
      date: m.date,
      percentage,
      grade: getGrade(percentage),
    };
  });

  return NextResponse.json({
    student: {
      id: student._id,
      fullName: student.fullName,
      guardianName: student.guardianName,
      batch: student.batch,
      batchName: student.batchName,
      phoneNumber: student.phoneNumber,
    },
    attendance: {
      percentage: attendancePercentage,
      records: attendance.map((a) => ({
        id: a._id,
        date: a.date,
        status: a.status,
      })),
    },
    examMarks: {
      average: averageMarks,
      records: examMarksWithGrades,
    },
  });
}