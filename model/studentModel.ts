import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  guardianPhoneNumber?: string;
  batch: string; // "HSC" or "Admission"
  batchName: string;
  enrollmentDate: string;
  email?: string;
  // For HSC (monthly) students
  monthlyFee?: number;
  // For Admission (installment) students
  courseFee?: number;
  totalPaid?: number;
  installmentsPaid?: number;
}

const StudentSchema: Schema<IStudent> = new Schema(
  {
    fullName: { type: String, required: true },
    guardianName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    guardianPhoneNumber: { type: String, required: false },
    batch: { type: String, required: true },
    batchName: { type: String, required: true },
    enrollmentDate: { type: String, required: false },
    email: { type: String },
    // HSC monthly fee
    monthlyFee: { type: Number, default: 0 },
    // Admission course fee tracking
    courseFee: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    installmentsPaid: { type: Number, default: 0, min: 0, max: 3 },
  },
  { timestamps: true }
);

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;