"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  _id: string;
  fullName: string;
  batch: string;
  batchName: string;
  monthlyFee?: number;
  courseFee?: number;
  totalPaid?: number;
  installmentsPaid?: number;
}

interface Attendance {
  _id?: string;
  studentId: string;
  date: string;
  status: "present" | "absent" | "leave";
}

interface Payment {
  _id: string;
  studentId: string | { _id: string };
  amount: number;
  paymentType: "monthly" | "installment";
  paymentMonth?: string;
  installmentNumber?: 1 | 2 | 3;
  status: "paid" | "pending" | "overdue";
  date: string;
  courseFee?: number;
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const currentMonthStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  })();

  const getStudentIdFromPayment = (payment: Payment): string => {
    if (!payment.studentId) return "";
    if (typeof payment.studentId === "string") {
      return payment.studentId;
    }
    if (typeof payment.studentId === "object" && payment.studentId._id) {
      return payment.studentId._id;
    }
    return String(payment.studentId);
  };

  // Load students
  async function loadStudents() {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      const normalized = (data || []).map((s: Student & { id?: string }) => ({
        ...s,
        _id: String(s._id || s.id || ""),
      }));
      setStudents(normalized);
      return normalized;
    } catch (err) {
      console.error("Failed to load students:", err);
      return [];
    }
  }

  // Load payments
  async function loadPayments() {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      console.log("Loaded payments:", data);
      setPayments(data || []);
      return data;
    } catch (err) {
      console.error("Failed to load payments:", err);
      return [];
    }
  }

  // Fetch students and payments from API
  useEffect(() => {
    loadStudents();
    loadPayments();
  }, []);

  // Fetch attendance for selected date
  useEffect(() => {
    if (selectedDate) {
      fetch(`/api/attendance?date=${selectedDate}`)
        .then((res) => res.json())
        .then(setAttendanceData)
        .catch((err) => console.error("Failed to load attendance:", err));
    }
  }, [selectedDate]);

  // Check if student is HSC batch
  const isHSCStudent = (studentId: string): boolean => {
    const student = students.find((s) => String(s._id) === String(studentId));
    return student?.batch?.toLowerCase().includes("hsc") || false;
  };

  // Check if HSC student has paid for current month
  const isStudentPaidThisMonth = (studentId: string): boolean => {
    const studentIdStr = String(studentId);

    for (const p of payments) {
      const paymentStudentId = String(getStudentIdFromPayment(p));

      // Check if this payment matches the student and current month
      if (
        paymentStudentId === studentIdStr &&
        p.paymentType === "monthly" &&
        p.paymentMonth === currentMonthStr &&
        p.status === "paid"
      ) {
        console.log("Found matching payment for student:", studentIdStr, p);
        return true;
      }
    }

    return false;
  };

  // Get installment payment status for Admission students
  const getInstallmentStatus = (
    studentId: string
  ): {
    paid: number;
    total: 3;
    nextInstallment: 1 | 2 | 3 | null;
    courseFee: number;
    overdueAmount: number;
  } => {
    const studentIdStr = String(studentId);
    const student = students.find((s) => String(s._id) === studentIdStr);

    // Get course fee and total paid from student record
    const courseFee = student?.courseFee || 0;
    const totalPaid = student?.totalPaid || 0;
    const installmentsPaid = student?.installmentsPaid || 0;

    // Calculate overdue amount directly from student data
    const overdueAmount = courseFee - totalPaid;

    let nextInstallment: 1 | 2 | 3 | null = null;
    if (installmentsPaid < 1) nextInstallment = 1;
    else if (installmentsPaid < 2) nextInstallment = 2;
    else if (installmentsPaid < 3) nextInstallment = 3;

    return {
      paid: installmentsPaid,
      total: 3,
      nextInstallment,
      courseFee,
      overdueAmount: overdueAmount > 0 ? overdueAmount : 0,
    };
  };

  const DEFAULT_MONTHLY_FEE = 700;

  const handleQuickPay = async (studentId: string) => {
    const student = students.find((s) => String(s._id) === String(studentId));
    if (!student) {
      alert("Student not found");
      return;
    }

    console.log("Quick pay for student:", student);

    setIsProcessing(studentId);

    try {
      const isHSC = isHSCStudent(studentId);
      const today = new Date().toISOString().split("T")[0];

      if (isHSC) {
        // Check if already paid
        if (isStudentPaidThisMonth(studentId)) {
          alert("This month is already paid!");
          setIsProcessing(null);
          return;
        }

        // Use student's monthly fee or default to 600
        const monthlyFee = student.monthlyFee || DEFAULT_MONTHLY_FEE;

        const requestBody = {
          studentId: String(student._id),
          amount: monthlyFee,
          date: today,
          status: "paid",
          paymentType: "monthly",
          paymentMonth: currentMonthStr,
          description: `Monthly Tuition Fee - ${currentMonthStr}`,
        };

        console.log("Sending monthly payment request:", requestBody);

        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        console.log("Payment response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.error || "Failed to create payment");
        }

        alert(`Payment recorded successfully! Amount: ৳${monthlyFee}`);
      } else {
        // Create installment payment for Admission student
        const { nextInstallment, courseFee: existingCourseFee } =
          getInstallmentStatus(studentId);

        if (nextInstallment === null) {
          alert("All installments are already paid!");
          setIsProcessing(null);
          return;
        }

        const courseFee = existingCourseFee || student.courseFee || 0;

        if (!courseFee || courseFee <= 0) {
          alert("Please set course fee first in Batch Payments page.");
          setIsProcessing(null);
          return;
        }

        const installmentAmount = Math.round(courseFee / 3);

        const requestBody = {
          studentId: String(student._id),
          amount: installmentAmount,
          date: today,
          status: "paid",
          paymentType: "installment",
          installmentNumber: nextInstallment,
          courseFee: courseFee,
          description: `Course Fee - Installment ${nextInstallment}`,
        };

        console.log("Sending installment payment request:", requestBody);

        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        console.log("Payment response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.error || "Failed to create payment");
        }

        alert(
          `Installment ${nextInstallment} recorded successfully! Amount: ৳${installmentAmount}`
        );
      }

      // Refresh payments data
      await loadPayments();
    } catch (error) {
      console.error("Quick pay error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  // Get unique batches and batch names
  const batches = Array.from(new Set(students.map((s) => s.batch)));
  const batchNames = Array.from(
    new Set(
      students
        .filter((s) => !selectedBatch || s.batch === selectedBatch)
        .map((s) => s.batchName)
    )
  );

  // Filter students based on batch and batch name
  const filteredStudents = students.filter((student) => {
    const batchMatch = !selectedBatch || student.batch === selectedBatch;
    const batchNameMatch =
      !selectedBatchName || student.batchName === selectedBatchName;
    return batchMatch && batchNameMatch;
  });

  // Check if selected batch is HSC (hide overdue column for HSC)
  const isHSCBatch = selectedBatch?.toLowerCase().includes("hsc") || false;

  const markAttendance = async (
    studentId: string,
    status: "present" | "absent" | "leave"
  ) => {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date: selectedDate, status }),
    });
    // Refresh attendance data
    fetch(`/api/attendance?date=${selectedDate}`)
      .then((res) => res.json())
      .then(setAttendanceData);
  };

  const getAttendanceStatus = (studentId: string) => {
    return attendanceData.find(
      (a) => a.studentId === studentId && a.date === selectedDate
    )?.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "leave":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const presentCount = filteredStudents.filter(
    (s) => getAttendanceStatus(s._id) === "present"
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => getAttendanceStatus(s._id) === "absent"
  ).length;
  const leaveCount = filteredStudents.filter(
    (s) => getAttendanceStatus(s._id) === "leave"
  ).length;

  // Get payment badge for student
  const getPaymentBadge = (studentId: string) => {
    const isHSC = isHSCStudent(studentId);
    const isLoading = isProcessing === studentId;

    if (isHSC) {
      const isPaid = isStudentPaidThisMonth(studentId);

      if (isPaid) {
        return (
          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-green-500 text-white">
            ✓ Paid ({currentMonthStr})
          </span>
        );
      }

      return (
        <button
          onClick={() => handleQuickPay(studentId)}
          disabled={isLoading}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition cursor-pointer ${
            isLoading
              ? "bg-gray-400 text-white cursor-wait"
              : "bg-yellow-500 text-white hover:bg-green-500"
          }`}
          title="Click to mark as paid (৳600)"
        >
          {isLoading ? "Processing..." : `Unpaid - Click to Pay`}
        </button>
      );
    } else {
      const { paid, total, nextInstallment } = getInstallmentStatus(studentId);
      const isComplete = paid >= total;

      if (isComplete) {
        return (
          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-green-500 text-white">
            ✓ Complete ({paid}/{total})
          </span>
        );
      }

      return (
        <button
          onClick={() => handleQuickPay(studentId)}
          disabled={isLoading}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition cursor-pointer ${
            isLoading
              ? "bg-gray-400 text-white cursor-wait"
              : paid > 0
              ? "bg-blue-500 text-white hover:bg-green-500"
              : "bg-yellow-500 text-white hover:bg-green-500"
          }`}
          title={`Click to pay installment ${nextInstallment}`}
        >
          {isLoading
            ? "Processing..."
            : `${paid}/${total} - Pay #${nextInstallment}`}
        </button>
      );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Attendance Tracking
            </h1>
            <p className="text-gray-600">
              Mark attendance batch-wise • Click on unpaid to mark as paid (৳
              {DEFAULT_MONTHLY_FEE})
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/batch-payments"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Collect Payments
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filter & Select Date
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Year
              </label>
              <select
                title="batch"
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setSelectedBatchName("");
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name
              </label>
              <select
                title="batchName"
                value={selectedBatchName}
                onChange={(e) => setSelectedBatchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batch Names</option>
                {batchNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                title="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Month
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                {currentMonthStr}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Present</div>
            <div className="text-3xl font-bold text-green-600">
              {presentCount}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Absent</div>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            {/* <div className="text-sm text-gray-600 mb-1">Leave</div> */}
            <div className="text-3xl font-bold text-blue-600">{leaveCount}</div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Mark Attendance - {selectedDate}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Payment Status
                  </th>
                  {!isHSCBatch && (
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Overdue
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => {
                    const status = getAttendanceStatus(student._id);
                    return (
                      <tr
                        key={student._id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {student.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.batchName}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              markAttendance(student._id, "present")
                            }
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                              status === "present"
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-green-200"
                            }`}
                          >
                            ✓
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              markAttendance(student._id, "absent")
                            }
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                              status === "absent"
                                ? "bg-red-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-red-200"
                            }`}
                          >
                            ✗
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getPaymentBadge(student._id)}
                        </td>
                        {!isHSCBatch && (
                          <td className="px-6 py-4 text-center">
                            {(() => {
                              const { overdueAmount } = getInstallmentStatus(student._id);
                              return overdueAmount > 0 ? (
                                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-red-500 text-white">
                                  ৳{overdueAmount}
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
                                  ৳0
                                </span>
                              );
                            })()}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm">
                          {status ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                status
                              )}`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not marked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={isHSCBatch ? 7 : 8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No students found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
