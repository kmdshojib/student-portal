import { NextRequest, NextResponse } from "next/server"
import ExamMark from "@/model/examMarkModel"
import dbConnect from "@/db/db.config"

// Public endpoint for viewing exam results - no authentication required
export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    const { searchParams } = new URL(req.url)
    const batchName = searchParams.get("batchName")
    const examName = searchParams.get("examName")

    // Build query based on optional filters
    const query: Record<string, string> = {}
    if (batchName) query.batchName = batchName
    if (examName) query.examName = examName

    const marks = await ExamMark.find(query)
      .select("studentId studentName examName marks totalMarks date batch batchName")
      .lean()

    return NextResponse.json(marks)
  } catch (error: any) {
    console.error("Error fetching public results:", error)
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    )
  }
}