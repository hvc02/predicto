import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const bets = await prisma.bet.findMany({
    where: { userId: user.id },
    include: {
      market: { select: { id: true, question: true, resolved: true, outcomeYes: true, totalYes: true, totalNo: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const byMarket = new Map<
    string,
    { market: { id: string; question: string; resolved: boolean; outcomeYes: boolean | null; totalYes: number; totalNo: number }; yesAmount: number; noAmount: number; claims: number }
  >();
  for (const bet of bets) {
    const key = bet.marketId;
    if (!byMarket.has(key)) {
      byMarket.set(key, {
        market: {
          id: bet.market.id,
          question: bet.market.question,
          resolved: bet.market.resolved,
          outcomeYes: bet.market.outcomeYes,
          totalYes: bet.market.totalYes,
          totalNo: bet.market.totalNo,
        },
        yesAmount: 0,
        noAmount: 0,
        claims: 0,
      });
    }
    const row = byMarket.get(key)!;
    if (bet.side === "yes") row.yesAmount += bet.amount;
    else row.noAmount += bet.amount;
  }
  const claimRows = await prisma.claim.findMany({
    where: { userId: user.id },
  });
  for (const c of claimRows) {
    const row = byMarket.get(c.marketId);
    if (row) row.claims += c.amountClaimed;
  }
  const positions = Array.from(byMarket.entries()).map(([marketId, row]) => {
    const { market, yesAmount, noAmount, claims } = row;
    const outcome: "YES" | "NO" = yesAmount > 0 ? "YES" : "NO";
    const totalPool = market.totalYes + market.totalNo;
    const winningPool = market.outcomeYes === true ? market.totalYes : market.totalNo;
    const myStake = market.outcomeYes ? yesAmount : noAmount;
    const claimable =
      market.resolved &&
      market.outcomeYes !== null &&
      myStake > 0 &&
      winningPool > 0
        ? Math.floor((totalPool * myStake) / winningPool)
        : 0;
    const hasClaimed = claims > 0;
    return {
      marketId,
      question: market.question,
      outcome,
      stakeCents: yesAmount + noAmount,
      resolved: market.resolved,
      outcomeYes: market.outcomeYes,
      hasClaimed,
      claimableCents: hasClaimed ? 0 : claimable,
    };
  });
  return NextResponse.json({ positions });
}
