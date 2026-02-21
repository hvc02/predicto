import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: marketId } = await params;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (!market.resolved || market.outcomeYes === null) {
    return NextResponse.json({ error: "Market not resolved" }, { status: 400 });
  }
  const existing = await prisma.claim.findUnique({
    where: { marketId_userId: { marketId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already claimed" }, { status: 400 });
  }
  const winningSide = market.outcomeYes ? "yes" : "no";
  const myBets = await prisma.bet.findMany({
    where: { marketId, userId: user.id, side: winningSide },
  });
  const myStake = myBets.reduce((s, b) => s + b.amount, 0);
  if (myStake <= 0) {
    return NextResponse.json({ error: "Nothing to claim" }, { status: 400 });
  }
  const winningPool = market.outcomeYes ? market.totalYes : market.totalNo;
  const totalPool = market.totalYes + market.totalNo;
  const payout = Math.floor((totalPool * myStake) / winningPool);
  if (payout <= 0) {
    return NextResponse.json({ error: "Nothing to claim" }, { status: 400 });
  }
  const marketForDesc = await prisma.market.findUnique({
    where: { id: marketId },
    select: { question: true },
  });
  await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.create({
      data: {
        marketId,
        userId: user.id,
        amountClaimed: payout,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { increment: payout } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: "CLAIM",
        amount: payout,
        status: "COMPLETED",
        referenceId: claim.id,
        description: marketForDesc
          ? `Claim: ${marketForDesc.question.slice(0, 50)}...`
          : "Claim winnings",
      },
    });
  });
  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });
  return NextResponse.json({
    ok: true,
    amountClaimed: payout,
    balance: updated?.balance ?? user.balance + payout,
  });
}
