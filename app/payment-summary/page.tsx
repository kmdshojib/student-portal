"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Student {
  _id: string;
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  batch: string;
  batchName: string;
  monthlyFee?: number;
  courseFee?: number;
  totalPaid?: number;
  installmentsPaid?: number;
}

interface Payment {
  _id: string;
  studentId: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
  description: string;
  paymentType: "monthly" | "installment";
  paymentMonth?: string;
  installmentNumber?: 1 | 2 | 3;
  courseFee?: number;
  duePayment?: number;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function PaymentSummaryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((res) => res.json()),
      fetch("/api/payments").then((res) => res.json()),
    ])
      .then(([studentsData, paymentsData]) => {
        setStudents(studentsData);
        setPayments(paymentsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, []);

  // Filter students by batch type
  const hscStudents = students.filter((s) => s.batch === "HSC");
  const admissionStudents = students.filter((s) => s.batch === "Admission" || s.batch === "Preparation");

  // Get unique batch names for each type
  const hscBatchNames = [...new Set(hscStudents.map((s) => s.batchName))];
  const admissionBatchNames = [...new Set(admissionStudents.map((s) => s.batchName))];

  // Get unique years from payments
  const years = [...new Set(payments
    .filter((p) => p.paymentMonth)
    .map((p) => p.paymentMonth!.split("-")[0])
  )].sort((a, b) => Number(b) - Number(a));

  if (years.length === 0) {
    years.push(new Date().getFullYear().toString());
  }

  // Get monthly payment status for a student
  const getMonthlyPaymentStatus = (studentId: string, month: string) => {
    const paymentMonth = `${selectedYear}-${month}`;
    const payment = payments.find(
      (p) =>
        p.studentId === studentId &&
        p.paymentType === "monthly" &&
        p.paymentMonth === paymentMonth
    );
    return payment;
  };

  // Get installment payments for a student
  const getInstallmentPayments = (studentId: string) => {
    return payments.filter(
      (p) => p.studentId === studentId && p.paymentType === "installment"
    );
  };

  // Calculate HSC summary stats
  const getHSCSummary = () => {
    const filteredStudents = selectedBatchName && selectedBatchName !== "all"
      ? hscStudents.filter((s) => s.batchName === selectedBatchName)
      : hscStudents;

    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;

    filteredStudents.forEach((student) => {
      const monthlyFee = student.monthlyFee || 0;
      MONTHS.forEach((month) => {
        const payment = getMonthlyPaymentStatus(student._id, month.value);
        totalExpected += monthlyFee;
        if (payment?.status === "paid") {
          totalCollected += payment.amount;
        } else {
          totalPending += monthlyFee;
        }
      });
    });

    return { totalExpected, totalCollected, totalPending, studentCount: filteredStudents.length };
  };

  // Calculate Admission summary stats
  const getAdmissionSummary = () => {
    const filteredStudents = selectedBatchName && selectedBatchName !== "all"
      ? admissionStudents.filter((s) => s.batchName === selectedBatchName)
      : admissionStudents;

    let totalCourseFee = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let studentsWithOverdue = 0;

    filteredStudents.forEach((student) => {
      const courseFee = student.courseFee || 0;
      const studentPayments = getInstallmentPayments(student._id);
      const paidAmount = studentPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);

      totalCourseFee += courseFee;
      totalPaid += paidAmount;
      const due = courseFee - paidAmount;
      if (due > 0) {
        totalDue += due;
        studentsWithOverdue++;
      }
    });

    return { totalCourseFee, totalPaid, totalDue, studentsWithOverdue, studentCount: filteredStudents.length };
  };

  const hscSummary = getHSCSummary();
  const admissionSummary = getAdmissionSummary();

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Payment Summary
            </h1>
            <p className="text-gray-600">
              Overview of all student payments by batch type
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <Tabs defaultValue="hsc" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hsc" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              HSC (Monthly)
            </TabsTrigger>
            <TabsTrigger value="admission" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Admission/Preparation
            </TabsTrigger>
          </TabsList>

          {/* HSC Monthly Payments Tab */}
          <TabsContent value="hsc" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Name
                    </label>
                    <Select value={selectedBatchName} onValueChange={setSelectedBatchName}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {hscBatchNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {hscSummary.studentCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Expected ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    ৳{hscSummary.totalExpected.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ৳{hscSummary.totalCollected.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    ৳{hscSummary.totalPending.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Payment Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Payment Status - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-white">Student</TableHead>
                        <TableHead className="sticky left-0 bg-white">Batch</TableHead>
                        {MONTHS.map((month) => (
                          <TableHead key={month.value} className="text-center min-w-[80px]">
                            {month.label.slice(0, 3)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedBatchName && selectedBatchName !== "all"
                        ? hscStudents.filter((s) => s.batchName === selectedBatchName)
                        : hscStudents
                      ).map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="sticky left-0 bg-white font-medium">
                            {student.fullName}
                          </TableCell>
                          <TableCell className="sticky left-0 bg-white text-gray-600">
                            {student.batchName}
                          </TableCell>
                          {MONTHS.map((month) => {
                            const payment = getMonthlyPaymentStatus(student._id, month.value);
                            return (
                              <TableCell key={month.value} className="text-center">
                                {payment?.status === "paid" ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    ৳{payment.amount}
                                  </Badge>
                                ) : payment?.status === "pending" ? (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400">
                                    —
                                  </Badge>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      {hscStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                            No HSC students found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admission Installments Tab */}
          <TabsContent value="admission" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Name
                    </label>
                    <Select value={selectedBatchName} onValueChange={setSelectedBatchName}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {admissionBatchNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {admissionSummary.studentCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Course Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    ৳{admissionSummary.totalCourseFee.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ৳{admissionSummary.totalPaid.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Total Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    ৳{admissionSummary.totalDue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {admissionSummary.studentsWithOverdue} students with due
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Installment Payment Table */}
            <Card>
              <CardHeader>
                <CardTitle>Installment Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Course Fee</TableHead>
                        <TableHead className="text-center">Installment 1</TableHead>
                        <TableHead className="text-center">Installment 2</TableHead>
                        <TableHead className="text-center">Installment 3</TableHead>
                        <TableHead className="text-right">Total Paid</TableHead>
                        <TableHead className="text-right">Due Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedBatchName && selectedBatchName !== "all"
                        ? admissionStudents.filter((s) => s.batchName === selectedBatchName)
                        : admissionStudents
                      ).map((student) => {
                        const studentPayments = getInstallmentPayments(student._id);
                        const inst1 = studentPayments.find((p) => p.installmentNumber === 1);
                        const inst2 = studentPayments.find((p) => p.installmentNumber === 2);
                        const inst3 = studentPayments.find((p) => p.installmentNumber === 3);
                        const totalPaid = studentPayments
                          .filter((p) => p.status === "paid")
                          .reduce((sum, p) => sum + p.amount, 0);
                        const courseFee = student.courseFee || 0;
                        const dueAmount = courseFee - totalPaid;

                        return (
                          <TableRow key={student._id}>
                            <TableCell className="font-medium">
                              {student.fullName}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {student.batchName}
                            </TableCell>
                            <TableCell className="text-right">
                              ৳{courseFee.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {inst1 ? (
                                <div className="flex flex-col items-center">
                                  <Badge
                                    className={
                                      inst1.status === "paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : inst1.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-red-100 text-red-800 hover:bg-red-100"
                                    }
                                  >
                                    {inst1.status === "paid" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {inst1.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                    {inst1.status === "overdue" && <AlertCircle className="w-3 h-3 mr-1" />}
                                    ৳{inst1.amount.toLocaleString()}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">
                                  —
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {inst2 ? (
                                <div className="flex flex-col items-center">
                                  <Badge
                                    className={
                                      inst2.status === "paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : inst2.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-red-100 text-red-800 hover:bg-red-100"
                                    }
                                  >
                                    {inst2.status === "paid" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {inst2.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                    {inst2.status === "overdue" && <AlertCircle className="w-3 h-3 mr-1" />}
                                    ৳{inst2.amount.toLocaleString()}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">
                                  —
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {inst3 ? (
                                <div className="flex flex-col items-center">
                                  <Badge
                                    className={
                                      inst3.status === "paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : inst3.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : "bg-red-100 text-red-800 hover:bg-red-100"
                                    }
                                  >
                                    {inst3.status === "paid" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {inst3.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                    {inst3.status === "overdue" && <AlertCircle className="w-3 h-3 mr-1" />}
                                    ৳{inst3.amount.toLocaleString()}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">
                                  —
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              ৳{totalPaid.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {dueAmount > 0 ? (
                                <span className="font-semibold text-red-600">
                                  ৳{dueAmount.toLocaleString()}
                                </span>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {admissionStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No Admission students found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
