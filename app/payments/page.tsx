"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import PaymentEditModal from "./PaymentEditModal";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const router = useRouter();
  const [formData, setFormData] = useState<{
    studentId: string;
    amount: string;
    date: string;
    status: "paid" | "pending" | "overdue";
    description: string;
    duePayment: string;
    batch: string;
    batchName: string;
  }>({
    studentId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    description: "",
    duePayment: "",
    batch: "",
    batchName: "",
  });

  // Fetch students and payments from API
  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then(setStudents);
    fetch("/api/payments")
      .then((res) => res.json())
      .then(setPayments);
  }, []);

  // Filtered students
  const filteredStudents = students.filter((student) => {
    if (selectedBatch && student.batch !== selectedBatch) return false;
    if (selectedBatchName && student.batchName !== selectedBatchName)
      return false;
    return true;
  });

  // Payments for selected student
  const studentPayments = selectedStudent
    ? payments.filter((p) => p.studentId === selectedStudent)
    : payments;

  // Payments for selected batch/batchName
  const batchPayments = payments.filter((p) => {
    const student = students.find((s) => s._id === p.studentId);
    if (selectedBatch && student?.batch !== selectedBatch) return false;
    if (selectedBatchName && student?.batchName !== selectedBatchName)
      return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = studentPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const batchTotalAmount = batchPayments.reduce((sum, p) => sum + p.amount, 0);
  const batchPaidAmount = batchPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  // Add payment to API
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: formData.studentId,
        amount: Number(formData.amount),
        date: formData.date,
        status: formData.status,
        description: formData.description,
        duePayment: Number(formData.duePayment),
      }),
    });
    if (res.ok) {
      const newPayment = await res.json();
      setPayments((prev) => [...prev, newPayment]);
      setFormData({
        studentId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        description: "",
        duePayment: "",
        batch: "",
        batchName: "",
      });
      setShowForm(false);
      alert("Payment record added successfully!");
    }
  };

  const uniqueBatches = [...new Set(students.map((s) => s.batch))];
  const uniqueBatchNames = [...new Set(students.map((s) => s.batchName))];

  // Filter students for the form
  const formFilteredStudents = students.filter((student) => {
    if (selectedBatch && student.batch !== selectedBatch) return false;
    if (selectedBatchName && student.batchName !== selectedBatchName)
      return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Payment Management
            </h1>
            <p className="text-gray-600">Track and manage student payments</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <select
                title="batch"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batches</option>
                {uniqueBatches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch Name
              </label>
              <select
                title="batch_name"
                value={selectedBatchName}
                onChange={(e) => setSelectedBatchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batch Names</option>
                {uniqueBatchNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Student
              </label>
              <select
                title="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Students</option>
                {filteredStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Students in Batch</div>
            <div className="text-3xl font-bold text-gray-900">
              {filteredStudents.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-3xl font-bold text-gray-900">
              ৳{batchTotalAmount.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Paid Amount</div>
            <div className="text-3xl font-bold text-green-600">
              ৳{batchPaidAmount.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Amount</div>
            <div className="text-3xl font-bold text-red-600">
              ৳{(batchTotalAmount - batchPaidAmount).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Add Payment Button */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {showForm ? "Cancel" : "+ Add Individual Payment"}
          </button>

          <button
            onClick={() => router.push("/batch-payments")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {"+ Add Batch Payment"}
          </button>
        </div>

        {/* Individual Payment Entry Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Individual Payment Record
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Batch Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <select
                  title="batch"
                  value={formData.batch || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batch: e.target.value,
                      studentId: "",
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Batch</option>
                  {[...new Set(students.map((s) => s.batch))].map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
              {/* Batch Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name
                </label>
                <select
                  title="batch_name"
                  value={formData.batchName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batchName: e.target.value,
                      studentId: "",
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Batch Name</option>
                  {[
                    ...new Set(
                      students
                        .filter(
                          (s) => !formData.batch || s.batch === formData.batch
                        )
                        .map((s) => s.batchName)
                    ),
                  ].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Student Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  title="student_id"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Student</option>
                  {students
                    .filter(
                      (student) =>
                        formData.batch &&
                        formData.batchName &&
                        student.batch === formData.batch &&
                        student.batchName === formData.batchName
                    )
                    .map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (৳)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  title="payment_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  title="payment_status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "paid" | "pending" | "overdue",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Payment (৳)
                </label>
                <input
                  type="number"
                  value={formData.duePayment}
                  onChange={(e) =>
                    setFormData({ ...formData, duePayment: e.target.value })
                  }
                  placeholder="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Tuition Fee, Lab Fee"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Records
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Due Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {batchPayments.length > 0 ? (
                  batchPayments.map((payment) => {
                    const student = students.find(
                      (s) => s._id === payment.studentId
                    );
                    const dueAmount =
                      payment.status === "paid" ? 0 : payment.amount;
                    return (
                      <tr
                        onClick={() => {
                          setSelectedPayment(payment);
                          setEditModalOpen(true);
                        }}
                        key={payment._id}
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student?.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {payment.description}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ৳{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                          ৳{dueAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Payment Modal */}
        <PaymentEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          payment={selectedPayment}
          students={students}
          onSave={(updated) => {
            setPayments((prev) =>
              prev.map((p) => (p._id === updated._id ? updated : p))
            );
          }}
        />
      </div>
    </main>
  );
}
