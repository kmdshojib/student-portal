// Mock data structure for the student management system
export interface Student {
  id: string
  fullName: string
  guardianName: string
  phoneNumber: string
  batch?: string
  batchName?: string
  enrollmentDate?: string
  totalFees: number
  paidFees: number
  email?: string
}

export interface Payment {
  id: string
  studentId: string
  amount: number
  date: string
  status: "paid" | "pending" | "overdue"
  description: string
  duePayment: number
}

export interface Attendance {
  id: string
  studentId: string
  date: string
  status: "present" | "absent" | "leave"
}

export interface ExamMark {
  id: string
  studentId: string
  examName: string
  marks: number
  totalMarks: number
  date: string
  batch?: string
  batchName?: string
}

// Mock students data
export const mockStudents: Student[] = [
  {
    id: "1",
    fullName: "Aarav Sharma",
    guardianName: "Rajesh Sharma",
    phoneNumber: "9876543210",
    batch: "2024",
    batchName: "Morning",
    enrollmentDate: "2024-01-15",
    totalFees: 50000,
    paidFees: 35000,
    email: "aarav@example.com",
  },
  {
    id: "2",
    fullName: "Priya Patel",
    guardianName: "Vikram Patel",
    phoneNumber: "9876543211",
    batch: "2024",
    batchName: "Morning",
    enrollmentDate: "2024-01-16",
    totalFees: 50000,
    paidFees: 50000,
    email: "priya@example.com",
  },
  {
    id: "3",
    fullName: "Rohan Kumar",
    guardianName: "Amit Kumar",
    phoneNumber: "9876543212",
    batch: "2024",
    batchName: "Evening",
    enrollmentDate: "2024-01-17",
    totalFees: 50000,
    paidFees: 0,
    email: "rohan@example.com",
  },
  {
    id: "4",
    fullName: "Neha Singh",
    guardianName: "Suresh Singh",
    phoneNumber: "9876543213",
    batch: "2025",
    batchName: "Morning",
    enrollmentDate: "2024-02-01",
    totalFees: 50000,
    paidFees: 25000,
    email: "neha@example.com",
  },
  {
    id: "5",
    fullName: "Arjun Verma",
    guardianName: "Deepak Verma",
    phoneNumber: "9876543214",
    batch: "2025",
    batchName: "Evening",
    enrollmentDate: "2024-02-02",
    totalFees: 50000,
    paidFees: 50000,
    email: "arjun@example.com",
  },
]

// Mock payments data
export const mockPayments: Payment[] = [
  { id: "p1", studentId: "1", amount: 5000, date: "2024-01-20", status: "paid", description: "Tuition Fee", duePayment: 0 },
  { id: "p2", studentId: "1", amount: 1000, date: "2024-02-20", status: "paid", description: "Lab Fee", duePayment: 0 },
  { id: "p3", studentId: "2", amount: 5000, date: "2024-01-25", status: "pending", description: "Tuition Fee", duePayment: 5000 },
  { id: "p4", studentId: "3", amount: 5000, date: "2024-01-18", status: "overdue", description: "Tuition Fee", duePayment: 5000 },
  { id: "p5", studentId: "4", amount: 5000, date: "2024-02-10", status: "paid", description: "Tuition Fee", duePayment: 0 },
]

// Mock attendance data
export const mockAttendance: Attendance[] = [
  { id: "a1", studentId: "1", date: "2024-10-20", status: "present" },
  { id: "a2", studentId: "1", date: "2024-10-21", status: "present" },
  { id: "a3", studentId: "1", date: "2024-10-22", status: "absent" },
  { id: "a4", studentId: "2", date: "2024-10-20", status: "present" },
  { id: "a5", studentId: "2", date: "2024-10-21", status: "leave" },
  { id: "a6", studentId: "3", date: "2024-10-20", status: "present" },
  { id: "a7", studentId: "4", date: "2024-10-20", status: "absent" },
]

// Mock exam marks data
export const mockExamMarks: ExamMark[] = [
  { id: "m1", studentId: "1", examName: "Mathematics", marks: 85, totalMarks: 100, date: "2024-10-15", batch: "2024", batchName: "Morning" },
  { id: "m2", studentId: "1", examName: "English", marks: 78, totalMarks: 100, date: "2024-10-16", batch: "2024", batchName: "Morning" },
  { id: "m3", studentId: "2", examName: "Mathematics", marks: 92, totalMarks: 100, date: "2024-10-15", batch: "2024", batchName: "Morning" },
  { id: "m4", studentId: "2", examName: "English", marks: 88, totalMarks: 100, date: "2024-10-16", batch: "2024", batchName: "Morning" },
  { id: "m5", studentId: "3", examName: "Mathematics", marks: 76, totalMarks: 100, date: "2024-10-15", batch: "2024", batchName: "Evening" },
]
