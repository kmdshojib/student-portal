import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/db/db.config"
import Student from "@/model/studentModel"
import Attendance from "@/model/attendanceModel"
import ExamMark from "@/model/examMarkModel"

export async function GET(req: NextRequest) {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 })
  }

  // Get student
  const student = await Student.findOne({ $or: [{ _id: studentId }, { id: studentId }] }).lean()
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  // Attendance summary
  const attendance = await Attendance.find({ studentId }).lean()
  const totalAttendance = attendance.length
  const presentCount = attendance.filter((a) => a.status === "present").length
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  // Exam marks summary
  const marks = await ExamMark.find({ studentId }).lean()
  const averageMarks =
    marks.length > 0
      ? Math.round(marks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0) / marks.length)
      : 0

  // Optionally, you can return all marks and attendance if you want to show details
  return NextResponse.json({
    student,
    attendance: {
      total: totalAttendance,
      present: presentCount,
      percentage: attendancePercentage,
      records: attendance,
    },
    marks: {
      average: averageMarks,
      records: marks,
    },
  })
}