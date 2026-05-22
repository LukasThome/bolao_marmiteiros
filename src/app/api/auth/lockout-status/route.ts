import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  if (!email) return NextResponse.json({ locked: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { lockedUntil: true, failedLoginAttempts: true },
  });

  if (!user?.lockedUntil || user.lockedUntil <= new Date()) {
    return NextResponse.json({ locked: false, attempts: user?.failedLoginAttempts ?? 0 });
  }

  const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
  return NextResponse.json({ locked: true, remainingSeconds });
}
