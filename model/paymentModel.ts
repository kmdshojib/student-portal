import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  studentId: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  description: string;
  duePayment: number;
  paymentType: "monthly" | "installment"; // NEW: Type of payment
  // For monthly payments (HSC)
  paymentMonth?: string; // e.g., "2026-01"
  // For installment payments (Admission)
  installmentNumber?: 1 | 2 | 3;
  courseFee?: number;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    studentId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      required: true,
    },
    description: { type: String, required: true },
    duePayment: { type: Number, required: true, default: 0 },
    paymentType: {
      type: String,
      enum: ["monthly", "installment"],
      required: true,
    },
    // Monthly payment fields
    paymentMonth: { type: String },
    // Installment payment fields
    installmentNumber: { type: Number, enum: [1, 2, 3] },
    courseFee: { type: Number },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate monthly payments
// Using partialFilterExpression instead of sparse for better control
PaymentSchema.index(
  { studentId: 1, paymentMonth: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentMonth: { $exists: true },
      paymentType: "monthly"
    }
  }
);

// Compound index to prevent duplicate installments
PaymentSchema.index(
  { studentId: 1, installmentNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      installmentNumber: { $exists: true },
      paymentType: "installment"
    }
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;