"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  smsSent?: boolean;
  smsSentAt?: string;
}

export default function ExamMarksPage() {
  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [selectedExamName, setSelectedExamName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    batch: "",
    batchName: "",
    studentId: "",
    examName: "",
    marks: "",
    totalMarks: "100",
    date: new Date().toISOString().split("T")[0],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMark, setEditingMark] = useState<ExamMark | null>(null);
  const [editFormData, setEditFormData] = useState({
    marks: "",
    totalMarks: "",
    date: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  // SMS State
  const [smsLoading, setSmsLoading] = useState<string | null>(null);
  // Track sent SMS locally (in case API doesn't persist)
  const [sentSmsIds, setSentSmsIds] = useState<Set<string>>(new Set());
  // Bulk SMS State
  const [bulkSmsLoading, setBulkSmsLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      const res = await fetch("/api/students");
      const data = await res.json();
      const normalized = (data || []).map((s: any) => ({
        ...s,
        id: s.id || s._id || String(s._id || s.id || ""),
      }));
      setStudents(normalized);
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    async function fetchMarks() {
      setLoading(true);
      const res = await fetch("/api/exam-marks");
      const data = await res.json();
      const normalized = (data || []).map((m: any) => ({
        ...m,
        id: m.id || m._id || String(m._id || m.id || ""),
      }));
      setExamMarks(normalized);

      const alreadySent = new Set<string>();
      normalized.forEach((m: ExamMark) => {
        if (m.smsSent) {
          alreadySent.add(m.id || m._id || "");
        }
      });
      setSentSmsIds(alreadySent);

      setLoading(false);
    }
    fetchMarks();
  }, []);

  const getPercentage = (marks: number, totalMarks: number) => {
    return ((marks / totalMarks) * 100).toFixed(2);
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "A-";
    if (percentage >= 50) return "B";
    if (percentage >= 40) return "C";
    if (percentage >= 33) return "D";
    return "F";
  };

  const preventNumberInputScroll = (
    e: React.WheelEvent<HTMLInputElement>,
  ) => {
    e.currentTarget.blur();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStudentObj = students.find(
      (s) => s.id === formData.studentId || s._id === formData.studentId,
    );

    const payload = {
      studentId:
        selectedStudentObj?._id || selectedStudentObj?.id || formData.studentId,
      studentName: selectedStudentObj?.fullName || "",
      examName: formData.examName,
      marks: Number(formData.marks),
      totalMarks: Number(formData.totalMarks),
      date: formData.date,
      batch: formData.batch || undefined,
      batchName: formData.batchName || undefined,
    };

    const res = await fetch("/api/exam-marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newMark = await res.json();
      setExamMarks((prev) => [
        ...prev,
        { ...newMark, id: newMark.id || newMark._id },
      ]);
      setFormData({
        batch: "",
        batchName: "",
        studentId: "",
        examName: "",
        marks: "",
        totalMarks: "100",
        date: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      alert("Exam marks added successfully!");
    } else {
      const err = await res.json().catch(() => ({}));
      alert("Failed to add exam marks. " + (err?.error || ""));
    }
  };

  // Open edit modal
  const handleEditClick = (mark: ExamMark) => {
    setEditingMark(mark);
    setEditFormData({
      marks: String(mark.marks),
      totalMarks: String(mark.totalMarks),
      date: mark.date,
    });
    setEditModalOpen(true);
  };

  // Close edit modal
  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingMark(null);
    setEditFormData({ marks: "", totalMarks: "", date: "" });
  };

  // Submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMark) return;

    setEditLoading(true);
    const markId = editingMark._id || editingMark.id;

    try {
      const res = await fetch(`/api/exam-marks/${markId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: Number(editFormData.marks),
          totalMarks: Number(editFormData.totalMarks),
          date: editFormData.date,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setExamMarks((prev) =>
          prev.map((m) =>
            m.id === markId || m._id === markId
              ? { ...m, ...updated, id: updated.id || updated._id }
              : m,
          ),
        );
        // Reset SMS sent status when marks are edited
        setSentSmsIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(markId);
          return newSet;
        });
        handleEditClose();
        alert("Exam marks updated successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to update. " + (err?.error || ""));
      }
    } catch (error) {
      alert("An error occurred while updating.");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handler
  const handleDeleteClick = async (mark: ExamMark) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the exam marks for "${mark.studentName}" in "${mark.examName}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    const markId = mark._id || mark.id;
    setDeleteLoading(markId);

    try {
      const res = await fetch(`/api/exam-marks/${markId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExamMarks((prev) =>
          prev.filter((m) => m.id !== markId && m._id !== markId),
        );
        // Remove from sent SMS tracking
        setSentSmsIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(markId);
          return newSet;
        });
        alert("Exam marks deleted successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to delete. " + (err?.error || ""));
      }
    } catch (error) {
      alert("An error occurred while deleting.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Send SMS handler
  const handleSendSMS = async (mark: ExamMark) => {
    const markId = mark._id || mark.id;
    const student = students.find(
      (s) => s.id === mark.studentId || s._id === mark.studentId,
    );
    const phone = student?.phoneNumber;

    if (!phone) {
      alert("Cannot send SMS: student has no phone number.");
      return;
    }

    setSmsLoading(markId);
    try {
      const percentage = Number.parseFloat(
        getPercentage(mark.marks, mark.totalMarks),
      );
      const grade = getGrade(percentage);
      const studentName =
        mark.studentName || student?.fullName || mark.studentId;

      const message = `Dear ${studentName}, Your ${mark.examName} marks: ${mark.marks}/${mark.totalMarks} (${percentage}%). Grade: ${grade}. Date: ${mark.date}. - Nayem's English Aid`;

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phoneNumbers: [phone],
          batch: mark.batch,
          batchName: mark.batchName,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));

        const smsSentAt = new Date().toISOString();

        // Update SMS status in database FIRST
        const updateRes = await fetch(`/api/exam-marks/${markId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smsSent: true,
            smsSentAt: smsSentAt,
          }),
        });

        if (updateRes.ok) {
          const updatedMark = await updateRes.json();
          // Update local state after successful database update
          setSentSmsIds((prev) => new Set(prev).add(markId));
          setExamMarks((prev) =>
            prev.map((m) =>
              m.id === markId || m._id === markId
                ? { ...m, smsSent: true, smsSentAt: smsSentAt }
                : m,
            ),
          );
          alert("SMS sent successfully! " + (data?.message || ""));
        } else {
          const updateErr = await updateRes.json().catch(() => ({}));
          console.error("Failed to update SMS status:", updateErr);
          // Still update local state even if DB update fails
          setSentSmsIds((prev) => new Set(prev).add(markId));
          setExamMarks((prev) =>
            prev.map((m) =>
              m.id === markId || m._id === markId
                ? { ...m, smsSent: true, smsSentAt: smsSentAt }
                : m,
            ),
          );
          alert("SMS sent but failed to save status to database.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to send SMS. " + (err?.error || ""));
      }
    } catch (error) {
      console.error("SMS send error:", error);
      alert("An error occurred while sending SMS.");
    } finally {
      setSmsLoading(null);
    }
  };

  // Check if SMS was sent for a mark
  const isSmsSent = (mark: ExamMark) => {
    const markId = mark._id || mark.id;
    return mark.smsSent || sentSmsIds.has(markId);
  };

  // Send SMS to all students in selected exam
  const handleSendSMSToAll = async () => {
    if (!selectedExamName) {
      alert("Please select an exam first.");
      return;
    }

    // Get marks that haven't had SMS sent yet
    const marksToSend = rankedMarks.filter((mark) => !isSmsSent(mark));

    if (marksToSend.length === 0) {
      alert("All students in this exam have already been sent SMS.");
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send SMS to ${marksToSend.length} student(s) for exam "${selectedExamName}"?`,
    );

    if (!confirmSend) return;

    setBulkSmsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const mark of marksToSend) {
        const markId = mark._id || mark.id;
        const student = students.find(
          (s) => s.id === mark.studentId || s._id === mark.studentId,
        );
        const phone = student?.phoneNumber;

        if (!phone) {
          failCount++;
          continue;
        }

        try {
          const percentage = Number.parseFloat(
            getPercentage(mark.marks, mark.totalMarks),
          );
          const grade = getGrade(percentage);
          const studentName =
            mark.studentName || student?.fullName || mark.studentId;

          const message = `Dear ${studentName}, Your ${mark.examName} marks: ${mark.marks}/${mark.totalMarks} (${percentage}%). Grade: ${grade}. Date: ${mark.date}. - Nayem's English Aid`;

          const res = await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              phoneNumbers: [phone],
              batch: mark.batch,
              batchName: mark.batchName,
            }),
          });

          if (res.ok) {
            const smsSentAt = new Date().toISOString();

            // Update SMS status in database
            await fetch(`/api/exam-marks/${markId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                smsSent: true,
                smsSentAt: smsSentAt,
              }),
            });

            // Update local state
            setSentSmsIds((prev) => new Set(prev).add(markId));
            setExamMarks((prev) =>
              prev.map((m) =>
                m.id === markId || m._id === markId
                  ? { ...m, smsSent: true, smsSentAt: smsSentAt }
                  : m,
              ),
            );
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to send SMS for mark ${markId}:`, error);
          failCount++;
        }
      }

      alert(
        `Bulk SMS completed!\n✓ Success: ${successCount}\n✗ Failed: ${failCount}`,
      );
    } catch (error) {
      console.error("Bulk SMS error:", error);
      alert("An error occurred while sending bulk SMS.");
    } finally {
      setBulkSmsLoading(false);
    }
  };

  // Filtering logic
  const filteredMarks = useMemo(() => {
    return examMarks.filter((m) => {
      if (selectedBatch && m.batch !== selectedBatch) return false;
      if (selectedBatchName && m.batchName !== selectedBatchName) return false;
      if (selectedExamName && m.examName !== selectedExamName) return false;

      if (selectedStudent) {
        const sel = students.find(
          (s) => s.id === selectedStudent || s._id === selectedStudent,
        );
        if (sel) {
          if (
            !(
              m.studentId === sel.id ||
              m.studentId === sel._id ||
              m.studentName === sel.fullName
            )
          ) {
            return false;
          }
        } else {
          if (
            m.studentId !== selectedStudent &&
            m.studentName !== selectedStudent
          )
            return false;
        }
      }

      return true;
    });
  }, [
    examMarks,
    selectedBatch,
    selectedBatchName,
    selectedExamName,
    selectedStudent,
    students,
  ]);

  // Ranking logic
  const showRanking = Boolean(selectedBatchName && selectedExamName);

  const rankedMarks = useMemo(() => {
    if (!showRanking) return filteredMarks;

    const sorted = [...filteredMarks].sort((a, b) => {
      const pA = (a.marks / a.totalMarks) * 100;
      const pB = (b.marks / b.totalMarks) * 100;
      return pB - pA;
    });

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

    return filteredMarks.map((m) => ({
      ...m,
      rank: rankMap.get(m.id) ?? 0,
    }));
  }, [filteredMarks, showRanking]);

  // Pagination logic
  const totalPages = Math.ceil(rankedMarks.length / entriesPerPage);
  const paginatedMarks = rankedMarks.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [
    selectedBatch,
    selectedBatchName,
    selectedExamName,
    selectedStudent,
    totalPages,
    currentPage,
  ]);

  // PDF Download function
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Nayem's English Aid", 14, 22);

    doc.setFontSize(11);
    let subtitle = "Filters: ";
    if (selectedBatchName) subtitle += `Batch: ${selectedBatchName}  `;
    if (selectedExamName) subtitle += `Exam: ${selectedExamName}  `;
    if (selectedStudent) {
      const st = students.find(
        (s) => s.id === selectedStudent || s._id === selectedStudent,
      );
      subtitle += `Student: ${st?.fullName || selectedStudent}  `;
    }
    if (subtitle === "Filters: ") subtitle = "All Records";
    doc.text(subtitle, 14, 30);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    const headers = showRanking
      ? [
          [
            "S/N",
            "Rank",
            "Student",
            "Exam",
            "Marks",
            "Percentage",
            "Grade",
            "Date",
            "SMS",
          ],
        ]
      : [
          [
            "S/N",
            "Student",
            "Exam",
            "Marks",
            "Percentage",
            "Grade",
            "Date",
            "SMS",
          ],
        ];

    const body = rankedMarks.map((mark, index) => {
      const percentage = Number.parseFloat(
        getPercentage(mark.marks, mark.totalMarks),
      );
      const grade = getGrade(percentage);
      const studentName =
        mark.studentName ||
        students.find(
          (s) => s.id === mark.studentId || s._id === mark.studentId,
        )?.fullName ||
        mark.studentId;
      const serialNumber = (index + 1).toString();
      const smsStatus = isSmsSent(mark) ? "✓ Sent" : "Not Sent";

      if (showRanking) {
        return [
          serialNumber,
          (mark as any).rank?.toString() || "",
          studentName,
          mark.examName,
          `${mark.marks}/${mark.totalMarks}`,
          `${percentage}%`,
          grade,
          mark.date,
          smsStatus,
        ];
      } else {
        return [
          serialNumber,
          studentName,
          mark.examName,
          `${mark.marks}/${mark.totalMarks}`,
          `${percentage}%`,
          grade,
          mark.date,
          smsStatus,
        ];
      }
    });

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 42,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    const filename = showRanking
      ? `exam-marks-${selectedBatchName}-${selectedExamName}.pdf`
      : "exam-marks-report.pdf";
    doc.save(filename);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Exam Marks Entry
            </h1>
            <p className="text-gray-600">View and manage student exam marks</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filter Marks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <select
                title="select"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batches</option>
                {Array.from(
                  new Set(students.map((s) => s.batch).filter(Boolean)),
                ).map((batch) => (
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
                title="batch name"
                value={selectedBatchName}
                onChange={(e) => setSelectedBatchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Batch Names</option>
                {Array.from(
                  new Set(students.map((s) => s.batchName).filter(Boolean)),
                ).map((bn) => (
                  <option key={bn} value={bn}>
                    {bn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name
              </label>
              <select
                title="filter"
                value={selectedExamName}
                onChange={(e) => setSelectedExamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Exams</option>
                {Array.from(
                  new Set(examMarks.map((m) => m.examName).filter(Boolean)),
                ).map((en) => (
                  <option key={en} value={en}>
                    {en}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {showRanking && (
            <p className="mt-4 text-sm text-green-600 font-medium">
              📊 Ranking enabled for Batch: <strong>{selectedBatchName}</strong>{" "}
              &amp; Exam: <strong>{selectedExamName}</strong>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {showForm ? "Cancel" : "+ Add Exam Marks"}
          </button>
          <button
            onClick={() => router.push("/add-exam-marks")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {"+ Add Batch Exam Marks"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={rankedMarks.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download PDF
          </button>
          {selectedExamName && (
            <button
              onClick={handleSendSMSToAll}
              disabled={bulkSmsLoading || rankedMarks.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {bulkSmsLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Send SMS to All (
                  {rankedMarks.filter((m) => !isSmsSent(m)).length})
                </>
              )}
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Exam Marks
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <select
                  value={formData.batch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batch: e.target.value,
                      batchName: "",
                      studentId: "",
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Batch</option>
                  {Array.from(
                    new Set(students.map((s) => s.batch).filter(Boolean)),
                  ).map((batch) => (
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
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batchName: e.target.value,
                      studentId: "",
                    })
                  }
                  required
                  disabled={!formData.batch}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Batch Name</option>
                  {Array.from(
                    new Set(students.map((s) => s.batchName).filter(Boolean)),
                  )
                    .filter((bn) =>
                      formData.batch
                        ? students.some(
                            (s) =>
                              s.batch === formData.batch && s.batchName === bn,
                          )
                        : true,
                    )
                    .map((bn) => (
                      <option key={bn} value={bn}>
                        {bn}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                  disabled={!formData.batch || !formData.batchName}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Student</option>
                  {students
                    .filter((s) =>
                      formData.batchName
                        ? s.batchName === formData.batchName
                        : true,
                    )
                    .map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Name
                </label>
                <input
                  type="text"
                  value={formData.examName}
                  onChange={(e) =>
                    setFormData({ ...formData, examName: e.target.value })
                  }
                  placeholder="e.g., Mathematics"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks Obtained
                </label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData({ ...formData, marks: e.target.value })
                  }
                  onWheel={preventNumberInputScroll}
                  placeholder="0"
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: e.target.value })
                  }
                  onWheel={preventNumberInputScroll}
                  required
                  min="1"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save Marks
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

        {/* Marks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Exam Marks Records
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        S/N
                      </th>
                      {showRanking && (
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Rank
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        SMS
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMarks.length > 0 ? (
                      paginatedMarks.map((mark, index) => {
                        const percentage = Number.parseFloat(
                          getPercentage(mark.marks, mark.totalMarks),
                        );
                        const grade = getGrade(percentage);
                        const serialNumber =
                          (currentPage - 1) * entriesPerPage + index + 1;
                        const markId = mark._id || mark.id;
                        const isDeleting = deleteLoading === markId;
                        const smsSentStatus = isSmsSent(mark);
                        return (
                          <tr
                            key={mark.id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {serialNumber}
                            </td>
                            {showRanking && (
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800">
                                  {(mark as any).rank}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {mark.studentName ||
                                students.find(
                                  (s) =>
                                    s.id === mark.studentId ||
                                    s._id === mark.studentId,
                                )?.fullName ||
                                mark.studentId}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mark.examName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {mark.marks}/{mark.totalMarks}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {percentage}%
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mark.date}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {smsSentStatus ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                  Not Sent
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditClick(mark)}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-xs font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleSendSMS(mark)}
                                  disabled={smsLoading === markId}
                                  className={`px-3 py-1 text-white rounded transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                    smsSentStatus
                                      ? "bg-gray-400 hover:bg-gray-500"
                                      : "bg-indigo-500 hover:bg-indigo-600"
                                  }`}
                                >
                                  {smsLoading === markId
                                    ? "Sending..."
                                    : smsSentStatus
                                      ? "Resend SMS"
                                      : "Send SMS"}
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(mark)}
                                  disabled={isDeleting}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={showRanking ? 10 : 9}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No exam marks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 py-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 rounded ${
                          currentPage === i + 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingMark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Exam Marks
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Student: <strong>{editingMark.studentName}</strong> | Exam:{" "}
                <strong>{editingMark.examName}</strong>
              </p>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks Obtained
                </label>
                <input
                  type="number"
                  value={editFormData.marks}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, marks: e.target.value })
                  }
                  onWheel={preventNumberInputScroll}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={editFormData.totalMarks}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      totalMarks: e.target.value,
                    })
                  }
                  onWheel={preventNumberInputScroll}
                  required
                  min="1"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleEditClose}
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
