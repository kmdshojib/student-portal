import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../db/db.config";
import Student from "../../../model/studentModel";

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const batch = searchParams.get("batch");
  const batchName = searchParams.get("batchName");

  const filter: any = {};
  if (batch) filter.batch = batch;
  if (batchName) filter.batchName = batchName;

  try {
    const students = await Student.find(filter);
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "fullName",
      "guardianName",
      "phoneNumber",
      "batch",
      "batchName"
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const student = new Student(body);
    await student.save();

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: "Student ID is required for update" }, { status: 400 });
    }

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
    );

    // Check if there's anything to update
    if (Object.keys(cleanUpdateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Find and update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      { $set: cleanUpdateData },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    console.error("Update student error:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: "Validation failed", details: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Find and delete the student
    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Student deleted successfully", 
      deletedStudent 
    }, { status: 200 });
  } catch (error) {
    console.error("Delete student error:", error);
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
