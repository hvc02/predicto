import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function isAdmin(email: string): boolean {
  const list = process.env.ADMIN_EMAILS ?? "";
  return list.split(",").some((e) => e.trim().toLowerCase() === email.toLowerCase());
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }
  const { id } = await params;
  let body: { outcomeYes?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const outcomeYes = body.outcomeYes === true || body.outcomeYes === false ? body.outcomeYes : undefined;
  if (outcomeYes === undefined) {
    return NextResponse.json({ error: "outcomeYes (boolean) is required" }, { status: 400 });
  }
  const market = await prisma.market.findUnique({ where: { id } });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.resolved) {
    return NextResponse.json({ error: "Market already resolved" }, { status: 400 });
  }
  await prisma.market.update({
    where: { id },
    data: { resolved: true, outcomeYes, resolvedAt: new Date() },
  });
  return NextResponse.json({ ok: true, outcomeYes });
}
