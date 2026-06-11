"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Student {
  _id: string;
  fullName: string;
  batch: string;
  batchName: string;
  phone?: string;
  phoneNumber?: string;
  monthlyFee?: number;
  courseFee?: number;
  totalPaid?: number;
  installmentsPaid?: number;
}

interface Payment {
  _id: string;
  studentId: string;
  amount: number;
  paymentType: "monthly" | "installment";
  paymentMonth?: string;
  installmentNumber?: 1 | 2 | 3;
  status: "paid" | "pending" | "overdue";
  date: string;
  courseFee?: number;
  description?: string;
}

interface PaymentInput {
  studentId: string;
  amount: string;
  selected: boolean;
  // For monthly
  alreadyPaidThisMonth?: boolean;
  // For installment
  nextInstallment?: 1 | 2 | 3 | null;
  courseFee?: number;
  totalPaid?: number;
}

const preventNumberInputScroll = (
  e: React.WheelEvent<HTMLInputElement>
) => {
  // Prevent accidental number input changes while scrolling.
  e.currentTarget.blur();
};

// Payment Summary Modal Component
function PaymentSummaryModal({
  student,
  payments,
  isOpen,
  onClose,
  onPaymentUpdated,
}: {
  student: Student | null;
  payments: Payment[];
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated: () => void;
}) {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const studentPayments = payments
    .filter((p) => p.studentId === student._id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPaid = studentPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  // Determine if student is HSC (monthly) or Admission (installment)
  const isHSCStudent = student.batch?.toLowerCase().includes("hsc");

  // Calculate due amount
  const calculateDueAmount = () => {
    if (isHSCStudent) {
      // For HSC students, check current month payment
      const currentMonth = new Date().toISOString().slice(0, 7);
      const paidThisMonth = studentPayments.some(
        (p) =>
          p.paymentType === "monthly" &&
          p.paymentMonth === currentMonth &&
          p.status === "paid"
      );
      return paidThisMonth ? 0 : student.monthlyFee || 700;
    } else {
      // For Admission students, calculate remaining course fee
      const courseFee = studentPayments[0]?.courseFee || student.courseFee || 0;
      const installmentPayments = studentPayments.filter(
        (p) => p.paymentType === "installment" && p.status === "paid"
      );
      const totalInstallmentPaid = installmentPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      return Math.max(0, courseFee - totalInstallmentPaid);
    }
  };

  const dueAmount = calculateDueAmount();

  // Get course fee for installment students
  const getCourseFee = () => {
    if (isHSCStudent) return null;
    return studentPayments[0]?.courseFee || student.courseFee || 0;
  };

  const courseFee = getCourseFee();

  // Get installments paid count
  const getInstallmentsPaid = () => {
    if (isHSCStudent) return null;
    return studentPayments.filter(
      (p) => p.paymentType === "installment" && p.status === "paid"
    ).length;
  };

  const installmentsPaid = getInstallmentsPaid();

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(String(payment.amount));
    setEditStatus(payment.status);
    setEditDate(payment.date.split("T")[0]);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditAmount("");
    setEditStatus("");
    setEditDate("");
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/payments/${editingPayment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editAmount),
          status: editStatus,
          date: editDate,
        }),
      });

      if (res.ok) {
        alert("Payment updated successfully!");
        handleCancelEdit();
        onPaymentUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to update payment. " + (err?.error || ""));
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred while updating.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Payment deleted successfully!");
        onPaymentUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to delete payment. " + (err?.error || ""));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentTypeBadge = (payment: Payment) => {
    if (payment.paymentType === "monthly") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Monthly - {payment.paymentMonth}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
        Installment #{payment.installmentNumber}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Payment Summary
                </h2>
                <p className="text-blue-100 text-sm">{student.fullName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Student Info */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Batch</p>
                <p className="font-medium text-gray-900">{student.batch}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Batch Name</p>
                <p className="font-medium text-gray-900">{student.batchName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-medium text-gray-900">
                  {student.phone || student.phoneNumber || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Paid</p>
                <p className="font-bold text-green-600 text-lg">
                  ৳{totalPaid.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Due Amount</p>
                <p
                  className={`font-bold text-lg ${
                    dueAmount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {dueAmount > 0 ? `৳${dueAmount.toLocaleString()}` : "✓ Clear"}
                </p>
              </div>
            </div>

            {/* Additional info for installment students */}
            {!isHSCStudent && courseFee !== null && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Course Fee
                    </p>
                    <p className="font-medium text-gray-900">
                      ৳{courseFee.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Installments Paid
                    </p>
                    <p className="font-medium text-gray-900">
                      {installmentsPaid} of 3
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width:
                              courseFee > 0
                                ? `${Math.min(
                                    100,
                                    (totalPaid / courseFee) * 100
                                  )}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {courseFee > 0
                          ? Math.round((totalPaid / courseFee) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info for HSC students */}
            {isHSCStudent && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase">
                    Payment Type:
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Monthly Fee
                  </span>
                  {dueAmount === 0 ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      ✓ Current Month Paid
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Current Month Pending
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History ({studentPayments.length})
            </h3>

            {studentPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">💸</div>
                <p className="text-gray-500">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className={`border rounded-lg p-4 ${
                      editingPayment?._id === payment._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {editingPayment?._id === payment._id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Amount (৳)
                            </label>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              onWheel={preventNumberInputScroll}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="paid">Paid</option>
                              <option value="pending">Pending</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {isUpdating ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPaymentTypeBadge(payment)}
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-gray-900">
                              ৳{payment.amount.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(payment.date)}
                            </span>
                          </div>
                          {payment.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {payment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(payment)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Edit payment"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(payment._id)}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                            title="Delete payment"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatchPaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMonth, setPaymentMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [description, setDescription] = useState<string>("");
  const [paymentInputs, setPaymentInputs] = useState<PaymentInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState<string>("");
  const [defaultCourseFee, setDefaultCourseFee] = useState<string>("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [selectedStudentForModal, setSelectedStudentForModal] =
    useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine payment type based on batch
  const isHSCBatch = selectedBatch.toLowerCase().includes("hsc");
  const paymentType = isHSCBatch ? "monthly" : "installment";

  // Fetch students and payments
  const fetchData = async () => {
    const [studentsRes, paymentsRes] = await Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/payments").then((r) => r.json()),
    ]);
    setStudents(studentsRes);
    setPayments(paymentsRes);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle modal open
  const handleOpenModal = (student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudentForModal(null);
  };

  // Handle payment updated (refresh data)
  const handlePaymentUpdated = () => {
    fetchData();
  };

  // Get unique batches and batch names
  const uniqueBatches = [...new Set(students.map((s) => s.batch))].filter(
    Boolean
  );
  const uniqueBatchNames = [
    ...new Set(
      students
        .filter((s) => !selectedBatch || s.batch === selectedBatch)
        .map((s) => s.batchName)
    ),
  ].filter(Boolean);

  const filteredStudents = selectedBatch
    ? students.filter((student) => {
        if (student.batch !== selectedBatch) return false;
        if (selectedBatchName && student.batchName !== selectedBatchName)
          return false;
        // Filter by search query (name or phone)
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameMatch = student.fullName?.toLowerCase().includes(query);
          const phoneMatch = (student.phone || student.phoneNumber || "")
            .toLowerCase()
            .includes(query);
          if (!nameMatch && !phoneMatch) return false;
        }
        return true;
      })
    : [];

  // Check if student already paid for selected month (for HSC)
  const hasPaymentForMonth = (studentId: string, month: string): boolean => {
    return payments.some(
      (p) =>
        p.studentId === studentId &&
        p.paymentType === "monthly" &&
        p.paymentMonth === month &&
        p.status === "paid"
    );
  };

  // Get student's next installment number (for Admission)
  const getNextInstallment = (studentId: string): 1 | 2 | 3 | null => {
    const studentPayments = payments.filter(
      (p) =>
        p.studentId === studentId &&
        p.paymentType === "installment" &&
        p.status === "paid"
    );
    const paidInstallments = studentPayments.map((p) => p.installmentNumber);

    if (!paidInstallments.includes(1)) return 1;
    if (!paidInstallments.includes(2)) return 2;
    if (!paidInstallments.includes(3)) return 3;
    return null;
  };

  // Get student's payment summary (for Admission)
  const getStudentPaymentSummary = (studentId: string) => {
    const studentPayments = payments.filter(
      (p) => p.studentId === studentId && p.paymentType === "installment"
    );
    const paidPayments = studentPayments.filter((p) => p.status === "paid");
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const courseFee = studentPayments[0]?.courseFee || 0;
    return { totalPaid, courseFee, paidCount: paidPayments.length };
  };

  // Update payment inputs when filtered students or settings change
  useEffect(() => {
    if (!selectedBatch || filteredStudents.length === 0) {
      setPaymentInputs([]);
      return;
    }

    if (isHSCBatch) {
      // Monthly payment setup
      setPaymentInputs(
        filteredStudents.map((student) => {
          const alreadyPaid = hasPaymentForMonth(student._id, paymentMonth);
          return {
            studentId: student._id,
            amount: alreadyPaid
              ? ""
              : defaultAmount || String(student.monthlyFee || ""),
            selected: !alreadyPaid,
            alreadyPaidThisMonth: alreadyPaid,
          };
        })
      );
      setDescription("Monthly Tuition Fee");
    } else {
      // Installment payment setup
      setPaymentInputs(
        filteredStudents.map((student) => {
          const nextInstallment = getNextInstallment(student._id);
          const summary = getStudentPaymentSummary(student._id);
          return {
            studentId: student._id,
            amount: defaultAmount,
            selected: nextInstallment !== null,
            nextInstallment,
            courseFee:
              summary.courseFee ||
              Number(defaultCourseFee) ||
              student.courseFee ||
              0,
            totalPaid: summary.totalPaid,
          };
        })
      );
      setDescription("Course Fee Installment");
    }
  }, [
    filteredStudents.length,
    selectedBatch,
    selectedBatchName,
    payments.length,
    paymentMonth,
    isHSCBatch,
  ]);

  // Handle individual amount change
  const handleAmountChange = (studentId: string, amount: string) => {
    // allow typing, validate/clamp on blur to avoid immediate revert behavior
    setPaymentInputs((prev) =>
      prev.map((input) =>
        input.studentId === studentId ? { ...input, amount } : input
      )
    );
  };

  // clamp amount to remaining balance for a student
  const clampAmount = (studentId: string) => {
    setPaymentInputs((prev) =>
      prev.map((input) => {
        if (input.studentId !== studentId) return input;
        if (isHSCBatch) return input;
        const courseFee = input.courseFee || 0;
        const totalPaid = input.totalPaid || 0;
        const remaining = Math.max(0, courseFee - totalPaid);
        const current = Number(input.amount) || 0;
        if (current > remaining) {
          return { ...input, amount: String(remaining) };
        }
        return input;
      })
    );
  };

  // Handle course fee change (for Admission)
  const handleCourseFeeChange = (studentId: string, courseFee: string) => {
    setPaymentInputs((prev) =>
      prev.map((input) =>
        input.studentId === studentId
          ? { ...input, courseFee: Number(courseFee) }
          : input
      )
    );
  };

  // Handle checkbox toggle
  const handleSelectToggle = (studentId: string) => {
    setPaymentInputs((prev) =>
      prev.map((input) =>
        input.studentId === studentId
          ? { ...input, selected: !input.selected }
          : input
      )
    );
  };

  // Select/Deselect all
  const handleSelectAll = (selectAll: boolean) => {
    setPaymentInputs((prev) =>
      prev.map((input) => {
        if (isHSCBatch) {
          return {
            ...input,
            selected: selectAll && !input.alreadyPaidThisMonth,
          };
        }
        return {
          ...input,
          selected: selectAll && input.nextInstallment !== null,
        };
      })
    );
  };

  // Apply default amount to all
  const applyDefaultAmount = () => {
    setPaymentInputs((prev) =>
      prev.map((input) => {
        if (isHSCBatch && input.alreadyPaidThisMonth) return input;
        if (!isHSCBatch && input.nextInstallment === null) return input;

        // For installment payments, clamp amount to remaining balance
        if (!isHSCBatch) {
          const courseFee = input.courseFee || 0;
          const totalPaid = input.totalPaid || 0;
          const remaining = Math.max(0, courseFee - totalPaid);
          let amount = Number(defaultAmount);
          if (isNaN(amount) || amount <= 0) return input;
          if (amount > remaining) amount = remaining;
          return { ...input, amount: String(amount) };
        }

        return { ...input, amount: defaultAmount };
      })
    );
  };

  // Apply default course fee to all (for Admission)
  const applyDefaultCourseFee = () => {
    setPaymentInputs((prev) =>
      prev.map((input) => {
        if ((input.totalPaid || 0) > 0) return input;
        return { ...input, courseFee: Number(defaultCourseFee) };
      })
    );
  };

  // Send SMS for due payments
  const handleSendDuePaymentSMS = async () => {
    // Get students with due payments (including those with 3 installments but still have due amount)
    const dueStudents = filteredStudents.filter((student) => {
      const paymentInput = paymentInputs.find(
        (p) => p.studentId === student._id
      );
      if (!paymentInput) return false;

      if (isHSCBatch) {
        return !paymentInput.alreadyPaidThisMonth;
      } else {
        // For installment payments, check if there's any due amount
        const dueAmount =
          (paymentInput.courseFee || 0) - (paymentInput.totalPaid || 0);
        return dueAmount > 0;
      }
    });

    if (dueStudents.length === 0) {
      alert("No students with due payments to notify.");
      return;
    }

    const phoneNumbers = dueStudents
      .map((s) => s.phoneNumber || s.phone)
      .filter(Boolean) as string[];

    if (phoneNumbers.length === 0) {
      alert("No phone numbers available for students with due payments.");
      return;
    }

    const confirmSend = window.confirm(
      `Send SMS reminder to ${phoneNumbers.length} student(s) with due payments?`
    );

    if (!confirmSend) return;

    setSmsLoading(true);

    try {
      const batchInfo = selectedBatchName || selectedBatch;
      const message = isHSCBatch
        ? `Dear Student, Your monthly tuition fee for ${paymentMonth} is due. Please pay at your earliest convenience. - Nayem's English Aid (${batchInfo})`
        : `Dear Student, Your course fee installment is due. Please complete your payment soon. - Nayem's English Aid (${batchInfo})`;

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phoneNumbers,
          batch: selectedBatch,
          batchName: selectedBatchName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `SMS sent successfully to ${phoneNumbers.length} student(s)! ${
            data?.message || ""
          }`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to send SMS. " + (err?.error || ""));
      }
    } catch (error) {
      console.error("SMS send error:", error);
      alert("An error occurred while sending SMS.");
    } finally {
      setSmsLoading(false);
    }
  };

  // Send SMS for individual student due payment
  const handleSendIndividualSMS = async (
    student: Student,
    paymentInput: PaymentInput
  ) => {
    const phone = student.phoneNumber || student.phone;

    if (!phone) {
      alert(`Cannot send SMS: ${student.fullName} has no phone number.`);
      return;
    }

    const dueAmount = isHSCBatch
      ? 700
      : (paymentInput.courseFee || 0) - (paymentInput.totalPaid || 0);

    if (dueAmount <= 0) {
      alert("No due amount for this student.");
      return;
    }

    const confirmSend = window.confirm(
      `Send SMS reminder to ${
        student.fullName
      } for due amount ৳${dueAmount.toLocaleString()}?`
    );

    if (!confirmSend) return;

    setSmsLoading(true);

    try {
      const batchInfo = student.batchName || selectedBatch;
      const message = isHSCBatch
        ? `Dear ${
            student.fullName
          }, Your monthly tuition fee of ৳${dueAmount.toLocaleString()} for ${paymentMonth} is due. Please pay at your earliest convenience. - Nayem's English Aid (${batchInfo})`
        : `Dear ${
            student.fullName
          }, Your course fee ৳${dueAmount.toLocaleString()} is due. Please complete your payment soon. - Nayem's English Aid (${batchInfo})`;

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phoneNumbers: [phone],
          batch: selectedBatch,
          batchName: student.batchName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `SMS sent successfully to ${student.fullName}! ${data?.message || ""}`
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to send SMS. " + (err?.error || ""));
      }
    } catch (error) {
      console.error("SMS send error:", error);
      alert("An error occurred while sending SMS.");
    } finally {
      setSmsLoading(false);
    }
  };

  // Calculate totals
  const selectedPayments = paymentInputs.filter((p) => {
    if (!p.selected || !Number(p.amount)) return false;
    if (isHSCBatch) return !p.alreadyPaidThisMonth;
    return p.nextInstallment !== null;
  });
  const totalAmount = selectedPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const getDueAmount = (paymentInput: PaymentInput | undefined): number => {
    if (!paymentInput) return 0;
    if (isHSCBatch) {
      return paymentInput.alreadyPaidThisMonth ? 0 : 700; // Default HSC monthly fee
    }
    return (paymentInput.courseFee || 0) - (paymentInput.totalPaid || 0);
  };

  const handleSubmitPayments = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPayments.length === 0) {
      alert("Please select at least one student and enter an amount.");
      return;
    }

    if (!isHSCBatch) {
      const missingCourseFee = selectedPayments.filter((p) => !p.courseFee);
      if (missingCourseFee.length > 0) {
        alert("Please enter course fee for all selected students.");
        return;
      }

      // Check if any installment exceeds remaining balance
      const invalidPayments = selectedPayments.filter((p) => {
        const courseFee = p.courseFee || 0;
        const totalPaid = p.totalPaid || 0;
        const remaining = courseFee - totalPaid;
        const amount = Number(p.amount);
        return amount > remaining;
      });

      if (invalidPayments.length > 0) {
        alert(
          "Some installment amounts exceed the remaining course fee balance. Please adjust the amounts."
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        selectedPayments.map((payment) => {
          const body: Record<string, unknown> = {
            studentId: payment.studentId,
            amount: Number(payment.amount),
            date: paymentDate,
            status: "paid",
            paymentType,
          };

          if (isHSCBatch) {
            body.description = `${description} - ${paymentMonth}`;
            body.paymentMonth = paymentMonth;
          } else {
            body.description = `${description} - Installment ${payment.nextInstallment}`;
            body.installmentNumber = payment.nextInstallment;
            body.courseFee = payment.courseFee;
          }

          return fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || "Failed to add payment");
            }
            return res.json();
          });
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error("Failed payments:", failed);
        alert(
          `${successful} payments successful, ${failed.length} failed. Check console for details.`
        );
      } else {
        alert(
          `Successfully recorded ${successful} payments totaling ৳${totalAmount.toLocaleString()}`
        );
      }

      // Refresh data
      await fetchData();
      setDefaultAmount("");
    } catch (error) {
      console.error("Error submitting payments:", error);
      alert("Error submitting payments. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Badge components
  const getMonthlyBadge = (alreadyPaid: boolean) => {
    if (alreadyPaid) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          ✓ Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        Pending
      </span>
    );
  };

  const getInstallmentBadge = (installment: 1 | 2 | 3 | null | undefined) => {
    if (installment === null || installment === undefined) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          ✓ Completed
        </span>
      );
    }
    const colors = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-yellow-100 text-yellow-800",
      3: "bg-purple-100 text-purple-800",
    };
    const labels = { 1: "1st", 2: "2nd", 3: "3rd" };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colors[installment]}`}
      >
        {labels[installment]} Installment
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      {/* Payment Summary Modal */}
      <PaymentSummaryModal
        student={selectedStudentForModal}
        payments={payments}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPaymentUpdated={handlePaymentUpdated}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Batch Payments</h1>
          <p className="text-gray-600 mt-2">
            Record payments for multiple students at once
          </p>
        </div>

        <form onSubmit={handleSubmitPayments}>
          {/* Batch Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Batch Selection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setSelectedBatchName("");
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Batch</option>
                  {uniqueBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name (Optional)
                </label>
                <select
                  value={selectedBatchName}
                  onChange={(e) => {
                    setSelectedBatchName(e.target.value);
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedBatch}
                >
                  <option value="">All Batch Names</option>
                  {uniqueBatchNames.map((batchName) => (
                    <option key={batchName} value={batchName}>
                      {batchName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {isHSCBatch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Month
                  </label>
                  <input
                    type="month"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Search Bar */}
            {selectedBatch && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Student
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-1">
                    Found {filteredStudents.length} student(s)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment Type Info & Default Amount */}
          {selectedBatch && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isHSCBatch
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {isHSCBatch ? "Monthly Payment" : "Installment Payment"}
                  </span>
                  <span className="text-gray-600">
                    {filteredStudents.length} students
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {!isHSCBatch && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">
                          Default Course Fee:
                        </label>
                        <input
                          type="number"
                          value={defaultCourseFee}
                          onChange={(e) => setDefaultCourseFee(e.target.value)}
                          onWheel={preventNumberInputScroll}
                          placeholder="৳0"
                          className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={applyDefaultCourseFee}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                        >
                          Apply
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">
                      Default Amount:
                    </label>
                    <input
                      type="number"
                      value={defaultAmount}
                      onChange={(e) => setDefaultAmount(e.target.value)}
                      onWheel={preventNumberInputScroll}
                      placeholder="৳0"
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyDefaultAmount}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                    >
                      Apply All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Table */}
          {selectedBatch && filteredStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Students
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSendDuePaymentSMS}
                    disabled={smsLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {smsLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                        SMS Due Payments
                      </>
                    )}
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        paymentInputs.filter((p) =>
                          isHSCBatch
                            ? !p.alreadyPaidThisMonth
                            : p.nextInstallment !== null
                        ).length > 0 &&
                        paymentInputs
                          .filter((p) =>
                            isHSCBatch
                              ? !p.alreadyPaidThisMonth
                              : p.nextInstallment !== null
                          )
                          .every((p) => p.selected)
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Select All
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      {!isHSCBatch && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Course Fee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Paid / Due
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const paymentInput = paymentInputs.find(
                        (p) => p.studentId === student._id
                      );
                      if (!paymentInput) return null;

                      const isDisabled = isHSCBatch
                        ? paymentInput.alreadyPaidThisMonth
                        : paymentInput.nextInstallment === null;

                      const dueAmount = getDueAmount(paymentInput);

                      // Check if student has due amount (for SMS button)
                      const hasDueAmount = isHSCBatch
                        ? !paymentInput.alreadyPaidThisMonth
                        : dueAmount > 0;

                      return (
                        <tr
                          key={student._id}
                          className={isDisabled ? "bg-gray-50" : ""}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={paymentInput.selected}
                              onChange={() => handleSelectToggle(student._id)}
                              disabled={isDisabled}
                              className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(student)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {student.fullName}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.phone || student.phoneNumber || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            {isHSCBatch
                              ? getMonthlyBadge(
                                  paymentInput.alreadyPaidThisMonth || false
                                )
                              : getInstallmentBadge(
                                  paymentInput.nextInstallment
                                )}
                          </td>
                          {!isHSCBatch && (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={paymentInput.courseFee || ""}
                                  onChange={(e) =>
                                    handleCourseFeeChange(
                                      student._id,
                                      e.target.value
                                    )
                                  }
                                  onWheel={preventNumberInputScroll}
                                  disabled={
                                    (paymentInput.totalPaid || 0) > 0 ||
                                    isDisabled
                                  }
                                  placeholder="৳0"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="text-green-600 font-medium">
                                  ৳
                                  {(
                                    paymentInput.totalPaid || 0
                                  ).toLocaleString()}
                                </span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span
                                  className={
                                    dueAmount > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {dueAmount > 0
                                    ? `৳${dueAmount.toLocaleString()}`
                                    : "✓ Clear"}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={paymentInput.amount}
                              onChange={(e) =>
                                handleAmountChange(student._id, e.target.value)
                              }
                              onWheel={preventNumberInputScroll}
                              onBlur={() => clampAmount(student._id)}
                              disabled={isDisabled && dueAmount <= 0}
                              placeholder="৳0"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {hasDueAmount && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendIndividualSMS(student, paymentInput)
                                }
                                disabled={smsLoading}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition disabled:opacity-50"
                                title={`Send SMS reminder (Due: ৳${dueAmount.toLocaleString()})`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary & Submit */}
          {selectedPayments.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-gray-600">
                    Selected: <strong>{selectedPayments.length}</strong>{" "}
                    students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Total: ৳{totalAmount.toLocaleString()}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Record Payments</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* No Students Message */}
          {selectedBatch && filteredStudents.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Students Found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? `No students match "${searchQuery}"`
                  : "No students found in this batch."}
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
