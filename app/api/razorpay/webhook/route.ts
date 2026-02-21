import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { razorpay } from "@/lib/razorpay";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.warn("[Razorpay webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[Razorpay webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
          status?: string;
        };
      };
      order?: {
        entity?: {
          id?: string;
          notes?: Record<string, string> | { userId?: string };
        };
      };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = payload.event;
  if (event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }
  const payment = payload.payload?.payment?.entity;
  const orderId = payment?.order_id;
  if (!payment?.id || !orderId || payment.status !== "captured") {
    console.log(
      "[Razorpay webhook] payment.captured skipped: missing id/order_id or status",
      {
        paymentId: payment?.id,
        orderId,
        status: payment?.status,
      },
    );
    return NextResponse.json({ received: true });
  }
  const amountPaise = payment.amount ?? 0;
  const amountUnits = amountPaise;
  console.log("[Razorpay webhook] payment.captured", {
    paymentId: payment.id,
    orderId,
    amountPaise: amountUnits,
  });

  const existing = await prisma.walletTransaction.findFirst({
    where: { referenceId: payment.id, type: "DEPOSIT" },
  });
  if (existing) {
    console.log(
      "[Razorpay webhook] Duplicate payment, already credited",
      payment.id,
    );
    return NextResponse.json({ received: true });
  }

  let userId: string | undefined;
  const orderEntity = payload.payload?.order?.entity;
  if (orderEntity?.notes) {
    const notes = orderEntity.notes as
      | Record<string, string>
      | { userId?: string };
    userId = typeof notes.userId === "string" ? notes.userId : notes?.userId;
  }
  if (!userId && razorpay) {
    try {
      const order = await razorpay.orders.fetch(orderId);
      const notes = (
        order as { notes?: Record<string, string> | { userId?: string } }
      ).notes;
      userId =
        notes && typeof notes.userId === "string"
          ? notes.userId
          : (notes as Record<string, string>)?.["userId"];
    } catch (e) {
      console.error(
        "[Razorpay webhook] Failed to fetch order for userId",
        orderId,
        e,
      );
    }
  }
  if (!userId) {
    console.warn(
      "[Razorpay webhook] No userId in order notes, cannot credit. orderId=",
      orderId,
      "payload.order.entity.notes=",
      orderEntity?.notes,
    );
    return NextResponse.json({ received: true });
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amountUnits } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: userId!,
          type: "DEPOSIT",
          amount: amountUnits,
          status: "COMPLETED",
          referenceId: payment.id,
          description: "Deposit via Razorpay",
        },
      });
    });
    console.log("[Razorpay webhook] Credited balance", {
      userId,
      amountUnits,
      paymentId: payment.id,
    });
  } catch (e) {
    console.error(
      "[Razorpay webhook] DB error crediting balance",
      { userId, amountUnits, paymentId: payment.id },
      e,
    );
    return NextResponse.json(
      { error: "Failed to credit balance" },
      { status: 500 },
    );
  }
  return NextResponse.json({ received: true });
}
