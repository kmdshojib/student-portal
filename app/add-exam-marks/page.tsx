"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  _id?: string;
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  batch?: string;
  batchName?: string;
  enrollmentDate?: string;
  totalFees: number;
  paidFees: number;
  email?: string;
}

interface StudentMarkEntry {
  studentId: string;
  studentName: string;
  marks: string;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  error?: string;
}

export default function AddExamMarksPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [examName, setExamName] = useState<string>("");
  const [totalMarks, setTotalMarks] = useState<string>("100");
  const [examDate, setExamDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Student marks entries
  const [markEntries, setMarkEntries] = useState<StudentMarkEntry[]>([]);

  // Fetch students on mount
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/students");
        const data = await res.json();
        const normalized = (data || []).map((s: any) => ({
          ...s,
          id: s.id || s._id || String(s._id || s.id || ""),
        }));
        setStudents(normalized);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // Get unique batches
  const batches = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.batch).filter(Boolean)));
  }, [students]);

  const batchNames = useMemo(() => {
    if (!selectedBatch) return [];
    return Array.from(
      new Set(
        students
          .filter((s) => s.batch === selectedBatch)
          .map((s) => s.batchName)
          .filter(Boolean)
      )
    );
  }, [students, selectedBatch]);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) => s.batch === selectedBatch && s.batchName === selectedBatchName
    );
  }, [students, selectedBatch, selectedBatchName]);

  // Auto-populate mark entries when batch/batchName changes
  useEffect(() => {
    if (selectedBatch && selectedBatchName) {
      const entries: StudentMarkEntry[] = filteredStudents.map((student) => ({
        studentId: student._id || student.id,
        studentName: student.fullName,
        marks: "",
        isSubmitting: false,
        isSubmitted: false,
        error: undefined,
      }));
      setMarkEntries(entries);
    } else {
      setMarkEntries([]);
    }
  }, [filteredStudents, selectedBatch, selectedBatchName]);

  // Handle batch change
  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    setSelectedBatchName("");
    setMarkEntries([]);
  };

  // Handle batch name change
  const handleBatchNameChange = (value: string) => {
    setSelectedBatchName(value);
  };

  // Handle marks change for a student
  const handleMarksChange = (studentId: string, marks: string) => {
    setMarkEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, marks } : entry
      )
    );
  };

  // Fill all marks with a value
  const handleFillAllMarks = (value: string) => {
    setMarkEntries((prev) => prev.map((entry) => ({ ...entry, marks: value })));
  };

  // Submit all marks
  const handleSubmitAll = async () => {
    if (!examName.trim()) {
      alert("Please enter an exam name");
      return;
    }

    if (!totalMarks || Number(totalMarks) <= 0) {
      alert("Please enter valid total marks");
      return;
    }

    // Check if at least one student has marks
    const entriesWithMarks = markEntries.filter(
      (e) => e.marks !== "" && !e.isSubmitted
    );
    if (entriesWithMarks.length === 0) {
      alert("Please enter marks for at least one student");
      return;
    }

    // Validate marks
    for (const entry of entriesWithMarks) {
      const marks = Number(entry.marks);
      if (isNaN(marks) || marks < 0 || marks > Number(totalMarks)) {
        alert(
          `Invalid marks for ${entry.studentName}. Marks should be between 0 and ${totalMarks}`
        );
        return;
      }
    }

    setSubmitting(true);

    // Submit each entry
    const results = await Promise.allSettled(
      entriesWithMarks.map(async (entry) => {
        // Mark as submitting
        setMarkEntries((prev) =>
          prev.map((e) =>
            e.studentId === entry.studentId ? { ...e, isSubmitting: true } : e
          )
        );

        const payload = {
          studentId: entry.studentId,
          studentName: entry.studentName,
          examName: examName.trim(),
          marks: Number(entry.marks),
          totalMarks: Number(totalMarks),
          date: examDate,
          batch: selectedBatch,
          batchName: selectedBatchName,
        };

        const res = await fetch("/api/exam-marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to save");
        }

        return entry.studentId;
      })
    );

    // Update entries based on results
    results.forEach((result, index) => {
      const studentId = entriesWithMarks[index].studentId;
      if (result.status === "fulfilled") {
        setMarkEntries((prev) =>
          prev.map((e) =>
            e.studentId === studentId
              ? {
                  ...e,
                  isSubmitting: false,
                  isSubmitted: true,
                  error: undefined,
                }
              : e
          )
        );
      } else {
        setMarkEntries((prev) =>
          prev.map((e) =>
            e.studentId === studentId
              ? {
                  ...e,
                  isSubmitting: false,
                  isSubmitted: false,
                  error: result.reason?.message || "Failed",
                }
              : e
          )
        );
      }
    });

    setSubmitting(false);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    if (failCount === 0) {
      alert(`Successfully saved marks for ${successCount} students!`);
    } else {
      alert(
        `Saved: ${successCount}, Failed: ${failCount}. Check the table for errors.`
      );
    }
  };

  // Check if form is ready
  const isFormReady =
    selectedBatch && selectedBatchName && examName && totalMarks && examDate;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Add Exam Marks
            </h1>
            <p className="text-gray-600">Bulk entry for student exam marks</p>
          </div>
          <button
            onClick={() => router.push("/exam-marks")}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            ← Back to Exam Marks
          </button>
        </div>

        {/* Exam Details Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Exam Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBatchName}
                onChange={(e) => handleBatchNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedBatch}
              >
                <option value="">Select Batch Name</option>
                {batchNames.map((bn) => (
                  <option key={bn} value={bn}>
                    {bn}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., Weekly Test 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Exam Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Students Table */}
        {selectedBatch && selectedBatchName && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Students in {selectedBatchName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {markEntries.length} students found •{" "}
                  {markEntries.filter((e) => e.isSubmitted).length} submitted
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fill all with:
                  </label>
                  <input
                    type="number"
                    placeholder="Marks"
                    className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFillAllMarks(
                          (e.target as HTMLInputElement).value
                        );
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleFillAllMarks(e.target.value);
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitAll}
                  disabled={!isFormReady || submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save All Marks"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      S/N
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Exam Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Marks Obtained
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
                  {markEntries.length > 0 ? (
                    markEntries.map((entry, index) => (
                      <tr
                        key={entry.studentId}
                        className={`border-b border-gray-200 ${
                          entry.isSubmitted
                            ? "bg-green-50"
                            : entry.error
                            ? "bg-red-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {entry.studentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {examName || (
                            <span className="text-gray-400 italic">
                              Enter exam name above
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {totalMarks || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={entry.marks}
                            onChange={(e) =>
                              handleMarksChange(entry.studentId, e.target.value)
                            }
                            disabled={entry.isSubmitted || entry.isSubmitting}
                            min="0"
                            max={totalMarks}
                            placeholder="0"
                            className={`w-24 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              entry.isSubmitted
                                ? "bg-green-100 border-green-300"
                                : entry.error
                                ? "bg-red-100 border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {examDate || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {entry.isSubmitting ? (
                            <span className="inline-flex items-center gap-1 text-blue-600">
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
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Saving...
                            </span>
                          ) : entry.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              ✓ Saved
                            </span>
                          ) : entry.error ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"
                              title={entry.error}
                            >
                              ✗ Failed
                            </span>
                          ) : entry.marks ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {loading
                          ? "Loading students..."
                          : "No students found for this batch"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Submit button */}
            {markEntries.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Enter marks for each student and click "Save All Marks" to
                  submit.
                </p>
                <button
                  onClick={handleSubmitAll}
                  disabled={!isFormReady || submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save All Marks"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedBatch && !selectedBatchName && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Batch and Batch Name
            </h3>
            <p className="text-gray-500">
              Choose a batch and batch name above to load students and enter
              their exam marks.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
