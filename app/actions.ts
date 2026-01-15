"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function saveScheduleToDB(subjects: any[]) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  const userId = (session.user as any).id;

  // Check if user already has a schedule
  const existing = await prisma.schedule.findFirst({
    where: { userId: userId }
  });

  if (existing) {
    // Update existing
    await prisma.schedule.update({
      where: { id: existing.id },
      data: { data: subjects as any } // Cast to any for JSON compatibility
    });
  } else {
    // Create new
    await prisma.schedule.create({
      data: {
        userId: userId,
        data: subjects as any
      }
    });
  }
  
  return { success: true };
}

export async function loadScheduleFromDB() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) return null;

  const userId = (session.user as any).id;

  const record = await prisma.schedule.findFirst({
    where: { userId: userId }
  });

  return record ? (record.data as any) : null;
}

export async function getUserTokens() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return 0;

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { tokens: true }
  });

  return user?.tokens || 0;
}

export async function spendTokens(amount: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const userId = (session.user as any).id;

  // 1. Check Balance
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.tokens < amount) {
    return { success: false, error: "Insufficient tokens" };
  }

  // 2. Deduct Tokens
  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { decrement: amount } }
  });

  return { success: true, newBalance: user.tokens - amount };
}

export async function rewardTokens(amount: number) {
  // In a real app, verify the Ad provider's signature here to prevent cheating!
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return;

  const userId = (session.user as any).id;

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { increment: amount } }
  });
  
  return { success: true };
}