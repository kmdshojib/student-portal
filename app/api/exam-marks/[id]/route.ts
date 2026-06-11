import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/db/db.config";
import ExamMark from "@/model/examMarkModel";

// GET single exam mark
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const examMark = await ExamMark.findById(id);
    if (!examMark) {
      return NextResponse.json(
        { error: "Exam mark not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(examMark);
  } catch (error) {
    console.error("Error fetching exam mark:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam mark" },
      { status: 500 }
    );
  }
}

// PATCH - Update exam mark (including SMS status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();
    
    // Build update object - only include fields that are provided
    const updateData: Record<string, any> = {};
    
    if (body.marks !== undefined) updateData.marks = Number(body.marks);
    if (body.totalMarks !== undefined) updateData.totalMarks = Number(body.totalMarks);
    if (body.date !== undefined) updateData.date = body.date;
    if (body.examName !== undefined) updateData.examName = body.examName;
    if (body.studentName !== undefined) updateData.studentName = body.studentName;
    if (body.batch !== undefined) updateData.batch = body.batch;
    if (body.batchName !== undefined) updateData.batchName = body.batchName;
    
    // Handle SMS status update
    if (body.smsSent !== undefined) {
      updateData.smsSent = Boolean(body.smsSent);
    }
    if (body.smsSentAt !== undefined) {
      updateData.smsSentAt = new Date(body.smsSentAt);
    }

    console.log("Updating exam mark:", id, "with data:", updateData);

    const updatedMark = await ExamMark.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMark) {
      return NextResponse.json(
        { error: "Exam mark not found" },
        { status: 404 }
      );
    }

    console.log("Updated exam mark:", updatedMark);
    return NextResponse.json(updatedMark);
  } catch (error) {
    console.error("Error updating exam mark:", error);
    return NextResponse.json(
      { error: "Failed to update exam mark" },
      { status: 500 }
    );
  }
}

// DELETE exam mark
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const deletedMark = await ExamMark.findByIdAndDelete(id);

    if (!deletedMark) {
      return NextResponse.json(
        { error: "Exam mark not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Exam mark deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam mark:", error);
    return NextResponse.json(
      { error: "Failed to delete exam mark" },
      { status: 500 }
    );
  }
}