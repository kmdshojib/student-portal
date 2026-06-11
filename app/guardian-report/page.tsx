"use client";

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function GuardianReportPage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch batches and batch names on mount
  useEffect(() => {
    fetch("/api/students/batches")
      .then((res) => res.json())
      .then((data) => {
        setBatches(data.batches || []);
        setBatchNames(data.batchNames || []);
      })
      .catch(() => {
        setBatches([]);
        setBatchNames([]);
      });
  }, []);

  // Fetch students when batch or batchName changes
  useEffect(() => {
    if (!selectedBatch) {
      setStudents([]);
      setSelectedBatchName("");
      setSelectedStudent("");
      return;
    }
    let url = `/api/students?batch=${encodeURIComponent(selectedBatch)}`;
    if (selectedBatchName)
      url += `&batchName=${encodeURIComponent(selectedBatchName)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data || []);
        setSelectedStudent("");
      })
      .catch(() => setStudents([]));
  }, [selectedBatch, selectedBatchName]);

  // Fetch student summary when student changes
  useEffect(() => {
    if (!selectedStudent) {
      setStudentSummary(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/student-summary/${selectedStudent}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch student summary");
        return res.json();
      })
      .then((data) => {
        setStudentSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setStudentSummary(null);
        setLoading(false);
      });
  }, [selectedStudent]);

  const handleDownload = async () => {
    if (!reportRef.current) return;

    const original = reportRef.current;
    // Clone and strip stylesheet references
    const clone = original.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("style, link").forEach((n) => n.remove());

    // preserve layout width & off-screen placement
    clone.style.width = `${original.offsetWidth}px`;
    clone.style.boxSizing = "border-box";
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    document.body.appendChild(clone);

    try {
      // Inline a minimal set of computed layout styles to preserve structure
      const originals = Array.from(original.querySelectorAll<HTMLElement>("*"));
      const clones = Array.from(clone.querySelectorAll<HTMLElement>("*"));
      const propsToCopy = [
        "display","width","min-width","max-width","height","min-height","max-height",
        "box-sizing","padding","padding-top","padding-right","padding-bottom","padding-left",
        "margin","margin-top","margin-right","margin-bottom","margin-left",
        "font-family","font-size","font-weight","line-height","text-align",
        "vertical-align","white-space","overflow","border-radius"
      ];
      for (let i = 0; i < clones.length; i++) {
        const src = originals[i];
        const dst = clones[i];
        if (!src || !dst) continue;
        const cs = window.getComputedStyle(src);
        for (const prop of propsToCopy) {
          try {
            const val = cs.getPropertyValue(prop);
            if (val) dst.style.setProperty(prop, val, cs.getPropertyPriority(prop));
          } catch {}
        }
      }

      // Force black & white: override colors, backgrounds, borders, remove gradients/shadows
      const all = Array.from(clone.querySelectorAll<HTMLElement>("*")).concat([clone]);
      all.forEach((el) => {
        try {
          // text and backgrounds
          el.style.setProperty("color", "#000000", "important");
          el.style.setProperty("background-color", "#ffffff", "important");
          el.style.setProperty("background-image", "none", "important");
          el.style.setProperty("box-shadow", "none", "important");
          // borders -> set to black if present
          el.style.setProperty("border-color", "#000000", "important");
          el.style.setProperty("border-top-color", "#000000", "important");
          el.style.setProperty("border-right-color", "#000000", "important");
          el.style.setProperty("border-bottom-color", "#000000", "important");
          el.style.setProperty("border-left-color", "#000000", "important");
          // images and media -> force grayscale so they print in B/W
          if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "CANVAS") {
            el.style.setProperty("filter", "grayscale(100%) contrast(100%)", "important");
          } else {
            // apply a general grayscale fallback for other elements (helps gradients)
            el.style.setProperty("filter", "grayscale(100%)", "important");
          }
          // SVG fills/strokes
          if (el instanceof SVGElement) {
            (el as any).style && (el as any).style.setProperty("fill", "#000000", "important");
            (el as any).style && (el as any).style.setProperty("stroke", "#000000", "important");
          }
        } catch {}
      });

      // Also ensure root has white background
      clone.style.setProperty("background-color", "#ffffff", "important");

      // Render to canvas (higher scale for clarity)
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = await html2canvas(clone, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: false,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      // create multipage A4 PDF from canvas
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasToPdfScale = canvas.width / pdfWidth;
      const pageCanvasHeight = Math.floor(pdfHeight * canvasToPdfScale);

      let remainingHeight = canvas.height;
      let sliceY = 0;

      if (canvas.height <= pageCanvasHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
        pdf.save("guardian-report.pdf");
      } else {
        while (remainingHeight > 0) {
          const tempCanvas = document.createElement("canvas");
          const tempH = Math.min(pageCanvasHeight, remainingHeight);
          tempCanvas.width = canvas.width;
          tempCanvas.height = tempH;
          const ctx = tempCanvas.getContext("2d");
          if (!ctx) throw new Error("Failed to get canvas context");
          ctx.drawImage(canvas, 0, sliceY, canvas.width, tempH, 0, 0, canvas.width, tempH);
          const imgSlice = tempCanvas.toDataURL("image/png");
          const imgSliceHeightPdf = (tempH * pdfWidth) / canvas.width;
          pdf.addImage(imgSlice, "PNG", 0, 0, pdfWidth, imgSliceHeightPdf);
          remainingHeight -= tempH;
          sliceY += tempH;
          if (remainingHeight > 0) pdf.addPage();
        }
        pdf.save("guardian-report.pdf");
      }
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      // ensure clone cleanup
      if (clone && clone.parentElement) document.body.removeChild(clone);
    }
  };

  // Helpers
  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 75) return { color: "text-green-600", label: "Excellent" };
    if (percentage >= 60) return { color: "text-yellow-600", label: "Good" };
    return { color: "text-red-600", label: "Poor" };
  };
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Guardian Report
            </h1>
            <p className="text-gray-600">
              Student Performance & Attendance Summary
            </p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={handleDownload}
            disabled={!studentSummary}
          >
            Download Report
          </button>
        </div>

        {/* Report Content */}
        <div ref={reportRef}>
          {/* Batch and Batch Name Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setSelectedBatchName("");
                  setSelectedStudent("");
                  setStudentSummary(null);
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
                value={selectedBatchName}
                onChange={(e) => {
                  setSelectedBatchName(e.target.value);
                  setSelectedStudent("");
                  setStudentSummary(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedBatch}
              >
                <option value="">All Batch Names</option>
                {batchNames
                  .filter(
                    (bn) =>
                      !selectedBatch ||
                      students.some((s) => s.batchName === bn)
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
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={students.length === 0}
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.batch} - {s.batchName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading/Error State */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Loading...</p>
            </div>
          )}
          {error && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          )}

          {/* Student Summary */}
          {studentSummary && studentSummary.student && (
            <>
              {/* Student Information Card */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Student Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentSummary.student.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guardian Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentSummary.student.guardianName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Batch</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentSummary.student.batch} -{" "}
                      {studentSummary.student.batchName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {studentSummary.student.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Attendance Percentage
                  </div>
                  <div
                    className={`text-4xl font-bold ${getAttendanceStatus(
                      studentSummary.attendance.percentage
                    ).color}`}
                  >
                    {studentSummary.attendance.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {getAttendanceStatus(studentSummary.attendance.percentage)
                      .label}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-2">Average Marks</div>
                  <div className="text-4xl font-bold text-blue-600">
                    {studentSummary.examMarks.average}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Overall Performance
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Attendance Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummary.attendance.records.length > 0 ? (
                        studentSummary.attendance.records.map((record: any) => (
                          <tr
                            key={record.id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {record.date}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "absent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {record.status.charAt(0).toUpperCase() +
                                  record.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam Marks Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Exam Marks
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Subject
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
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummary.examMarks.records.length > 0 ? (
                        studentSummary.examMarks.records.map((mark: any) => (
                          <tr
                            key={mark.id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {mark.subject}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {mark.marks}/{mark.totalMarks}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {mark.percentage}%
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getGradeColor(
                                  mark.percentage
                                )}`}
                              >
                                {mark.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mark.date}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No exam marks found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!selectedStudent && !loading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">
                Select a student to view their guardian report
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
