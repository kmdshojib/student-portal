import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../db/db.config";
import Payment from "../../../../model/paymentModel";
import Student from "../../../../model/studentModel";
import mongoose from "mongoose";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { amount, status, date } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = new Date(date).toISOString();

    const payment = await Payment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // If this is an installment payment, update student's totalPaid
    if (payment.paymentType === "installment") {
      const allPayments = await Payment.find({
        studentId: payment.studentId,
        paymentType: "installment",
        status: "paid",
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const installmentsPaid = allPayments.length;

      await Student.findByIdAndUpdate(payment.studentId, {
        $set: { totalPaid, installmentsPaid },
      });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Store payment info before deletion for student update
    const { studentId, paymentType, amount, status } = payment;

    await Payment.findByIdAndDelete(id);

    // If this was a paid installment payment, update student's totalPaid
    if (paymentType === "installment" && status === "paid") {
      const remainingPayments = await Payment.find({
        studentId,
        paymentType: "installment",
        status: "paid",
      });
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
      const installmentsPaid = remainingPayments.length;

      await Student.findByIdAndUpdate(studentId, {
        $set: { totalPaid, installmentsPaid },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}