import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendance extends Document {
  studentId: string;
  date: string;
  status: "present" | "absent" | "leave";
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    studentId: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "leave"], required: true },
  },
  { timestamps: true }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;