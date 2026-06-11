import { NextResponse } from "next/server";
import dbConnect from "../../../../db/db.config";
import Student from "../../../../model/studentModel";

export async function GET() {
  await dbConnect();
  try {
    // Get distinct batch years and batch names
    const batches = await Student.distinct("batch");
    const batchNames = await Student.distinct("batchName");
    return NextResponse.json({ batches, batchNames }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}