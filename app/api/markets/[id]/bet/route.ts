import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: marketId } = await params;
  let body: { side?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const side = body.side?.toLowerCase();
  if (side !== "yes" && side !== "no") {
    return NextResponse.json(
      { error: "side must be 'yes' or 'no'" },
      { status: 400 },
    );
  }
  const amount =
    typeof body.amount === "number" ? Math.floor(body.amount) : undefined;
  if (amount === undefined || amount <= 0) {
    return NextResponse.json(
      { error: "amount (positive number, cents) is required" },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 },
    );
  }
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.resolved) {
    return NextResponse.json({ error: "Market is resolved" }, { status: 400 });
  }
  const marketForDesc = await prisma.market.findUnique({
    where: { id: marketId },
    select: { question: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: amount } },
    });
    await tx.market.update({
      where: { id: marketId },
      data:
        side === "yes"
          ? { totalYes: { increment: amount } }
          : { totalNo: { increment: amount } },
    });
    const bet = await tx.bet.create({
      data: {
        marketId,
        userId: user.id,
        side,
        amount,
      },
    });
    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: "BET",
        amount: -amount,
        status: "COMPLETED",
        referenceId: bet.id,
        description: marketForDesc
          ? `Bet on: ${marketForDesc.question.slice(0, 50)}...`
          : "Bet",
      },
    });
  });
  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });
  return NextResponse.json({
    ok: true,
    side,
    amount,
    balance: updated?.balance ?? user.balance - amount,
  });
}
