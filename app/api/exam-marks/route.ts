import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/db/db.config"
import ExamMark from "@/model/examMarkModel"

async function resolveStudentModel() {
  try {
    const mod = await import("@/model/studentModel")
    return (mod && (mod.default || mod)) as any
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  await dbConnect()
  const marks = await ExamMark.find().lean()
  return NextResponse.json(marks)
}

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    const data = await req.json()

    if (!data.studentId || !data.examName || data.marks == null || data.totalMarks == null || !data.date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    data.marks = Number(data.marks)
    data.totalMarks = Number(data.totalMarks)
    data.studentId = String(data.studentId)

    // If client did not provide studentName, try to resolve from Student model
    if (!data.studentName) {
      const Student = await resolveStudentModel()
      if (Student) {
        let student = null
        try {
          student = await Student.findById(data.studentId).lean()
        } catch {
          student = null
        }
        if (!student) {
          student = await Student.findOne({ $or: [{ id: data.studentId }, { _id: data.studentId }] }).lean()
        }
        if (student) {
          data.studentName = student.fullName || student.name || ""
        }
      }
    }

    // Final validation: studentName required by schema
    data.studentName = String(data.studentName || "").trim()
    if (!data.studentName) {
      return NextResponse.json({ error: "studentName not found for given studentId" }, { status: 400 })
    }

    const newMark = await ExamMark.create(data)
    return NextResponse.json(newMark, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}