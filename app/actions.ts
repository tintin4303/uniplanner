"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Groq from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- TYPES ---
export interface AiResponse {
  action: "FILTER" | "ADD" | "REMOVE" | "UPDATE" | "UNKNOWN";
  data?: any;
  message?: string;
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

// --- AD REWARD ACTION ---

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

// --- STATE-AWARE AI ACTION ---

export async function generateAiAction(userPrompt: string, currentSubjects: any[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  if (!process.env.GROQ_API_KEY) {
    return { success: false, error: "Server Misconfiguration: Missing API Key" };
  }

  // Deduct Cost
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 5) return { success: false, error: "Insufficient tokens" };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 5 } } });

  try {
    // 1. Simplify the context to save tokens but keep "State Awareness"
    const context = currentSubjects.map(s => ({
        name: s.name,
        credits: s.credits,
        schedule: s.classes.map((c: any) => `${c.day} ${c.start}-${c.end}`).join(", ")
    }));

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Schedule Assistant. Analyze the user's request based on the CURRENT STATE.

          CURRENT STATE (JSON):
          ${JSON.stringify(context, null, 2)}

          --- INSTRUCTIONS ---
          * All times to 24h format (1pm -> 13:00).
          * If the user says "Change X to Y", use UPDATE.
          * If the user implies a time change (e.g. "Move Math to Monday"), use UPDATE with "classes".

          --- ACTIONS ---

          1. **ADD**
             Output: { "action": "ADD", "data": { "name": "Name", "credits": 3, "section": "1", "classes": [{ "day": "Monday", "start": "09:00", "end": "12:00" }] } }

          2. **REMOVE**
             Output: { "action": "REMOVE", "data": { "name": "Name" } }
             * Match names from CURRENT STATE.

          3. **UPDATE**
             Output: { "action": "UPDATE", "data": { "targetName": "Exact Name From State", "updates": { ... } } }
             * To change time: { "updates": { "classes": [{ "day": "Friday", "start": "13:00", "end": "16:00" }] } }

          4. **FILTER**
             Output: { "action": "FILTER", "data": { "days_off": ["Friday"], "start_time_after": "10:00" } }

          Return ONLY valid JSON.`
        },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    const result = JSON.parse(content || "{}") as AiResponse;
    
    return { success: true, result, newBalance: user.tokens - 5 };

  } catch (error) {
    console.error("AI Error:", error);
    await prisma.user.update({ where: { id: user.id }, data: { tokens: { increment: 5 } } });
    return { success: false, error: "AI Service Failed" };
  }
}