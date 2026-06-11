import dbConnect from "@/db/db.config";
import Student from "@/model/studentModel";
import { NextRequest, NextResponse } from "next/server";

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