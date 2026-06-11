"use client";

import React, { useState, useEffect, useMemo } from "react";

interface Student {
  id: string;
  _id?: string;
  fullName: string;
  batch?: string;
  batchName?: string;
}

interface ExamMark {
  id: string;
  _id?: string;
  studentId: string;
  studentName: string;
  examName: string;
  marks: number;
  totalMarks: number;
  date: string;
  batch?: string;
  batchName?: string;
}

export default function PublicResultPage() {
  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [selectedExamName, setSelectedExamName] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Use public endpoint for results
        const marksRes = await fetch("/api/public/results");
        const marksData = await marksRes.json();

        const normalizedMarks = (marksData || []).map((m: any) => ({
          ...m,
          id: m.id || m._id || String(m._id || m.id || ""),
        }));

        setExamMarks(normalizedMarks);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getPercentage = (marks: number, totalMarks: number) => {
    return ((marks / totalMarks) * 100).toFixed(2);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 80)
      return { grade: "A+", color: "bg-green-100 text-green-800" };

    if (percentage >= 70)
      return { grade: "A", color: "bg-green-100 text-green-700" };

    if (percentage >= 60)
      return { grade: "A-", color: "bg-blue-100 text-blue-800" };

    if (percentage >= 50)
      return { grade: "B", color: "bg-yellow-100 text-yellow-800" };

    if (percentage >= 40)
      return { grade: "C", color: "bg-orange-100 text-orange-800" };

    if (percentage >= 33)
      return { grade: "D", color: "bg-orange-100 text-orange-700" };

    return { grade: "F", color: "bg-red-100 text-red-800" };
  };

  // Get unique batch names from exam marks
  const batchNames = useMemo(() => {
    return Array.from(
      new Set(examMarks.map((m) => m.batchName).filter(Boolean)),
    ) as string[];
  }, [examMarks]);

  // Get unique exam names - show all exams or filter by batch
  const examNames = useMemo(() => {
    let marks = examMarks;
    if (selectedBatchName) {
      marks = examMarks.filter((m) => m.batchName === selectedBatchName);
    }
    return Array.from(
      new Set(marks.map((m) => m.examName).filter(Boolean)),
    ) as string[];
  }, [examMarks, selectedBatchName]);

  // Filter and rank marks - allow combined results when no batch is selected
  const rankedMarks = useMemo(() => {
    if (!selectedExamName) return [];

    let filtered = examMarks.filter((m) => m.examName === selectedExamName);

    // If batch is selected, filter by batch too
    if (selectedBatchName) {
      filtered = filtered.filter((m) => m.batchName === selectedBatchName);
    }

    // Sort by percentage descending
    const sorted = [...filtered].sort((a, b) => {
      const pA = (a.marks / a.totalMarks) * 100;
      const pB = (b.marks / b.totalMarks) * 100;
      return pB - pA;
    });

    // Assign ranks (handling ties)
    const rankMap = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prevPct = (sorted[i - 1].marks / sorted[i - 1].totalMarks) * 100;
        const currPct = (sorted[i].marks / sorted[i].totalMarks) * 100;
        if (currPct < prevPct) {
          currentRank = i + 1;
        }
      }
      rankMap.set(sorted[i].id, currentRank);
    }

    return sorted.map((m) => ({
      ...m,
      rank: rankMap.get(m.id) ?? 0,
    }));
  }, [examMarks, selectedBatchName, selectedExamName]);

  // Check if showing combined results (multiple batches)
  const isShowingCombinedResults = useMemo(() => {
    if (!selectedExamName) return false;
    const uniqueBatches = new Set(
      rankedMarks.map((m) => m.batchName).filter(Boolean),
    );
    return uniqueBatches.size > 1;
  }, [rankedMarks, selectedExamName]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (rankedMarks.length === 0) return null;

    const percentages = rankedMarks.map((m) => (m.marks / m.totalMarks) * 100);
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const passCount = percentages.filter((p) => p >= 50).length;

    return {
      total: rankedMarks.length,
      average: avg.toFixed(2),
      highest: highest.toFixed(2),
      lowest: lowest.toFixed(2),
      passRate: ((passCount / rankedMarks.length) * 100).toFixed(1),
    };
  }, [rankedMarks]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Exam Results
          </h1>
          <p className="text-gray-600">
            View student exam results by batch and exam
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Batch & Exam
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name
              </label>
              <select
                title="batch name"
                value={selectedBatchName}
                onChange={(e) => {
                  setSelectedBatchName(e.target.value);
                  setSelectedExamName("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">-- All Batches (Combined) --</option>
                {batchNames.map((bn) => (
                  <option key={bn} value={bn}>
                    {bn}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to see combined results from all batches
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name
              </label>
              <select
                title="exam name"
                value={selectedExamName}
                onChange={(e) => setSelectedExamName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">-- Select Exam --</option>
                {examNames.map((en) => (
                  <option key={en} value={en}>
                    {en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isShowingCombinedResults && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                🔗 Showing combined results from multiple batches for &quot;
                {selectedExamName}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading results...</p>
          </div>
        )}

        {/* No Selection State */}
        {!loading && !selectedExamName && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Select an Exam to View Results
            </h3>
            <p className="text-gray-500">
              Please select an exam name from the filters above. You can
              optionally filter by batch.
            </p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Average</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.average}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Highest</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.highest}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Lowest</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowest}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">Pass Rate</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.passRate}%
              </p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {!loading && selectedExamName && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-xl font-semibold text-white">
                {selectedExamName}{" "}
                {selectedBatchName ? `- ${selectedBatchName}` : "(All Batches)"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {rankedMarks.length} student
                {rankedMarks.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="overflow-x-auto">
              {rankedMarks.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Student Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Batch
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Marks
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Percentage
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedMarks.map((mark, index) => {
                      const percentage = Number.parseFloat(
                        getPercentage(mark.marks, mark.totalMarks),
                      );
                      const { grade, color } = getGrade(percentage);
                      const studentName =
                        mark.studentName ||
                        students.find(
                          (s) =>
                            s.id === mark.studentId || s._id === mark.studentId,
                        )?.fullName ||
                        "Unknown";

                      return (
                        <tr
                          key={mark.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            index < 3 ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                                mark.rank === 1
                                  ? "bg-yellow-400 text-yellow-900"
                                  : mark.rank === 2
                                    ? "bg-gray-300 text-gray-800"
                                    : mark.rank === 3
                                      ? "bg-orange-300 text-orange-900"
                                      : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {mark.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {studentName}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-800 font-medium">
                              {mark.batchName || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span className="font-semibold">{mark.marks}</span>
                            <span className="text-gray-500">
                              /{mark.totalMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {percentage}%
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}
                            >
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-gray-500">
                    No results found for this exam.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Nayem&apos;s English Aid. All rights
            reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
