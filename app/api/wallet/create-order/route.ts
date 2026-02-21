import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { razorpay, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isRazorpayConfigured() || !razorpay) {
    return NextResponse.json(
      { error: "Razorpay is not configured" },
      { status: 503 },
    );
  }
  let body: { amount?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const amountRupees =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string"
        ? parseFloat(body.amount)
        : undefined;
  if (
    amountRupees === undefined ||
    !Number.isFinite(amountRupees) ||
    amountRupees < 1
  ) {
    return NextResponse.json(
      { error: "amount (in ₹) is required and must be at least 1" },
      { status: 400 },
    );
  }
  const maxAmount = 100000; // ₹1,00,000
  if (amountRupees > maxAmount) {
    return NextResponse.json(
      { error: `Amount cannot exceed ₹${maxAmount.toLocaleString("en-IN")}` },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const amountPaise = Math.round(amountRupees * 100);
  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `d_${user.id.slice(-12)}_${Date.now().toString(36)}`, // Razorpay max 40 chars
      notes: {
        userId: user.id,
      },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      key:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ??
        process.env.RAZORPAY_KEY_ID?.trim(),
    });
  } catch (err) {
    let detail = "Unknown error";
    if (err instanceof Error) detail = err.message;
    else if (err && typeof err === "object") {
      const o = err as {
        description?: string;
        error?: { description?: string };
      };
      if (typeof o.error?.description === "string")
        detail = o.error.description;
      else if (typeof o.description === "string") detail = o.description;
      else detail = JSON.stringify(o).slice(0, 200);
    } else detail = String(err).slice(0, 200);
    console.error("Razorpay order create error:", err);
    return NextResponse.json(
      { error: "Failed to create order", detail },
      { status: 500 },
    );
  }
}
