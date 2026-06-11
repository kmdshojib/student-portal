import mongoose, { Schema, Document, models, model } from "mongoose"

export interface IExamMark extends Document {
  studentId: string
  studentName: string
  examName: string
  marks: number
  totalMarks: number
  date: string
  batch?: string
  batchName?: string
  smsSent: boolean
  smsSentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ExamMarkSchema = new Schema<IExamMark>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    examName: { type: String, required: true },
    marks: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    date: { type: String, required: true },
    batch: { type: String },
    batchName: { type: String },
    smsSent: { type: Boolean, default: false },
    smsSentAt: { type: Date },
  },
  { timestamps: true }
)

// Clear cached model in development to prevent OverwriteModelError
const ExamMark = models.ExamMark || model<IExamMark>("ExamMark", ExamMarkSchema)

export default ExamMark