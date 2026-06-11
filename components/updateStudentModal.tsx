"use client";

import type React from "react";

import { useState } from "react";
import { X } from "lucide-react";

interface Student {
  _id: string;
  id: string;
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  guardianPhoneNumber?: string;
  batch: string;
  batchName: string;
  enrollmentDate: string;
  totalFees: number;
  paidFees: number;
  email?: string;
  monthPaidUntil?: string;
}

interface StudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (student: Student) => void;
}

export default function StudentModal({
  student,
  isOpen,
  onClose,
  onUpdate,
}: StudentModalProps) {
  const [formData, setFormData] = useState<Student | null>(student);
  const [isSaving, setIsSaving] = useState(false);

  if (student && (!formData || (formData._id !== student._id))) {
    setFormData(student);
  }

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "totalFees" || name === "paidFees" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (formData) {
        await onUpdate(formData);
      }
    } catch (error) {
      console.error("Error updating student:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold text-white">
            Update Student Details
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  title="fullname"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Name
                </label>
                <input
                  title="guardianName"
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  title="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Phone Number
                </label>
                <input
                  title="guardianPhoneNumber"
                  type="tel"
                  name="guardianPhoneNumber"
                  value={formData.guardianPhoneNumber || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  title="email"
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month Paid Until
                </label>
                <input
                  title="monthPaidUntil"
                  type="date"
                  name="monthPaidUntil"
                  value={formData.monthPaidUntil || ""}
                  onChange={handleChange}
                  placeholder="e.g., January 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Batch Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Batch Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <input
                  title="batch"
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name
                </label>
                <input
                  title="batchName"
                  type="text"
                  name="batchName"
                  value={formData.batchName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Date
                </label>
                <input
                  title="enrollmentDate"
                  type="date"
                  name="enrollmentDate"
                  value={formData.enrollmentDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Fee Information */}
          {/* <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Fees
                </label>
                <input
                  title="totalFees"
                  type="number"
                  name="totalFees"
                  value={formData.totalFees}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Fees
                </label>
                <input
                  title="paidFees"
                  type="number"
                  name="paidFees"
                  value={formData.paidFees}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
