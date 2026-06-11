import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../db/db.config";
import Payment from "../../../model/paymentModel";
import Student from "../../../model/studentModel";

// GET: Fetch payments
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const paymentType = searchParams.get("paymentType");

  const filter: Record<string, string> = {};
  if (studentId) filter.studentId = studentId;
  if (paymentType) filter.paymentType = paymentType;

  try {
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(payments, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch payments:", err);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST: Add a new payment
export async function POST(req: NextRequest) {
  await dbConnect();
  
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  console.log("Payment request body:", JSON.stringify(body, null, 2));

  const {
    studentId,
    amount,
    date,
    status,
    description,
    paymentType,
    paymentMonth,
    installmentNumber,
    courseFee,
  } = body;

  // Validate required fields with specific messages
  const missingFields = [];
  if (!studentId) missingFields.push("studentId");
  if (amount === undefined || amount === null || amount === "") missingFields.push("amount");
  if (!date) missingFields.push("date");
  if (!status) missingFields.push("status");
  if (!paymentType) missingFields.push("paymentType");

  if (missingFields.length > 0) {
    console.error("Missing fields:", missingFields);
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    if (paymentType === "monthly") {
      if (!paymentMonth) {
        return NextResponse.json(
          { error: "Payment month is required for monthly payments" },
          { status: 400 }
        );
      }

      // Check if this month already paid
      const existingPayment = await Payment.findOne({
        studentId: String(studentId),
        paymentMonth: String(paymentMonth),
        paymentType: "monthly",
      });

      if (existingPayment) {
        console.log("Existing payment found:", existingPayment);
        return NextResponse.json(
          { error: `Payment for ${paymentMonth} already exists` },
          { status: 400 }
        );
      }

      const paymentData = {
        studentId: String(studentId),
        amount: Number(amount) || 0,
        date: String(date),
        status: String(status),
        description: description || `Monthly Fee - ${paymentMonth}`,
        duePayment: 0,
        paymentType: "monthly",
        paymentMonth: String(paymentMonth),
      };

      console.log("Creating monthly payment:", paymentData);

      const payment = await Payment.create(paymentData);
      console.log("Payment created:", payment);

      return NextResponse.json(payment, { status: 201 });
    }

    if (paymentType === "installment") {
      if (!installmentNumber) {
        return NextResponse.json(
          { error: "Installment number is required" },
          { status: 400 }
        );
      }

      const instNum = Number(installmentNumber);
      if (![1, 2, 3].includes(instNum)) {
        return NextResponse.json(
          { error: "Installment number must be 1, 2, or 3" },
          { status: 400 }
        );
      }

      // Check if this installment already exists
      const existingPayment = await Payment.findOne({
        studentId: String(studentId),
        installmentNumber: instNum,
        paymentType: "installment",
      });

      if (existingPayment) {
        return NextResponse.json(
          { error: `Installment ${installmentNumber} already exists` },
          { status: 400 }
        );
      }

      // Check previous installments are paid
      if (instNum > 1) {
        const previousInstallments = await Payment.find({
          studentId: String(studentId),
          paymentType: "installment",
          installmentNumber: { $lt: instNum },
          status: "paid",
        });

        if (previousInstallments.length < instNum - 1) {
          return NextResponse.json(
            { error: `Previous installment(s) must be paid first` },
            { status: 400 }
          );
        }
      }

      // Calculate due payment
      const existingPayments = await Payment.find({
        studentId: String(studentId),
        paymentType: "installment",
        status: "paid",
      });
      const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalCourseFee = Number(courseFee) || 0;
      const duePayment = totalCourseFee - totalPaidSoFar - (status === "paid" ? Number(amount) : 0);

      const paymentData = {
        studentId: String(studentId),
        amount: Number(amount) || 0,
        date: String(date),
        status: String(status),
        description: description || `Course Fee - Installment ${installmentNumber}`,
        duePayment: Math.max(0, duePayment),
        paymentType: "installment",
        installmentNumber: instNum,
        courseFee: totalCourseFee,
      };

      console.log("Creating installment payment:", paymentData);

      const payment = await Payment.create(paymentData);
      console.log("Payment created:", payment);

      // Update student's payment tracking
      if (status === "paid") {
        await Student.findByIdAndUpdate(studentId, {
          $inc: { totalPaid: Number(amount), installmentsPaid: 1 },
          $set: { courseFee: totalCourseFee },
        });
      } else if (totalCourseFee) {
        await Student.findByIdAndUpdate(studentId, { $set: { courseFee: totalCourseFee } });
      }

      return NextResponse.json(payment, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid payment type. Must be 'monthly' or 'installment'" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string };
    console.error("Payment creation error:", err);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This payment already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to add payment" },
      { status: 500 }
    );
  }
}