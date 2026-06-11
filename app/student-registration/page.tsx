"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "react-toastify";

export function StudentRegistrationForm() {
  const batchOptions: Record<string, string[]> = {
    HSC: ["H-1", "H-2", "H-3", "H-4", "H-5", "H-6"],
    Admission: [
      "ADM-1",
      "B-1 (26-27)",
      "B-2 (26-27)",
      "B-3 (26-27)",
      "C-1 (26-27)",
      "C-2 (26-27)",
      "C-3 (26-27)",
      "R-1 (26-27)",
      "R-2 (26-27)",
    ],
    Preparation: [
      "preparation-1",
      "preparation-2",
      "preparation-3",
      "preparation-4",
      "FP-1",
      "FP-2",
      "FP-3",
      "FP-4",
    ],
  };

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    fullName: "",
    guardianName: "",
    phoneNumber: "",
    guardianPhoneNumber: "",
    batch: "",
    batchName: "",
    enrollmentDate: getCurrentDate(),
    totalFees: "",
    paidFees: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "batch") {
        // reset batchName when batch changes
        return { ...prev, batch: value, batchName: "" };
      }
      return { ...prev, [name]: value };
    });
  };
  const availableBatchNames = formData.batch
    ? (batchOptions[formData.batch] ?? [])
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);
    setIsLoading(true);

    // Validate phone number length
    if (formData.phoneNumber.length !== 11) {
      setError("Phone number must be exactly 11 characters");
      setIsLoading(false);
      return;
    }

    if (
      formData.guardianPhoneNumber &&
      formData.guardianPhoneNumber.length !== 11
    ) {
      setError("Guardian's phone number must be exactly 11 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalFees: Number(formData.totalFees),
          paidFees: Number(formData.paidFees),
        }),
      });
      if (res.ok) {
        toast.success("Student registered successfully");
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      setIsLoading(false);
      setFormData({
        fullName: "",
        guardianName: "",
        phoneNumber: "",
        guardianPhoneNumber: "",
        batch: "",
        batchName: "",
        enrollmentDate: getCurrentDate(),
        totalFees: "",
        paidFees: "",
      });

      setTimeout(() => setSubmitted(false), 2000);
    } catch (err) {
      setError("Failed to submit");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-0">
        <div className="px-8 py-8 rounded-t-lg">
          <h1 className="text-3xl font-bold text-black mb-2">
            Student Registration
          </h1>
          <p className="text-gray-500">
            Please fill in all the required information below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Guardian Name */}
          <div>
            <label
              htmlFor="guardianName"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Guardian's Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="guardianName"
              name="guardianName"
              type="text"
              placeholder="Enter guardian's full name"
              value={formData.guardianName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="Enter phone number (11 digits)"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              minLength={11}
              maxLength={11}
              pattern="[0-9]{11}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Guardian Phone Number */}
          <div>
            <label
              htmlFor="guardianPhoneNumber"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Guardian's Phone Number
            </label>
            <Input
              id="guardianPhoneNumber"
              name="guardianPhoneNumber"
              type="tel"
              required
              placeholder="Enter guardian's phone number (11 digits)"
              value={formData.guardianPhoneNumber}
              onChange={handleChange}
              minLength={11}
              maxLength={11}
              pattern="[0-9]{11}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Batch */}
          <div>
            <label
              htmlFor="batch"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              id="batch"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a batch</option>
              {Object.keys(batchOptions).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Name */}
          <div>
            <label
              htmlFor="batchName"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Batch Name <span className="text-red-500">*</span>
            </label>
            <select
              id="batchName"
              name="batchName"
              value={formData.batchName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a batch</option>
              {availableBatchNames.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          {/* Enrollment Date */}
          <div>
            <label
              htmlFor="enrollmentDate"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Enrollment Date <span className="text-red-500">*</span>
            </label>
            <Input
              id="enrollmentDate"
              name="enrollmentDate"
              type="date"
              required
              value={formData.enrollmentDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Total Fees */}
          {/* <div>
            <label htmlFor="totalFees" className="block text-sm font-semibold text-gray-700 mb-2">
              Total Fees <span className="text-red-500">*</span>
            </label>
            <Input
              id="totalFees"
              name="totalFees"
              type="number"
              placeholder="Enter total fees"
              value={formData.totalFees}
              onChange={handleChange}
              min={0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}

          {/* Paid Fees */}
          {/* <div>
            <label htmlFor="paidFees" className="block text-sm font-semibold text-gray-700 mb-2">
              Paid Fees <span className="text-red-500">*</span>
            </label>
            <Input
              id="paidFees"
              name="paidFees"
              type="number"
              placeholder="Enter paid fees"
              value={formData.paidFees}
              onChange={handleChange}
              min={0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Registering..."
                : submitted
                  ? "✓ Registration Submitted"
                  : "Submit Registration"}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {submitted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium text-center">
                Registration submitted successfully!
              </p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

export default StudentRegistrationForm;
