import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 1. Get User ID from URL (sent by mobile)
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ data: [] });
  }

  try {
    // 2. Query DB directly (Bypassing Cookie Auth)
    const record = await prisma.schedule.findFirst({
      where: { userId: userId }
    });
    
    // 3. Also fetch latest tokens to keep phone in sync
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokens: true }
    });

    return NextResponse.json({ 
        data: record ? (record.data as any) : [],
        tokens: user?.tokens || 0 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ data: [], error: "DB Error" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, subjects } = body;

    if (!userId) return NextResponse.json({ error: "Missing User ID" }, { status: 400 });

    // Update or Create Schedule
    const existing = await prisma.schedule.findFirst({ where: { userId } });

    if (existing) {
      await prisma.schedule.update({
        where: { id: existing.id },
        data: { data: subjects }
      });
    } else {
      await prisma.schedule.create({
        data: { userId, data: subjects }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}