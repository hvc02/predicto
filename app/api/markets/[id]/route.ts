import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const market = await prisma.market.findUnique({
    where: { id },
    include: { createdBy: { select: { email: true } } },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  const total = market.totalYes + market.totalNo;
  const yesPrice = total > 0 ? market.totalYes / total : 0.5;
  return NextResponse.json({
    id: market.id,
    question: market.question,
    totalYes: market.totalYes,
    totalNo: market.totalNo,
    resolved: market.resolved,
    outcomeYes: market.outcomeYes,
    yesPrice,
    noPrice: 1 - yesPrice,
    createdAt: market.createdAt.toISOString(),
    resolvedAt: market.resolvedAt?.toISOString() ?? null,
  });
}
