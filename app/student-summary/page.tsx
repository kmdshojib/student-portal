"use client"

import { useState } from "react"
import Link from "next/link"
import { mockStudents, mockPayments, mockAttendance, mockExamMarks } from "@/lib/mock-data"

export default function StudentSummaryPage() {
  const [selectedStudent, setSelectedStudent] = useState<string>(mockStudents[0]?.id || "")

  const student = mockStudents.find((s) => s.id === selectedStudent)
  const studentPayments = mockPayments.filter((p) => p.studentId === selectedStudent)
  const studentAttendance = mockAttendance.filter((a) => a.studentId === selectedStudent)
  const studentMarks = mockExamMarks.filter((m) => m.studentId === selectedStudent)

  const totalPayments = studentPayments.reduce((sum, p) => sum + p.amount, 0)
  const paidPayments = studentPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const pendingPayments = totalPayments - paidPayments

  const presentDays = studentAttendance.filter((a) => a.status === "present").length
  const absentDays = studentAttendance.filter((a) => a.status === "absent").length
  const leaveDays = studentAttendance.filter((a) => a.status === "leave").length
  const attendancePercentage =
    studentAttendance.length > 0 ? ((presentDays / studentAttendance.length) * 100).toFixed(2) : 0

  const averageMarks =
    studentMarks.length > 0
      ? (studentMarks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0) / studentMarks.length).toFixed(2)
      : 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Summary</h1>
            <p className="text-gray-600">Complete student profile and performance overview</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Back to Dashboard
          </Link>
        </div>

        {/* Student Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {mockStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        {student && (
          <>
            {/* Student Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{student.fullName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Guardian Name</p>
                  <p className="text-lg font-semibold text-gray-900">{student.guardianName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-semibold text-gray-900">{student.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{student.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="text-lg font-semibold text-gray-900">{student.batch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Name</p>
                  <p className="text-lg font-semibold text-gray-900">{student.batchName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrollment Date</p>
                  <p className="text-lg font-semibold text-gray-900">{student.enrollmentDate}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Total Fees</p>
                <p className="text-3xl font-bold text-gray-900">৳{student.totalFees.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Paid Fees</p>
                <p className="text-3xl font-bold text-green-600">৳{student.paidFees.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Pending Fees</p>
                <p className="text-3xl font-bold text-red-600">
                  ৳{(student.totalFees - student.paidFees).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <p
                  className={`text-lg font-bold ${
                    student.paidFees === student.totalFees ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {student.paidFees === student.totalFees ? "Paid" : "Pending"}
                </p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Attendance %</p>
                <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Present Days</p>
                <p className="text-3xl font-bold text-green-600">{presentDays}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Absent Days</p>
                <p className="text-3xl font-bold text-red-600">{absentDays}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Leave Days</p>
                <p className="text-3xl font-bold text-yellow-600">{leaveDays}</p>
              </div>
            </div>

            {/* Exam Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Average Marks</h3>
                <p className="text-4xl font-bold text-purple-600">{averageMarks}%</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Subject-wise Marks</h3>
                <div className="space-y-3">
                  {studentMarks.length > 0 ? (
                    studentMarks.map((mark) => (
                      <div key={mark.id} className="flex justify-between items-center">
                        <span className="text-gray-700">{mark?.examName}</span>
                        <span className="font-semibold text-gray-900">
                          {mark.marks}/{mark.totalMarks}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No exam marks recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPayments.length > 0 ? (
                      studentPayments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{payment.description}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ৳{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.date}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                payment.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No payment records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
