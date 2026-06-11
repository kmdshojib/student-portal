"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import StudentModal from "@/components/updateStudentModal";
import { toast } from "react-toastify";

interface Student {
  _id: string;
  id: string; // Add this for compatibility with modal
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  batch: string;
  batchName: string;
  enrollmentDate: string;
  totalFees: number;
  paidFees: number;
  email?: string;
}

interface BatchData {
  batches: string[];
  batchNames: string[];
}

export default function DashboardPage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedBatchName, setSelectedBatchName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/students/batches")
      .then((res) => res.json())
      .then((data) => {
        setBatches(data.batches);
        setBatchNames(data.batchNames);
      });
  }, []);

  useEffect(() => {
    if (selectedBatch && selectedBatchName) {
      const params = new URLSearchParams();
      params.append("batch", selectedBatch);
      params.append("batchName", selectedBatchName);
      fetch(`/api/students?${params.toString()}`)
        .then((res) => res.json())
        .then(setStudents);
    } else {
      setStudents([]);
    }
  }, [selectedBatch, selectedBatchName]);

  const handleStudentClick = (student: Student) => {
    const studentWithId = { ...student, id: student._id };
    setSelectedStudent(studentWithId);
    setIsModalOpen(true);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      const { _id, id, ...studentData } = updatedStudent;
      const studentId = _id || id;

      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: studentId,
          ...studentData,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Update the students list
        toast.success("Student updated successfully");
        setStudents(
          students.map((student) =>
            student._id === updated._id ? updated : student
          )
        );
        setIsModalOpen(false);
        setSelectedStudent(null);
      } else {
        const error = await response.json();
        toast.error(`Failed to update student: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student. Please try again.");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await fetch(`/api/students?id=${studentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the student from the list
        toast.success("Student deleted successfully");
        setStudents(students.filter((student) => student._id !== studentId));
      } else {
        const error = await response.json();
        toast.error(`Failed to delete student: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Management System
          </h1>
          <p className="text-gray-600">
            Manage students, payments, attendance, and exam marks
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {students.length}
            </div>
            <div className="text-gray-600">Total Students</div>
          </Link>
          <Link
            href="/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-green-600 mb-2">
              Payments
            </div>
            <div className="text-gray-600">Manage Fees</div>
          </Link>
          <Link
            href="/attendance"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-purple-600 mb-2">
              Attendance
            </div>
            <div className="text-gray-600">Track Attendance</div>
          </Link>
          <Link
            href="/exam-marks"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-orange-600 mb-2">
              Exam Marks
            </div>
            <div className="text-gray-600">Enter Marks</div>
          </Link>
          <Link
            href="/guardian-report"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              Summary
            </div>
            <div className="text-gray-600">Student Overview</div>
          </Link>
          <Link
            href="/student-registration"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              Registration
            </div>
            <div className="text-gray-600">Student Registration</div>
          </Link>
          <Link
            href="/result"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              Result
            </div>
            <div className="text-gray-600">Student or Batch Result</div>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Filter Students
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Year
              </label>
              <select
                title="batch"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" disabled>
                  Select Batch Year
                </option>
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
                <option value="" disabled>
                  Select Batch Name
                </option>
                <option value="">All Batch Names</option>
                {batchNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="md:col-span-2">
              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filter
              </button>
            </div> */}
          </form>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students ({students.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {selectedBatch && selectedBatchName ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Guardian
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Batch Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr
                        key={student._id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td
                          className="px-6 py-4 text-sm text-blue-600 font-semibold cursor-pointer hover:underline"
                          onClick={() => handleStudentClick(student)}
                        >
                          {student.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.guardianName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.phoneNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.batch}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.batchName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <button
                            onClick={() => handleDeleteStudent(student._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-lg">
                Please select both Batch Year and Batch Name to view students.
              </div>
            )}
          </div>
        </div>

        {/* Update Student Modal */}
        <StudentModal
          student={selectedStudent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={(student) => {
            handleUpdateStudent(student);
          }}
        />
      </div>
    </main>
  );
}
