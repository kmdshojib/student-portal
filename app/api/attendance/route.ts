import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../db/db.config";
import Attendance from "../../../model/attendanceModel";
import Student from "../../../model/studentModel";

// GET: Fetch attendance records (optionally by studentId or date)
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const date = searchParams.get("date");

  const filter: any = {};
  if (studentId) filter.studentId = studentId;
  if (date) filter.date = date;

  try {
    const records = await Attendance.find(filter);
    return NextResponse.json(records, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST: Mark attendance
export async function POST(req: NextRequest) {
  await dbConnect();
  const { studentId, date, status } = await req.json();

  if (!studentId || !date || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // Upsert attendance status (no per-attendance payment)
    const record = await Attendance.findOneAndUpdate(
      { studentId, date },
      { status },
      { upsert: true, new: true }
    );
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}

// PATCH: only used for monthly payment toggles (markMonthly)
export async function PATCH(req: NextRequest) {
  await dbConnect();
  const { studentId, isPaid, markMonthly } = await req.json();

  try {
    let studentUpdateResult = null;
    if (markMonthly && studentId) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthValue = isPaid ? currentMonth : null;
      studentUpdateResult = await Student.findByIdAndUpdate(
        studentId,
        { $set: { monthPaidUntil: monthValue } },
        { new: true }
      ).catch(() => null);
    } else {
      return NextResponse.json({ error: "Unsupported PATCH operation. Use markMonthly for monthly payments." }, { status: 400 });
    }

    return NextResponse.json({ student: studentUpdateResult }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
  }
}