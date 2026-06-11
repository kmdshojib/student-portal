import React, { useState, useEffect } from "react";

interface Payment {
  _id: string;
  studentId: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  description: string;
  duePayment: number;
}

interface Student {
  _id: string;
  fullName: string;
  batch: string;
  batchName: string;
}

interface PaymentEditModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  students: Student[];
  onSave: (updated: Payment) => void;
}

export default function PaymentEditModal({
  open,
  onClose,
  payment,
  students,
  onSave,
}: PaymentEditModalProps) {
  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    date: "",
    status: "pending" as "paid" | "pending" | "overdue",
    description: "",
    duePayment: "",
    batch: "",
    batchName: "",
  });

  useEffect(() => {
    if (payment) {
      const student = students.find((s) => s._id === payment.studentId);
      setForm({
        studentId: payment.studentId,
        amount: payment.amount.toString(),
        date: payment.date,
        status: payment.status,
        description: payment.description,
        duePayment: payment.duePayment.toString(),
        batch: student?.batch || "",
        batchName: student?.batchName || "",
      });
    }
  }, [payment, students]);

  if (!open || !payment) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, ...(e.target.name === "batch" || e.target.name === "batchName" ? { studentId: "" } : {}) });
  };

  // Filter students based on selected batch and batch name
  const filteredStudents = students.filter(
    (student) =>
      (!form.batch || student.batch === form.batch) &&
      (!form.batchName || student.batchName === form.batchName)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPayment = {
      ...payment,
      studentId: form.studentId,
      amount: Number(form.amount),
      date: form.date,
      status: form.status,
      description: form.description,
      duePayment: Number(form.duePayment),
    };
    console.log("Submitting updated payment:", updatedPayment);
    // Call API to update payment
    const res = await fetch(`/api/payments/${payment._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPayment),
    });
    if (res.ok) {
      const updated = await res.json();
      onSave(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Batch</label>
            <select
              title="batch"
              name="batch"
              value={form.batch}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
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
            <label className="block text-sm font-medium mb-1">Batch Name</label>
            <select
              title="batchName"
              name="batchName"
              value={form.batchName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Batch Name</option>
              {[...new Set(
                students
                  .filter((s) => !form.batch || s.batch === form.batch)
                  .map((s) => s.batchName)
              )].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {/* Student Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              title="studentId"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Student</option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              title="amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {/* Due Payment */}
          <div>
            <label className="block text-sm font-medium mb-1">Due Payment</label>
            <input
              title="duePayment"
              name="duePayment"
              type="number"
              value={form.duePayment}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              title="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              title="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              title="description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}