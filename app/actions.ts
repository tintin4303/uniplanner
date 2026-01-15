"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Groq from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- TYPES ---
export interface AiFilter {
  days_off?: string[];
  start_time_after?: string;
  end_time_before?: string;
  same_day?: string[];
}

// --- DATABASE ACTIONS ---

export async function saveScheduleToDB(subjects: any[]) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  const userId = (session.user as any).id;

  const existing = await prisma.schedule.findFirst({
    where: { userId: userId }
  });

  if (existing) {
    await prisma.schedule.update({
      where: { id: existing.id },
      data: { data: subjects as any }
    });
  } else {
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

// --- TOKEN SYSTEM ACTIONS ---

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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.tokens < amount) {
    return { success: false, error: "Insufficient tokens" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { decrement: amount } }
  });

  return { success: true, newBalance: user.tokens - amount };
}

// --- AD REWARD ACTION (With Rate Limiting) ---

export async function rewardTokens() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { error: "Unauthorized" };

  const userId = (session.user as any).id;
  const COOLDOWN_SECONDS = 60; // User can watch 1 ad per minute
  const REWARD_AMOUNT = 5;

  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { lastAdReward: true, tokens: true }
  });

  if (!user) return { error: "User not found" };

  // Check Cooldown
  if (user.lastAdReward) {
    const now = new Date();
    const diff = (now.getTime() - user.lastAdReward.getTime()) / 1000;
    
    if (diff < COOLDOWN_SECONDS) {
      return { 
        success: false, 
        error: `Please wait ${Math.ceil(COOLDOWN_SECONDS - diff)}s before next ad.` 
      };
    }
  }

  // Grant Reward
  await prisma.user.update({
    where: { id: userId },
    data: { 
      tokens: { increment: REWARD_AMOUNT },
      lastAdReward: new Date()
    }
  });
  
  return { success: true, newBalance: user.tokens + REWARD_AMOUNT };
}

// --- AI GENERATION ACTION ---

export async function generateAiFilter(userPrompt: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  // 1. Check API Key
  if (!process.env.GROQ_API_KEY) {
    return { success: false, error: "Server Misconfiguration: Missing API Key" };
  }

  // 2. Deduct Cost
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 5) return { success: false, error: "Insufficient tokens" };

  await prisma.user.update({
    where: { id: user.id },
    data: { tokens: { decrement: 5 } }
  });

  // 3. Call AI (Using Llama 3.3)
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a scheduler assistant. Convert the user's request into a JSON filter object.
          
          Available JSON fields:
          - "days_off": array of strings (Full days: "Monday", "Tuesday", etc.)
          - "start_time_after": string "HH:MM" (24h)
          - "end_time_before": string "HH:MM" (24h)
          - "same_day": array of strings (Extract subject codes that MUST be on the same day. e.g. ["CSX4110", "ITX3004"])

          Example 1: "I hate mornings and want fridays off"
          Output: { "start_time_after": "11:00", "days_off": ["Friday"] }

          Example 2: "Put CSX4210 and MGT1101 on the same day"
          Output: { "same_day": ["CSX4210", "MGT1101"] }

          Return ONLY valid JSON.`
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    const filter = JSON.parse(content || "{}");
    
    return { success: true, filter, newBalance: user.tokens - 5 };
  } catch (error) {
    console.error("AI Error:", error);
    // Refund tokens on error
    await prisma.user.update({ where: { id: user.id }, data: { tokens: { increment: 5 } } });
    return { success: false, error: "AI Service Failed" };
  }
}