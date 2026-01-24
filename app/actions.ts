"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import Groq from "groq-sdk";
import { rateLimit } from "@/app/lib/ratelimit";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- TYPES ---
export interface AiResponse {
  action: "FILTER" | "ADD" | "REMOVE" | "UPDATE" | "BATCH" | "UNKNOWN";
  data?: any;
  message?: string;
}

// ==========================================
// 1. SAVE SLOTS MANAGEMENT
// ==========================================

export async function getSaveSlots() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  const userId = (session.user as any).id;

  // Ensure at least one slot exists
  const count = await prisma.schedule.count({ where: { userId } });
  if (count === 0) {
    await prisma.schedule.create({
      data: { userId, name: "My Plan 1", data: [], isActive: true }
    });
  }

  return await prisma.schedule.findMany({
    where: { userId },
    select: { id: true, name: true, isActive: true, updatedAt: true },
    orderBy: { createdAt: 'asc' }
  });
}

export async function switchSaveSlot(slotId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  // Deactivate all, Activate target
  await prisma.$transaction([
    prisma.schedule.updateMany({ where: { userId }, data: { isActive: false } }),
    prisma.schedule.update({ where: { id: slotId, userId }, data: { isActive: true } })
  ]);

  const slot = await prisma.schedule.findUnique({ where: { id: slotId } });
  return { success: true, data: slot?.data };
}

export async function createSaveSlot(name: string, currentData: any[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.tokens < 50) return { error: "Insufficient tokens (50 required)" };

  await prisma.user.update({ where: { id: userId }, data: { tokens: { decrement: 50 } } });

  // Create new active slot
  await prisma.schedule.updateMany({ where: { userId }, data: { isActive: false } });
  await prisma.schedule.create({
    data: { userId, name, data: currentData as any, isActive: true }
  });

  return { success: true };
}

export async function saveScheduleToDB(subjects: any[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Not authenticated" };
  const userId = (session.user as any).id;

  // Update the currently active slot
  const active = await prisma.schedule.findFirst({ where: { userId, isActive: true } });

  if (active) {
    await prisma.schedule.update({
      where: { id: active.id },
      data: { data: subjects as any }
    });
  } else {
    // Fallback: Create one if missing
    await prisma.schedule.create({
      data: { userId, name: "My Plan 1", data: subjects as any, isActive: true }
    });
  }
  return { success: true };
}

export async function loadScheduleFromDB() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as any).id;

  const record = await prisma.schedule.findFirst({ where: { userId, isActive: true } });
  return record ? (record.data as any) : null;
}

// ==========================================
// 2. THEME SYSTEM
// ==========================================

export async function buyTheme(themeId: string, cost: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  if (user.unlockedThemes.includes(themeId)) return { success: true };
  if (user.tokens < cost) return { error: "Insufficient tokens" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      tokens: { decrement: cost },
      unlockedThemes: { push: themeId }
    }
  });

  return { success: true };
}

export async function getUnlockedThemes() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return ["default"];
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { unlockedThemes: true } });
  return user?.unlockedThemes || ["default"];
}

// ==========================================
// 3. AI & TOKENS (Keep existing logic)
// ==========================================

export async function getUserTokens() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return 0;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { tokens: true } });
  return user?.tokens || 0;
}

export async function rewardTokens() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  const userId = (session.user as any).id;

  // Simple cooldown check
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.lastAdReward) {
    const diff = (new Date().getTime() - user.lastAdReward.getTime()) / 1000;
    if (diff < 30) return { error: `Wait ${Math.ceil(30 - diff)}s` };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { increment: 50 }, lastAdReward: new Date() }
  });
  return { success: true, newBalance: (user?.tokens || 0) + 50 };
}

export async function generateAiRoast(scheduleData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  // Simple roast prompt (Cost 2 tokens)
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 2) return { error: "Insufficient tokens" };

  // Rate Limit: 5 roasts per minute
  const limit = await rateLimit(`roast:${user.id}`, 5, "60 s");
  if (!limit.success) return { error: "Too many requests. Please wait." };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 2 } } });

  try {
    const completion = await groq.chat.completions.create({
      messages: [{
        role: "system",
        content: "You are a mean, funny college senior roasting a freshman's schedule. Be brief (max 2 sentences). Mention specific bad decisions (8am classes, Friday classes, too many credits)."
      }, {
        role: "user",
        content: JSON.stringify(scheduleData)
      }],
      model: "llama-3.3-70b-versatile",
    });
    return { success: true, roast: completion.choices[0]?.message?.content, newBalance: user.tokens - 2 };
  } catch (e) { return { error: "AI Failed" }; }
}

// --- AI VIBE CHECK (New) ---
export async function generateAiVibeCheck(scheduleData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 2) return { error: "Insufficient tokens" };

  // Rate Limit: 5 vibes per minute
  const limit = await rateLimit(`vibe:${user.id}`, 5, "60 s");
  if (!limit.success) return { error: "Too many requests. Please wait." };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 2 } } });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a creative analyzer of college schedules.
          Analyze the user's schedule (JSON) and assign them a "Student Persona".
          Return JSON ONLY:
          {
            "persona": "Short Creative Title (e.g. The Caffeine Zombie)",
            "description": "2 sentence witty explanation of why based on data.",
            "score": 85 (Survival Probability 0-100),
            "emoji": "🧟‍♂️"
          }`
        },
        { role: "user", content: JSON.stringify(scheduleData) }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    const result = JSON.parse(content || "{}");

    return { success: true, result, newBalance: user.tokens - 2 };
  } catch (e) {
    // Refund on error
    await prisma.user.update({ where: { id: user.id }, data: { tokens: { increment: 2 } } });
    return { error: "AI Failed" };
  }
}

// --- AI SURVIVAL GUIDE (New) ---
export async function generateAiSurvivalGuide(scheduleData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 2) return { error: "Insufficient tokens" };

  // Rate Limit: 5 guides per minute
  const limit = await rateLimit(`guide:${user.id}`, 5, "60 s");
  if (!limit.success) return { error: "Too many requests. Please wait." };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 2 } } });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a battle-hardened college senior giving "Survival Tips" based on a schedule.
          Analyze the schedule (JSON) for:
          - 8am classes (Pain)
          - No lunch breaks (Starvation)
          - Late Friday classes (Social suicide)
          - Long gaps (Awkward waiting)
          - Back-to-back classes across campus (Sprinting)

          Return JSON ONLY:
          {
            "tips": [
              "Tip 1: Witty observation + advice",
              "Tip 2: ...",
              "Tip 3: ...",
              "Tip 4: ...",
              "Tip 5: ..."
            ]
          }
          Max 5 tips. Be funny but helpful.`
        },
        { role: "user", content: JSON.stringify(scheduleData) }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    const result = JSON.parse(content || "{}");

    return { success: true, result, newBalance: user.tokens - 2 };
  } catch (e) {
    // Refund on error
    await prisma.user.update({ where: { id: user.id }, data: { tokens: { increment: 2 } } });
    return { error: "AI Failed" };
  }
}


// --- STATE-AWARE AI ACTION (UPGRADED) ---

export async function generateAiAction(userPrompt: string, currentSubjects: any[], conflicts?: any[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  if (!process.env.GROQ_API_KEY) {
    return { success: false, error: "Server Misconfiguration: Missing API Key" };
  }

  // 1. Deduct Cost
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 5) return { success: false, error: "Insufficient tokens" };

  // Rate Limit: 10 AI actions per minute
  const limit = await rateLimit(`ai:${(session.user as any).id}`, 10, "60 s");
  if (!limit.success) return { success: false, error: "Rate limit exceeded. Try again later." };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 5 } } });

  try {
    // 2. BUILD RICH CONTEXT (The "Brain" Upgrade)
    const groupedContext: Record<string, any[]> = {};

    currentSubjects.forEach(s => {
      if (!groupedContext[s.name]) groupedContext[s.name] = [];
      groupedContext[s.name].push({
        sectionId: s.section,
        credits: s.credits,
        times: s.classes.map((c: any) => `${c.day} ${c.start}-${c.end}`).join(", ")
      });
    });

    const conflictContext = conflicts && conflicts.length > 0
      ? `\n⚠️ DETECTED CONFLICTS:\n${JSON.stringify(conflicts, null, 2)}`
      : "✅ No conflicts detected.";

    // 3. ENHANCED SYSTEM PROMPT
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite University Schedule Assistant AI.
Your mission: Parse natural language commands into precise JSON actions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT SCHEDULE STATE (Grouped by Subject)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(groupedContext, null, 2)}

${conflictContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELLIGENCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **OBEDIENCE OVER OPINION**: You are an assistant, not a blocker.
   - If the user says "Add class on Sunday", DO IT. Do not complain about feasibility.
   - If the user says "Add class at 3am", DO IT.
   - Only return "UNKNOWN" if the request is technically impossible (e.g., "Add class at 25:00" or empty prompt).

2. **BATCH OPERATIONS**: If the user asks for multiple things or a complex fix (like "Fix my conflicts"), return a "BATCH" action containing a list of sub-actions.
   Example: "Add Math and Remove Physics" -> BATCH action with one ADD and one REMOVE.

3. **CONFLICT RESOLUTION**: If asked to "Fix conflicts", analyze the conflicts provided. Move one of the conflicting subjects to a different time/section (UPDATE) or remove it (REMOVE) if no other options exist.

4. **CONTEXT AWARENESS**: Check existing sections.
   - "Add another Math" -> Increment section number.
   - "Remove Math" -> Remove ALL sections of Math.

5. **SMART TIME PARSING**:
   - "1pm" -> "13:00", "noon" -> "12:00".
   - "MWF" -> Monday, Wednesday, Friday.
   - "Weekends" -> Saturday, Sunday.

6. **NATURAL LANGUAGE MAPPING**:
   - "Move X to Y" -> UPDATE action on X with new times.
   - "Swap X and Y" -> BATCH action. Step 1: UPDATE X to Y's times. Step 2: UPDATE Y to X's times.
   - "Reschedule X" -> UPDATE action with new times.

7. **DESCRIPTIVE FEEDBACK**:
   - You MUST return a "message" field describing exactly what you did in human terms.
   - Good: "I moved Math to Tuesday at 2pm."
   - Bad: "Updated."
   - Good: "Swapped Calculus and Physics times."

8. **IMPOSSIBLE REQUESTS**:
   - Time > 24:00 is impossible.
   - nonsensical requests ("Make me a sandwich").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUIRED JSON OUTPUT FORMATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **ADD**
   { "action": "ADD", "data": { "name": "Math", "section": "1", "credits": 3, "classes": [{ "day": "Mon", "start": "09:00", "end": "10:00" }] } }

2. **REMOVE**
   { "action": "REMOVE", "data": { "name": "Math" } }

3. **UPDATE**
   { "action": "UPDATE", "data": { "targetName": "Math", "updates": { "classes": [{ "day": "Tue", "start": "14:00", "end": "16:00" }] } } }
   *IMPORTANT*: Do NOT use "times" string. You MUST convert it to "classes" array structure.

4. **FILTER**
   { "action": "FILTER", "data": { "blocked_times": [{ "day": "Tue", "start": "12:00", "end": "14:00" }] } }

5. **BATCH** (For multiple actions)
   {
     "action": "BATCH",
     "data": {
       "actions": [
         { "action": "REMOVE", "data": { "name": "Conflict Subject" } },
         { "action": "ADD", "data": { "name": "New Subject", ... } }
       ]
     },
     "message": "I've removed the conflicting class and added the new one."
   }

6. **UNKNOWN** (Failure/Refusal)
   { "action": "UNKNOWN", "message": "I can't do that because..." }`
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
    // Refund tokens on error
    await prisma.user.update({ where: { id: user.id }, data: { tokens: { increment: 5 } } });
    return { success: false, error: "AI Service Failed" };
  }
}