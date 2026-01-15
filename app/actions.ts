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