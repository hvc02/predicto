import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function isAdmin(email: string): boolean {
  const list = process.env.ADMIN_EMAILS ?? "";
  return list.split(",").some((e) => e.trim().toLowerCase() === email.toLowerCase());
}

export async function GET() {
  const markets = await prisma.market.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
  });
  const list = markets.map((m) => ({
    id: m.id,
    question: m.question,
    totalYes: m.totalYes,
    totalNo: m.totalNo,
    resolved: m.resolved,
    outcomeYes: m.outcomeYes,
    createdAt: m.createdAt.toISOString(),
    resolvedAt: m.resolvedAt?.toISOString() ?? null,
  }));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }
  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const market = await prisma.market.create({
    data: {
      question,
      createdById: user.id,
    },
  });
  return NextResponse.json({
    id: market.id,
    question: market.question,
    totalYes: market.totalYes,
    totalNo: market.totalNo,
    resolved: market.resolved,
    outcomeYes: market.outcomeYes,
    createdAt: market.createdAt.toISOString(),
  });
}
