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
    if (diff < 60) return { error: `Wait ${Math.ceil(60 - diff)}s` };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { increment: 5 }, lastAdReward: new Date() }
  });
  return { success: true, newBalance: (user?.tokens || 0) + 5 };
}

export async function generateAiRoast(scheduleData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  // Simple roast prompt (Cost 2 tokens)
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 2) return { error: "Insufficient tokens" };

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
    return { success: true, roast: completion.choices[0]?.message?.content };
  } catch (e) { return { error: "AI Failed" }; }
}

// --- STATE-AWARE AI ACTION (UPGRADED) ---

export async function generateAiAction(userPrompt: string, currentSubjects: any[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  if (!process.env.GROQ_API_KEY) {
    return { success: false, error: "Server Misconfiguration: Missing API Key" };
  }

  // 1. Deduct Cost
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.tokens < 5) return { success: false, error: "Insufficient tokens" };

  await prisma.user.update({ where: { id: user.id }, data: { tokens: { decrement: 5 } } });

  try {
    // 2. BUILD RICH CONTEXT (The "Brain" Upgrade)
    // Instead of a flat list, we group subjects to give the AI "spatial awareness"
    // of how many sections exist for each subject.
    const groupedContext: Record<string, any[]> = {};

    currentSubjects.forEach(s => {
      if (!groupedContext[s.name]) groupedContext[s.name] = [];
      groupedContext[s.name].push({
        sectionId: s.section,
        credits: s.credits,
        times: s.classes.map((c: any) => `${c.day} ${c.start}-${c.end}`).join(", ")
      });
    });

    // 3. ENHANCED SYSTEM PROMPT
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an elite University Schedule Assistant AI with advanced natural language understanding.
Your mission: Parse ANY natural language command into precise JSON actions to modify the user's schedule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CURRENT SCHEDULE STATE (Grouped by Subject)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(groupedContext, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELLIGENCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **CONTEXT AWARENESS** - Always check the current state before acting:
   • "Add another Math section" → Check existing sections (Sec 1, Sec 2...) and create next number
   • "Add Physics" → If Physics doesn't exist, create "Sec 1"
   • "Remove Math" → Remove ALL sections of Math
   • "Update Calculus time" → Find Calculus in state and update its classes

2. **SMART TIME PARSING** - Understand various time formats:
   • "1pm" or "1 pm" → "13:00"
   • "9:30am" or "9:30 am" → "09:30"
   • "noon" → "12:00"
   • "midnight" → "00:00"
   • "morning" → "09:00"
   • "afternoon" → "14:00"
   • "evening" → "18:00"
   • If end time not specified, default to 3 hours later
   • "1pm to 3pm" → start: "13:00", end: "15:00"
   • "from 2 to 4" → start: "14:00", end: "16:00"

3. **DAY PARSING** - Recognize all day formats:
   • Full names: "Monday", "Tuesday", etc.
   • Abbreviations: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
   • Multiple days: "Mon and Wed" → [Monday, Wednesday]
   • "MWF" → [Monday, Wednesday, Friday]
   • "TTh" or "TR" → [Tuesday, Thursday]
   • "weekdays" → [Monday, Tuesday, Wednesday, Thursday, Friday]
   • "weekends" → [Saturday, Sunday]

4. **CREDIT PARSING** - Understand credit variations:
   • "3 credits", "3 credit", "3cr", "3 units" → credits: 3
   • If not specified, default to 3 credits

5. **SECTION INTELLIGENCE** - Smart section handling:
   • "Add another section" → Increment highest existing section number
   • "Add section 2" → Create specifically "Sec 2"
   • "Add lab section" → Create "Lab" section
   • "Add lecture" → Create "Lec" section

6. **UPDATE INTELLIGENCE** - Understand what to update:
   • "Change Math to Friday" → Update classes array with new day
   • "Move Physics to 2pm" → Update start time, keep duration
   • "Make Calculus 4 credits" → Update credits field
   • "Change section 1 to section A" → Update section field

7. **DELETION INTELLIGENCE** - Understand removal intent:
   • "Remove Math" → Remove ALL Math sections
   • "Delete Physics section 2" → Remove only section 2 of Physics
   • "Clear my schedule" → Remove all subjects

8. **NATURAL LANGUAGE EXAMPLES**:
   • "Add Calculus on Monday at 9am" → ADD with Monday 09:00-12:00
   • "Put Biology on TTh from 1 to 3" → ADD with Tuesday/Thursday 13:00-15:00
   • "Add another Math section on Friday afternoon" → ADD next section number, Friday 14:00-17:00
   • "Change Chemistry to Wednesday morning" → UPDATE classes to Wednesday 09:00-12:00
   • "Move English to 2pm" → UPDATE start time to 14:00, keep day and duration
   • "Make Physics 4 credits" → UPDATE credits to 4
   • "Delete History" → REMOVE all History sections
   • "I don't want classes on Friday" → FILTER with days_off: ["Friday"]
   • "No classes before 10am" → FILTER with start_time_after: "10:00"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUIRED JSON OUTPUT FORMATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **ADD** - Add a new subject or section
   {
     "action": "ADD",
     "data": {
       "name": "Subject Name",
       "section": "Sec 1",
       "credits": 3,
       "classes": [
         { "day": "Monday", "start": "09:00", "end": "12:00" },
         { "day": "Wednesday", "start": "09:00", "end": "12:00" }
       ]
     }
   }

2. **REMOVE** - Remove subject(s)
   {
     "action": "REMOVE",
     "data": {
       "name": "Exact Subject Name from State"
     }
   }

3. **UPDATE** - Modify existing subject
   {
     "action": "UPDATE",
     "data": {
       "targetName": "Exact Name from State",
       "updates": {
         "classes": [{ "day": "Friday", "start": "13:00", "end": "16:00" }],
         "credits": 4,
         "section": "Sec A"
       }
     }
   }

4. **FILTER** - Apply schedule constraints
   {
     "action": "FILTER",
     "data": {
       "days_off": ["Friday", "Saturday"],
       "start_time_after": "10:00",
       "end_time_before": "16:00"
     }
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Return ONLY valid JSON. No markdown, no explanations, no code blocks.
• Always use 24-hour time format (HH:MM)
• Day names must be capitalized: "Monday", "Tuesday", etc.
• Check current state before creating sections
• Be intelligent about user intent - if they say "add another", increment section numbers
• If time/day/credits not specified, use sensible defaults
• For updates, only include fields that are actually changing`
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